import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../../dtos/auth/register.dto';
import { VerifyOtpDto } from '../../dtos/auth/verify-otp.dto';
import { LoginDto } from '../../dtos/auth/login.dto';
import { ResendOtpDto } from '../../dtos/auth/resend-otp.dto';
import type { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { BusinessException } from '../../exceptions/business.exception';
import { PrismaService } from '../../../infrastructure/services/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Register a new user.
     * - Check for duplicate email/phone
     * - Hash password with bcrypt
     * - Create user with 'pending' status
     * - Generate and store OTP for phone verification
     */
    async register(dto: RegisterDto): Promise<{ userId: number; message: string }> {
        // Step 1: Check if email already exists
        if (dto.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existing) {
                throw new BusinessException('Email already registered');
            }
        }

        // Step 2: Hash password if provided
        let passwordHash: string | null = null;
        if (dto.password) {
            passwordHash = await bcrypt.hash(dto.password, 10);
        }

        // Step 3: Create user in pending status
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email || null,
                phoneNumber: dto.phoneNumber || null,
                passwordHash,
                role: (dto.role as any) || 'customer',
                status: 'pending',
            },
        });

        // Step 4: Generate a 4-digit OTP and store it
        if (dto.phoneNumber) {
            const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            await this.prisma.otpSession.create({
                data: {
                    userId: user.id,
                    phoneNumber: dto.phoneNumber,
                    otpCode,
                    purpose: 'registration' as any,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                },
            });
            // In production, send via SMS service
            console.log(`[OTP] Code ${otpCode} sent to ${dto.phoneNumber}`);
        }

        return { userId: user.id, message: 'User registered successfully. Please verify OTP.' };
    }

    /**
     * Verify the OTP sent during registration.
     * - Find valid, unused OTP session
     * - Mark user as active
     * - Return a real JWT token
     */
    async verifyOtp(dto: VerifyOtpDto): Promise<{ token: string; user: any }> {
        // Step 1: Find valid OTP session
        const otpSession = await this.prisma.otpSession.findFirst({
            where: {
                phoneNumber: dto.phoneNumber,
                otpCode: dto.otpCode,
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpSession) {
            throw new BusinessException('Invalid or expired OTP');
        }

        // Step 2: Mark OTP as used
        await this.prisma.otpSession.update({
            where: { id: otpSession.id },
            data: { isUsed: true },
        });

        // Step 3: Activate user
        if (otpSession.userId) {
            await this.prisma.user.update({
                where: { id: otpSession.userId },
                data: { status: 'active', isPhoneVerified: true },
            });

            const user = await this.prisma.user.findUnique({
                where: { id: otpSession.userId },
            });

            // Step 4: Sign and return a real JWT
            const payload = { sub: user!.id, role: user!.role, email: user!.email };
            const token = this.jwtService.sign(payload);

            return {
                token,
                user: { id: user!.id, role: user!.role, email: user!.email, fullName: user!.fullName },
            };
        }

        throw new BusinessException('OTP session has no associated user');
    }

    /**
     * Login with email and password.
     * - Validate credentials
     * - Return JWT on success
     */
    async login(dto: LoginDto): Promise<{ token: string; user: any }> {
        // Step 1: Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Step 2: Check user is active
        if (user.status !== 'active') {
            throw new BusinessException('Account is not active. Please verify your phone number.');
        }

        // Step 3: Verify password with bcrypt
        if (user.passwordHash) {
            const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid email or password');
            }
        }

        // Step 4: Sign JWT
        const payload = { sub: user.id, role: user.role, email: user.email };
        const token = this.jwtService.sign(payload);

        return {
            token,
            user: { id: user.id, role: user.role, email: user.email, fullName: user.fullName },
        };
    }

    /**
     * Resend OTP to a phone number.
     * - Invalidate old OTPs
     * - Generate and store a new OTP
     */
    async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
        // Step 1: Find user by phone number
        const user = await this.prisma.user.findFirst({
            where: { phoneNumber: dto.phoneNumber },
        });

        // Step 2: Invalidate old unused OTPs
        await this.prisma.otpSession.updateMany({
            where: { phoneNumber: dto.phoneNumber, isUsed: false },
            data: { isUsed: true },
        });

        // Step 3: Generate new OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        await this.prisma.otpSession.create({
            data: {
                userId: user?.id || null,
                phoneNumber: dto.phoneNumber,
                otpCode,
                purpose: ((dto as any).purpose || 'registration') as any,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        console.log(`[OTP] New code ${otpCode} sent to ${dto.phoneNumber}`);
        return { message: 'OTP resent successfully' };
    }
}

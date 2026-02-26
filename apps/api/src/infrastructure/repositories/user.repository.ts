import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<any> {
        return this.prisma.user.findUnique({
            where: { id: parseInt(id, 10) }
        });
    }

    async save(user: any): Promise<void> {
        const data = {
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            passwordHash: user.passwordHash,
            role: user.role,
            status: user.status,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified
        };

        if (user.id) {
            await this.prisma.user.update({
                where: { id: parseInt(user.id.toString(), 10) },
                data
            });
        } else {
            await this.prisma.user.create({
                data
            });
        }
    }
}

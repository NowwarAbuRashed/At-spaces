import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../../application/services/auth/auth.service';
import { RegisterDto } from '../../../application/dtos/auth/register.dto';
import { VerifyOtpDto } from '../../../application/dtos/auth/verify-otp.dto';
import { LoginDto } from '../../../application/dtos/auth/login.dto';
import { ResendOtpDto } from '../../../application/dtos/auth/resend-otp.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user (customer/vendor)' })
    @ApiResponse({ status: 201, description: 'User registered successfully. Returns userId and message.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP code for phone numbers' })
    @ApiResponse({ status: 200, description: 'Returns JWT token and user info.' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login using email/password' })
    @ApiResponse({ status: 200, description: 'Returns JWT token and user info.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('resend-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend OTP to phone number' })
    @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
    async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
        return this.authService.resendOtp(resendOtpDto);
    }
}

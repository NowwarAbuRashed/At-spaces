import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../../../domain/enums/otp-purpose.enum';

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    otpCode: string;

    @IsEnum(OtpPurpose)
    @IsNotEmpty()
    purpose: OtpPurpose;
}

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../../../domain/enums/otp-purpose.enum';

export class ResendOtpDto {
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsEnum(OtpPurpose)
    @IsNotEmpty()
    purpose: OtpPurpose;
}

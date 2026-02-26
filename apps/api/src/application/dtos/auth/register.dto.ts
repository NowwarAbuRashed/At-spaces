import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../domain/enums/user-role.enum';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.customer;
}

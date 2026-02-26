import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}

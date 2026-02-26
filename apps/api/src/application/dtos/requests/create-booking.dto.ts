import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';

export class CreateBookingDto {
    @IsUUID()
    vendorServiceId: string;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;
}

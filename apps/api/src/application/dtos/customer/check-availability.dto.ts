import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckAvailabilityDto {
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    vendorServiceId: number;

    @IsDateString()
    @IsNotEmpty()
    startTime: string;

    @IsDateString()
    @IsNotEmpty()
    endTime: string;

    @IsInt()
    @Min(1)
    @IsNotEmpty()
    @Type(() => Number)
    quantity: number;
}

import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PriceUnit } from '../../../domain/enums/price-unit.enum';

export class UpdatePriceDto {
    @IsNumber()
    @IsNotEmpty()
    pricePerUnit: number;

    @IsEnum(PriceUnit)
    @IsNotEmpty()
    priceUnit: PriceUnit;
}

export class RequestCapacityDto {
    @IsNumber()
    @IsNotEmpty()
    newCapacity: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsOptional()
    vendorId?: number;

    @IsOptional()
    branchId?: number;
}

export class UpdateAvailabilityDto {
    @IsNotEmpty()
    vendorServiceId: number;

    @IsString()
    @IsNotEmpty()
    date: string;

    @IsOptional()
    @IsString()
    startTime?: string;

    @IsOptional()
    @IsString()
    endTime?: string;

    @IsNumber()
    @IsNotEmpty()
    availableUnits: number;

    @IsOptional()
    isBlocked?: boolean;

    @IsOptional()
    slots?: any[];
}


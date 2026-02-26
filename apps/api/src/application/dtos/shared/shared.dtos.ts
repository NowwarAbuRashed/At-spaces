import { IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiRecommendDto {
    @IsString()
    @IsNotEmpty()
    query: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsDateString()
    @IsNotEmpty()
    time: string;

    @IsInt()
    @IsNotEmpty()
    duration: number;
}

export class UpdateBranchFacilitiesDto {
    @IsArray()
    @IsNotEmpty()
    facilities: Array<{ facilityId: number; isAvailable: boolean; description?: string }>;
}

export class UpdateServiceFeaturesDto {
    @IsArray()
    @IsNotEmpty()
    features: Array<{ featureId: number; quantity: number }>;
}

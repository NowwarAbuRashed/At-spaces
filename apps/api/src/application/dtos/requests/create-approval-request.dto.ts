import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RequestType } from '../../../domain/enums/request-type.enum';

export class CreateApprovalRequestDto {
    @IsUUID()
    branchId: string;

    @IsOptional()
    @IsUUID()
    serviceId?: string;

    @IsEnum(RequestType)
    requestType: RequestType;

    @IsOptional()
    @IsString()
    oldValue?: string;

    @IsNotEmpty()
    @IsString()
    newValue: string;

    @IsOptional()
    @IsString()
    reason?: string;
}

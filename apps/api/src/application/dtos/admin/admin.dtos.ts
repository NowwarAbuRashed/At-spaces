import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewApprovalRequestDto {
    @IsEnum(['approved', 'rejected'])
    @IsNotEmpty()
    decision: 'approved' | 'rejected';

    @IsString()
    @IsOptional()
    reviewNotes?: string;
}

export class UpdateBranchStatusDto {
    @IsEnum(['active', 'suspended'])
    @IsNotEmpty()
    status: 'active' | 'suspended';
}

export class UpdateVendorStatusDto {
    @IsEnum(['active', 'suspended'])
    @IsNotEmpty()
    status: 'active' | 'suspended';
}

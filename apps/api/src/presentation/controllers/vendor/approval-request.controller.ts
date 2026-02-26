import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateApprovalRequestDto } from '../../../application/dtos/requests/create-approval-request.dto';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
// import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../../common/guards/roles.guard';
// import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('vendor/approval-requests')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class VendorApprovalController {
    constructor(private readonly approvalRequestService: ApprovalRequestService) { }

    @Post()
    // @Roles('vendor')
    async create(
        @Body() dto: CreateApprovalRequestDto,
        @Req() req: any,
    ) {
        const vendorId = req.user?.id || 'dummy-vendor-id'; // Assume injected by guard
        return this.approvalRequestService.createRequest(vendorId, dto);
    }
}

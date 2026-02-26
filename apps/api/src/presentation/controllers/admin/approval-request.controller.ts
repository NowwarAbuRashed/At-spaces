import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
// import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../../common/guards/roles.guard';
// import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('admin/approval-requests')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class AdminApprovalController {
    constructor(private readonly approvalRequestService: ApprovalRequestService) { }

    @Get()
    // @Roles('admin')
    async listPending() {
        return this.approvalRequestService.getPendingRequests();
    }

    @Post(':id/approve')
    // @Roles('admin')
    async approve(
        @Param('id') id: string,
        @Body('notes') notes: string,
        @Req() req: any,
    ) {
        const adminId = req.user?.id || 'dummy-admin-id'; // Assume injected by guard
        return this.approvalRequestService.approveRequest(id, adminId, notes);
    }

    @Post(':id/reject')
    // @Roles('admin')
    async reject(
        @Param('id') id: string,
        @Body('notes') notes: string,
        @Req() req: any,
    ) {
        const adminId = req.user?.id || 'dummy-admin-id';
        return this.approvalRequestService.rejectRequest(id, adminId, notes);
    }
}

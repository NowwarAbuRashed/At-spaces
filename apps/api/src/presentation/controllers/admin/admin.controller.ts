import { Controller, Get, Post, Patch, Body, Param, Query, Request, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminLogicService } from '../../../application/services/admin/admin-logic.service';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
import { AuditService } from '../../../application/services/audit.service';
import { ReviewApprovalRequestDto, UpdateBranchStatusDto, UpdateVendorStatusDto } from '../../../application/dtos/admin/admin.dtos';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
    constructor(
        private readonly adminLogicService: AdminLogicService,
        private readonly approvalRequestService: ApprovalRequestService,
        private readonly auditService: AuditService,
    ) { }

    @Get('approval-requests')
    @ApiOperation({ summary: 'View pending approval requests' })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
    async getApprovalRequests(@Query('status') status?: string) {
        if (status === 'pending' || !status) {
            return this.approvalRequestService.getPendingRequests();
        }
        return [];
    }

    @Post('approval-requests/:id/review')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Approve or reject a request' })
    async reviewApprovalRequest(@Request() req: any, @Param('id') id: number, @Body() dto: ReviewApprovalRequestDto) {
        const adminId = (dto as any).adminId || req.user?.id || 1;

        if (dto.decision === 'approved') {
            await this.approvalRequestService.approveRequest(id.toString(), adminId.toString(), dto.reviewNotes);
        } else {
            await this.approvalRequestService.rejectRequest(id.toString(), adminId.toString(), dto.reviewNotes);
        }

        // Log the admin action to the audit trail
        await this.auditService.logAction(
            typeof adminId === 'number' ? adminId : parseInt(adminId, 10),
            dto.decision === 'approved' ? 'APPROVED_REQUEST' : 'REJECTED_REQUEST',
            'ApprovalRequest',
            id,
            { reviewNotes: dto.reviewNotes },
            req.ip || req.connection?.remoteAddress,
        );

        return { message: `Request successfully ${dto.decision}` };
    }

    @Get('branches')
    @ApiOperation({ summary: 'Manage and list all branches' })
    async getBranches() {
        return this.adminLogicService.getBranches();
    }

    @Patch('branches/:id/status')
    @ApiOperation({ summary: 'Update branch status' })
    async updateBranchStatus(@Request() req: any, @Param('id') id: number, @Body() dto: UpdateBranchStatusDto) {
        await this.adminLogicService.updateBranchStatus(id, dto.status);

        // Log the admin action
        const adminId = req.user?.id || 1;
        await this.auditService.logAction(
            adminId,
            'UPDATED_BRANCH_STATUS',
            'Branch',
            id,
            { newStatus: dto.status },
            req.ip,
        );

        return { message: "Branch status updated" };
    }

    @Get('vendors')
    @ApiOperation({ summary: 'List all vendors' })
    async getVendors() {
        return this.adminLogicService.getVendors();
    }

    @Patch('vendors/:id/status')
    @ApiOperation({ summary: 'Update vendor status' })
    async updateVendorStatus(@Request() req: any, @Param('id') id: number, @Body() dto: UpdateVendorStatusDto) {
        const userStatus = dto.status === 'active' ? UserStatus.active : UserStatus.suspended;
        await this.adminLogicService.updateVendorStatus(id, userStatus);

        // Log the admin action
        const adminId = req.user?.id || 1;
        await this.auditService.logAction(
            adminId,
            'UPDATED_VENDOR_STATUS',
            'Vendor',
            id,
            { newStatus: dto.status },
            req.ip,
        );

        return { message: "Vendor status updated" };
    }

    @Get('analytics')
    @ApiOperation({ summary: 'View platform analytics' })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    async getAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
        return this.adminLogicService.getAnalytics(from, to);
    }

    /**
     * Audit trail endpoint — view all admin activity logs.
     * Filterable by adminId, action, entityType.
     */
    @Get('audit-logs')
    @ApiOperation({ summary: 'View admin activity audit trail' })
    @ApiQuery({ name: 'adminId', required: false })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'entityType', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAuditLogs(
        @Query('adminId') adminId?: string,
        @Query('action') action?: string,
        @Query('entityType') entityType?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.getAuditTrail({
            adminId: adminId ? parseInt(adminId, 10) : undefined,
            action,
            entityType,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }
}

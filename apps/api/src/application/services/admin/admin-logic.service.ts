import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
import type { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserStatus } from '../../../domain/enums/user-status.enum';

@Injectable()
export class AdminLogicService {
    constructor(
        private readonly approvalRequestService: ApprovalRequestService,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        // BranchRepository for branches
    ) { }

    async getBranches(): Promise<any[]> {
        return [
            { id: 1, name: "WeWork Abdali", vendor: "WeWork", status: "active" }
        ];
    }

    async updateBranchStatus(branchId: number, status: string): Promise<void> {
        // Find branch and update status
    }

    async getVendors(): Promise<any[]> {
        // Query users with role vendor
        return [
            { id: 2, fullName: "Ahmad Doe", branch: "WeWork Abdali", status: "active" }
        ];
    }

    async updateVendorStatus(vendorId: number, status: UserStatus): Promise<void> {
        const vendor = await this.userRepository.findById(vendorId.toString());
        if (!vendor || vendor.role !== UserRole.vendor) throw new NotFoundException('Vendor not found');

        vendor.status = status;
        await this.userRepository.save(vendor);
    }

    async getAnalytics(from?: string, to?: string): Promise<any> {
        return {
            totalBookings: 1540,
            occupancyRate: 0.75,
            revenue: 25000.50,
            topCities: ['Amman', 'Irbid']
        };
    }
}

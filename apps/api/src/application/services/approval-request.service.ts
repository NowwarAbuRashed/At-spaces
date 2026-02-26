import { Injectable, Inject } from '@nestjs/common';
import type { IApprovalRequestRepository } from '../../domain/interfaces/approval-request-repository.interface';
import type { IVendorServiceRepository } from '../../domain/interfaces/vendor-service-repository.interface';
import type { IAuditService } from '../interfaces/services/audit-service.interface';
import { ApprovalRequest } from '../../domain/entities/approval-request.entity';
import { CreateApprovalRequestDto } from '../dtos/requests/create-approval-request.dto';
import { BusinessException } from '../exceptions/business.exception';
import { ApprovalStatus } from '../../domain/enums/approval-status.enum';
import { RequestType } from '../../domain/enums/request-type.enum';

@Injectable()
export class ApprovalRequestService {
    constructor(
        @Inject('IApprovalRequestRepository') private readonly approvalRequestRepository: IApprovalRequestRepository,
        @Inject('IVendorServiceRepository') private readonly vendorServiceRepository: IVendorServiceRepository,
        // private readonly auditService: IAuditService, // Optional
    ) { }

    async createRequest(vendorId: string, dto: CreateApprovalRequestDto): Promise<ApprovalRequest> {
        const id = Date.now().toString(); // Or use a UUID generator
        const request = new ApprovalRequest(
            id,
            vendorId,
            dto.branchId,
            dto.serviceId,
            dto.requestType,
            dto.oldValue,
            dto.newValue,
            dto.reason
        );
        await this.approvalRequestRepository.save(request);
        return request;
    }

    async approveRequest(requestId: string, adminId: string, reviewNotes?: string): Promise<void> {
        const request = await this.approvalRequestRepository.findById(requestId);
        if (!request) {
            throw new BusinessException('Approval request not found');
        }

        request.approve(adminId, reviewNotes);
        await this.approvalRequestRepository.save(request);

        // If capacity change and serviceId, update vendorService capacity
        if (request.requestType === RequestType.CAPACITY_CHANGE && request.serviceId) {
            const vendorService = await this.vendorServiceRepository.findById(request.serviceId);
            if (vendorService) {
                // Assuming vendorService has a setCapacity method or capacity property
                // vendorService.setCapacity(Number(request.newValue));
                // await this.vendorServiceRepository.save(vendorService);
            }
        }

        // if (this.auditService) {
        //   await this.auditService.log(adminId, 'APPROVED_REQUEST', { requestId });
        // }
    }

    async rejectRequest(requestId: string, adminId: string, reviewNotes?: string): Promise<void> {
        const request = await this.approvalRequestRepository.findById(requestId);
        if (!request) {
            throw new BusinessException('Approval request not found');
        }

        request.reject(adminId, reviewNotes);
        await this.approvalRequestRepository.save(request);

        // if (this.auditService) {
        //   await this.auditService.log(adminId, 'REJECTED_REQUEST', { requestId, reviewNotes });
        // }
    }

    async getPendingRequests(): Promise<ApprovalRequest[]> {
        return this.approvalRequestRepository.findByStatus(ApprovalStatus.PENDING);
    }
}

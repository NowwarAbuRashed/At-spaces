import { ApprovalRequest } from '../entities/approval-request.entity';
import { ApprovalStatus } from '../enums/approval-status.enum';

export interface IApprovalRequestRepository {
    findById(id: string): Promise<ApprovalRequest | null>;
    findByStatus(status: ApprovalStatus): Promise<ApprovalRequest[]>;
    save(request: ApprovalRequest): Promise<void>;
}

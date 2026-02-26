import { DomainException } from '../exceptions/domain.exception';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { RequestType } from '../enums/request-type.enum';

export class ApprovalRequest {
    id: string;
    vendorId: string;
    branchId: string;
    serviceId?: string | null;
    requestType: RequestType;
    oldValue?: string | null;
    newValue: string;
    reason?: string | null;
    private _status: ApprovalStatus;
    createdAt: Date;
    reviewedBy?: string | null;
    reviewNotes?: string | null;
    reviewedAt?: Date | null;

    constructor(
        id: string,
        vendorId: string,
        branchId: string,
        serviceId: string | null = null,
        requestType: RequestType,
        oldValue: string | null = null,
        newValue: string,
        reason: string | null = null,
        status: ApprovalStatus = ApprovalStatus.PENDING,
        createdAt: Date = new Date(),
        reviewedBy: string | null = null,
        reviewNotes: string | null = null,
        reviewedAt: Date | null = null,
    ) {
        this.id = id;
        this.vendorId = vendorId;
        this.branchId = branchId;
        this.serviceId = serviceId;
        this.requestType = requestType;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.reason = reason;
        this._status = status;
        this.createdAt = createdAt;
        this.reviewedBy = reviewedBy;
        this.reviewNotes = reviewNotes;
        this.reviewedAt = reviewedAt;
    }

    get status(): ApprovalStatus {
        return this._status;
    }

    approve(adminId: string, notes?: string): void {
        if (this._status !== ApprovalStatus.PENDING) {
            throw new DomainException('Only pending requests can be approved');
        }
        this._status = ApprovalStatus.APPROVED;
        this.reviewedBy = adminId;
        this.reviewNotes = notes || null;
        this.reviewedAt = new Date();
    }

    reject(adminId: string, notes?: string): void {
        if (this._status !== ApprovalStatus.PENDING) {
            throw new DomainException('Only pending requests can be rejected');
        }
        this._status = ApprovalStatus.REJECTED;
        this.reviewedBy = adminId;
        this.reviewNotes = notes || null;
        this.reviewedAt = new Date();
    }
}

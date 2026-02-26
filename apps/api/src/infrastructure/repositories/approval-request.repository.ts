import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IApprovalRequestRepository } from '../../domain/interfaces/approval-request-repository.interface';
import { PrismaService } from '../services/prisma.service';
import { ApprovalRequest } from '../../domain/entities/approval-request.entity';
import { RequestType } from '../../domain/enums/request-type.enum';
import { ApprovalStatus } from '../../domain/enums/approval-status.enum';

@Injectable()
export class ApprovalRequestRepository implements IApprovalRequestRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<ApprovalRequest | null> {
        const record = await this.prisma.approvalRequest.findUnique({
            where: { id: parseInt(id, 10) }
        });

        if (!record) return null;

        return new ApprovalRequest(
            record.id.toString(),
            record.vendorId.toString(),
            record.branchId.toString(),
            record.serviceId?.toString() || null,
            record.requestType as any,
            record.oldValue || null,
            record.newValue,
            record.reason || null,
            record.status as any,
            record.createdAt,
            record.reviewedBy?.toString() || null,
            record.reviewNotes || null,
            record.reviewedAt || null
        );
    }

    async findByStatus(status: any): Promise<ApprovalRequest[]> {
        let prismaStatus: any = "pending";
        if (typeof status === 'string') {
            prismaStatus = status.toLowerCase();
        } else if (status === 0) {
            prismaStatus = "pending";
        } else if (status === 1) {
            prismaStatus = "approved";
        } else if (status === 2) {
            prismaStatus = "rejected";
        }

        const records = await this.prisma.approvalRequest.findMany({
            where: { status: prismaStatus }
        });

        return records.map(record => new ApprovalRequest(
            record.id.toString(),
            record.vendorId.toString(),
            record.branchId.toString(),
            record.serviceId?.toString() || null,
            record.requestType as any,
            record.oldValue || null,
            record.newValue,
            record.reason || null,
            record.status as any,
            record.createdAt,
            record.reviewedBy?.toString() || null,
            record.reviewNotes || null,
            record.reviewedAt || null
        ));
    }

    async save(request: ApprovalRequest): Promise<void> {
        let requestTypeValue: any = "capacity_change";
        if (request.requestType === RequestType.SERVICE_UPDATE) requestTypeValue = "capacity_change";

        let statusValue: any = "pending";
        if (typeof request.status === 'string') {
            statusValue = request.status.toLowerCase();
        } else if (request.status as any === 1) {
            statusValue = "approved";
        } else if (request.status as any === 2) {
            statusValue = "rejected";
        }

        const data: any = {
            vendorId: parseInt(request.vendorId, 10),
            branchId: parseInt(request.branchId, 10),
            requestType: requestTypeValue,
            oldValue: request.oldValue,
            newValue: request.newValue,
            reason: request.reason,
            status: statusValue,
            reviewNotes: request.reviewNotes,
            reviewedAt: request.reviewedAt
        };

        if (request.serviceId && request.serviceId !== "null" && request.serviceId !== "undefined") {
            const sid = parseInt(request.serviceId, 10);
            if (!isNaN(sid)) {
                data.serviceId = sid;
            }
        }

        if (request.reviewedBy && request.reviewedBy !== "null" && request.reviewedBy !== "undefined") {
            const rid = parseInt(request.reviewedBy, 10);
            if (!isNaN(rid)) {
                data.reviewedBy = rid;
            }
        }

        const parsedId = request.id ? parseInt(request.id, 10) : NaN;
        const isExistingRecord = !isNaN(parsedId) && parsedId > 0 && parsedId < 2147483647;

        if (isExistingRecord) {
            await this.prisma.approvalRequest.update({
                where: { id: parsedId },
                data
            });
        } else {
            await this.prisma.approvalRequest.create({
                data
            });
        }
    }
}

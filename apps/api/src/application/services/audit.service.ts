import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/services/prisma.service';

/**
 * AuditService — records all admin activity for accountability.
 * 
 * Every approval, rejection, status change, or sensitive action
 * is logged with the admin's ID, the action taken, the affected
 * entity, and optional details (IP address, request body, etc.).
 */
@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Log an admin action to the audit trail.
     * 
     * @param adminId    - The ID of the admin performing the action
     * @param action     - e.g. 'APPROVED_REQUEST', 'REJECTED_REQUEST', 'SUSPENDED_VENDOR'
     * @param entityType - e.g. 'ApprovalRequest', 'Vendor', 'Branch'
     * @param entityId   - The ID of the affected entity
     * @param details    - Optional JSON with extra context (request body, old/new values)
     * @param ipAddress  - Optional source IP for forensic analysis
     */
    async logAction(
        adminId: number,
        action: string,
        entityType: string,
        entityId: number,
        details?: any,
        ipAddress?: string,
    ): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    adminId,
                    action,
                    entityType,
                    entityId,
                    details: details || undefined,
                    ipAddress: ipAddress || null,
                },
            });

            this.logger.log({
                event: 'AUDIT_LOG_CREATED',
                adminId,
                action,
                entityType,
                entityId,
            });
        } catch (error) {
            // Audit logging should never crash the main flow
            this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
        }
    }

    /**
     * Retrieve audit logs with optional filtering.
     */
    async getAuditTrail(filters?: {
        adminId?: number;
        action?: string;
        entityType?: string;
        entityId?: number;
        limit?: number;
    }): Promise<any[]> {
        const where: any = {};

        if (filters?.adminId) where.adminId = filters.adminId;
        if (filters?.action) where.action = filters.action;
        if (filters?.entityType) where.entityType = filters.entityType;
        if (filters?.entityId) where.entityId = filters.entityId;

        return this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
            include: {
                admin: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
            },
        });
    }
}

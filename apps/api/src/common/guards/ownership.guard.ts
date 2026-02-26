import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNERSHIP_KEY, OwnershipMetadata } from '../decorators/ownership.decorator';
import { PrismaService } from '../../infrastructure/services/prisma.service';

/**
 * OwnershipGuard — enforces vendor-scoped resource ownership.
 * 
 * When a vendor tries to mutate a resource (e.g. update price),
 * this guard verifies that the resource actually belongs to that vendor.
 * 
 * It reads the @OwnershipCheck('VendorService', 'id') metadata to know:
 *   1. Which Prisma model to query
 *   2. Which route param holds the resource ID
 * 
 * Then it compares the resource's owner (via branch → vendorId) 
 * against the JWT user's ID.
 * 
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
 *        @OwnershipCheck('VendorService', 'id')
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Step 1: Read ownership metadata from the decorator
        const ownershipMeta = this.reflector.getAllAndOverride<OwnershipMetadata>(OWNERSHIP_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no @OwnershipCheck decorator, skip this guard
        if (!ownershipMeta) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Step 2: Only enforce ownership for vendor role
        if (!user || user.role !== 'vendor') {
            // Admins and super_admins bypass ownership checks
            if (user && user.role === 'admin') {
                return true;
            }
            return true; // Non-vendor roles handled by RolesGuard
        }

        // Step 3: Get the resource ID from route params
        const resourceId = parseInt(request.params[ownershipMeta.paramName], 10);
        if (isNaN(resourceId)) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Forbidden: Invalid resource identifier',
                error: 'Forbidden',
            });
        }

        // Step 4: Look up the resource and check ownership
        const isOwner = await this.checkOwnership(ownershipMeta.entityType, resourceId, user.id);

        if (!isOwner) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Forbidden: You do not own this resource',
                error: 'Forbidden',
            });
        }

        return true;
    }

    /**
     * Checks if the given userId owns the resource.
     * Resolves ownership through the branch → vendorId chain.
     */
    private async checkOwnership(entityType: string, resourceId: number, userId: number): Promise<boolean> {
        switch (entityType) {
            case 'VendorService': {
                // VendorService → branch → vendorId
                const vs = await this.prisma.vendorService.findUnique({
                    where: { id: resourceId },
                    include: { branch: true },
                });
                return vs?.branch?.vendorId === userId;
            }

            case 'Branch': {
                // Branch → vendorId
                const branch = await this.prisma.branch.findUnique({
                    where: { id: resourceId },
                });
                return branch?.vendorId === userId;
            }

            case 'Booking': {
                // Booking → customerId (for customer-owned resources)
                const booking = await this.prisma.booking.findUnique({
                    where: { id: resourceId },
                });
                return booking?.customerId === userId;
            }

            default:
                // Unknown entity type — fail closed (deny access)
                return false;
        }
    }
}

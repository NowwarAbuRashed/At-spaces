import { OwnershipGuard } from './ownership.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('OwnershipGuard', () => {
    let guard: OwnershipGuard;
    let reflector: Reflector;
    let mockPrisma: any;

    beforeEach(() => {
        reflector = new Reflector();
        mockPrisma = {
            vendorService: {
                findUnique: jest.fn(),
            },
            branch: {
                findUnique: jest.fn(),
            },
        };
        guard = new OwnershipGuard(reflector, mockPrisma);
    });

    function createMockContext(
        userId: number,
        role: string,
        paramId: string,
        ownershipMeta: any,
    ): ExecutionContext {
        const mockRequest = {
            user: { id: userId, role, email: 'test@test.com' },
            params: { id: paramId },
        };
        const context = {
            switchToHttp: () => ({ getRequest: () => mockRequest }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as unknown as ExecutionContext;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(ownershipMeta);
        return context;
    }

    it('should allow vendor accessing own resource ✅', async () => {
        const ownershipMeta = { entityType: 'VendorService', paramName: 'id' };
        const context = createMockContext(5, 'vendor', '10', ownershipMeta);

        // The vendor service belongs to a branch owned by vendor 5
        mockPrisma.vendorService.findUnique.mockResolvedValue({
            id: 10,
            branch: { vendorId: 5 },
        });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should block vendor accessing other vendor\'s resource ❌', async () => {
        const ownershipMeta = { entityType: 'VendorService', paramName: 'id' };
        const context = createMockContext(5, 'vendor', '10', ownershipMeta);

        // The vendor service belongs to vendor 99, not vendor 5
        mockPrisma.vendorService.findUnique.mockResolvedValue({
            id: 10,
            branch: { vendorId: 99 },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to bypass ownership check ✅', async () => {
        const ownershipMeta = { entityType: 'VendorService', paramName: 'id' };
        const context = createMockContext(1, 'admin', '10', ownershipMeta);

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        // Prisma should NOT be called — admin bypasses
        expect(mockPrisma.vendorService.findUnique).not.toHaveBeenCalled();
    });

    it('should skip when no @OwnershipCheck decorator is set', async () => {
        const context = createMockContext(5, 'vendor', '10', null);

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });
});

import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    function createMockContext(role: string | null, requiredRoles: string[]): ExecutionContext {
        const mockRequest = { user: role ? { id: 1, role, email: 'test@test.com' } : null };
        const context = {
            switchToHttp: () => ({ getRequest: () => mockRequest }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as unknown as ExecutionContext;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
        return context;
    }

    it('should allow access when no @Roles() decorator is set (public route)', () => {
        const context = createMockContext('customer', []);
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow admin to access admin-only route ✅', () => {
        const context = createMockContext('admin', ['admin']);
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should block vendor from admin-only route ❌', () => {
        const context = createMockContext('vendor', ['admin']);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should block customer from admin-only route ❌', () => {
        const context = createMockContext('customer', ['admin']);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should block unauthenticated user (no req.user) ❌', () => {
        const context = createMockContext(null, ['admin']);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return structured 403 error (never 404)', () => {
        const context = createMockContext('customer', ['admin']);
        try {
            guard.canActivate(context);
            fail('Should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ForbiddenException);
            const response = (e as ForbiddenException).getResponse();
            expect((response as any).statusCode).toBe(403);
            expect((response as any).error).toBe('Forbidden');
        }
    });
});

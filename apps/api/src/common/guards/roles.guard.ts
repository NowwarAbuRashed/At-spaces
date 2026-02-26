import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — enforces role-based access control.
 * 
 * Reads the @Roles() metadata from the route handler,
 * compares it against req.user.role (set by JwtStrategy),
 * and returns a structured 403 if the user's role is not allowed.
 * 
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Step 1: Read required roles from the @Roles() decorator
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Step 2: If no @Roles() decorator, allow access (public route)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Step 3: Extract user from request (set by JwtAuthGuard + JwtStrategy)
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Forbidden: No authenticated user found',
                error: 'Forbidden',
            });
        }

        // Step 4: Check if user's role matches any of the required roles
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException({
                statusCode: 403,
                message: `Forbidden: Role '${user.role}' does not have access. Required: ${requiredRoles.join(', ')}`,
                error: 'Forbidden',
            });
        }

        return true;
    }
}

import { SetMetadata } from '@nestjs/common';

/**
 * Custom decorator to attach required roles to a route.
 * Usage: @Roles('admin', 'super_admin')
 * The RolesGuard reads this metadata to enforce access.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

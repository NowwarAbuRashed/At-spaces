import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for ownership checks.
 * Tells the OwnershipGuard which entity type to look up
 * and which route param contains the resource ID.
 * 
 * Usage: @OwnershipCheck('VendorService', 'id')
 */
export const OWNERSHIP_KEY = 'ownership_check';

export interface OwnershipMetadata {
    entityType: string;  // e.g. 'VendorService', 'Branch'
    paramName: string;   // e.g. 'id' — the route param holding the resource ID
}

export const OwnershipCheck = (entityType: string, paramName: string = 'id') =>
    SetMetadata(OWNERSHIP_KEY, { entityType, paramName } as OwnershipMetadata);

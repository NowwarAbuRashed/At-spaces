import { Injectable, Inject } from '@nestjs/common';
import { Money } from '../../domain/value-objects/money.vo';
import { BusinessException } from '../exceptions/business.exception';
import type { IVendorServiceRepository } from '../../domain/interfaces/vendor-service-repository.interface';
import type { IPricingService } from '../interfaces/services/pricing-service.interface';

@Injectable()
export class PricingService implements IPricingService {
    constructor(
        @Inject('IVendorServiceRepository') private readonly vendorServiceRepository: IVendorServiceRepository,
    ) { }

    async calculatePrice(vendorServiceId: string, start: Date, end: Date): Promise<Money> {
        const vendorService = await this.vendorServiceRepository.findById(vendorServiceId);

        if (!vendorService) {
            throw new BusinessException('Vendor service not found');
        }

        const duration = this.getDurationInUnit(start, end, vendorService.priceUnit);

        const minDuration = vendorService.minBookingDuration || vendorService.minDuration;
        const maxDuration = vendorService.maxBookingDuration || vendorService.maxDuration;

        if (minDuration && duration < minDuration) {
            throw new BusinessException(`Minimum duration is ${minDuration} ${vendorService.priceUnit}`);
        }

        if (maxDuration && duration > maxDuration) {
            throw new BusinessException(`Maximum duration is ${maxDuration} ${vendorService.priceUnit}`);
        }

        // Use pricePerUnit from DB (Prisma Decimal) or fallback to price
        const rawPrice = vendorService.pricePerUnit ?? vendorService.price;
        const amountStr = typeof rawPrice === 'object' && rawPrice !== null ? (rawPrice.toNumber ? rawPrice.toNumber() : rawPrice.amount) : rawPrice;
        const basePrice = Money.create(Number(amountStr) || 0, 'JOD');
        return basePrice.multiply(duration);
    }

    private getDurationInUnit(start: Date, end: Date, unit: string): number {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return unit === 'hour' ? Math.ceil(diffHours) : Math.ceil(diffHours / 24); // basic logic
    }
}

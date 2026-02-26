import { Money } from '../../../domain/value-objects/money.vo';

export interface IPricingService {
    calculatePrice(vendorServiceId: string, start: Date, end: Date): Promise<Money>;
}

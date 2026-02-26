export interface IAvailabilityRepository {
    checkAvailability(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<boolean>;
    decreaseUnits(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<void>;
    increaseUnits(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<void>;
}

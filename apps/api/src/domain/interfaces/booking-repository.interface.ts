import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
    findById(id: string): Promise<Booking | null>;
    findByCustomer(customerId: string): Promise<Booking[]>;
    save(booking: Booking): Promise<void>;
}

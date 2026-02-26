import { Booking } from '../../../domain/entities/booking.entity';
import { CreateBookingDto } from '../../dtos/requests/create-booking.dto';

export interface IBookingService {
    createBooking(dto: CreateBookingDto, customerId: string): Promise<Booking>;
    checkIn(bookingId: string, vendorId: string): Promise<void>;
    cancelBooking(bookingId: string, userId: string, reason?: string): Promise<void>;
    markNoShow(bookingId: string, vendorId: string): Promise<void>;
    confirmPayment(bookingId: string): Promise<void>;
    findByCustomer(customerId: string): Promise<Booking[]>;
}

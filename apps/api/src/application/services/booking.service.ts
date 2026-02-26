import { Injectable, Inject } from '@nestjs/common';
import type { IBookingService } from '../interfaces/services/booking-service.interface';
import type { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';
import type { IAvailabilityRepository } from '../../domain/interfaces/availability-repository.interface';
import type { IVendorServiceRepository } from '../../domain/interfaces/vendor-service-repository.interface';
import type { IPricingService } from '../interfaces/services/pricing-service.interface';
import type { INotificationService } from '../interfaces/services/notification-service.interface';
import { CreateBookingDto } from '../dtos/requests/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { BusinessException } from '../exceptions/business.exception';
import { generateBookingNumber } from '../../common/utils/booking-number.util';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { BookingStatus } from '../../domain/enums/booking-status.enum';

@Injectable()
export class BookingService implements IBookingService {
    constructor(
        @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository,
        @Inject('IAvailabilityRepository') private readonly availabilityRepository: IAvailabilityRepository,
        @Inject('IVendorServiceRepository') private readonly vendorServiceRepository: IVendorServiceRepository,
        @Inject('IPricingService') private readonly pricingService: IPricingService,
        @Inject('INotificationService') private readonly notificationService: INotificationService,
    ) { }

    async createBooking(dto: CreateBookingDto, customerId: string): Promise<Booking> {
        const vendorService = await this.vendorServiceRepository.findById(dto.vendorServiceId);
        if (!vendorService) {
            throw new BusinessException('Vendor service not found');
        }

        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);

        const isAvailable = await this.availabilityRepository.checkAvailability(dto.vendorServiceId, start, end, dto.quantity);
        if (!isAvailable) {
            throw new BusinessException('Selected service is not available for requested time/quantity');
        }

        const price = await this.pricingService.calculatePrice(dto.vendorServiceId, start, end);
        // Multiply by quantity if price relates to per unit, assuming business logic here
        const totalPrice = price.amount * dto.quantity; // Simplified 

        const status = dto.paymentMethod === PaymentMethod.CASH ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

        // Simulating transaction logic
        try {
            await this.availabilityRepository.decreaseUnits(dto.vendorServiceId, start, end, dto.quantity);

            const booking = new Booking(
                Date.now().toString(), // simplistic ID
                generateBookingNumber(),
                customerId,
                dto.vendorServiceId,
                start,
                end,
                dto.quantity,
                totalPrice,
                status,
            );

            await this.bookingRepository.save(booking);

            if (status === BookingStatus.CONFIRMED) {
                await this.notificationService.sendBookingConfirmation(booking, customerId);
            }

            return booking;
        } catch (error) {
            // rollback manually if no UoW pattern implemented
            await this.availabilityRepository.increaseUnits(dto.vendorServiceId, start, end, dto.quantity);
            throw error;
        }
    }

    async checkIn(bookingId: string, vendorId: string): Promise<void> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) throw new BusinessException('Booking not found');

        // Optional: verification of vendor
        booking.checkIn();
        await this.bookingRepository.save(booking);
    }

    async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<void> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) throw new BusinessException('Booking not found');

        if (booking.customerId !== userId) throw new BusinessException('Not authorized to cancel this booking');

        booking.cancel(reason);
        await this.bookingRepository.save(booking);

        await this.availabilityRepository.increaseUnits(booking.vendorServiceId, booking.startTime, booking.endTime, booking.quantity);
        await this.notificationService.sendBookingCancelled(booking, userId);
    }

    async markNoShow(bookingId: string, vendorId: string): Promise<void> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) throw new BusinessException('Booking not found');

        booking.markNoShow();
        await this.bookingRepository.save(booking);
    }

    async confirmPayment(bookingId: string): Promise<void> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) throw new BusinessException('Booking not found');

        booking.confirm();
        await this.bookingRepository.save(booking);
        await this.notificationService.sendBookingConfirmation(booking, booking.customerId);
    }

    async findByCustomer(customerId: string): Promise<Booking[]> {
        return this.bookingRepository.findByCustomer(customerId);
    }
}

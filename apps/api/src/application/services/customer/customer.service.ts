import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IBookingRepository } from '../../../domain/interfaces/booking-repository.interface';
import type { IAvailabilityRepository } from '../../../domain/interfaces/availability-repository.interface';
import { CheckAvailabilityDto } from '../../dtos/customer/check-availability.dto';

@Injectable()
export class CustomerService {
    constructor(
        @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository,
        @Inject('IAvailabilityRepository') private readonly availabilityRepository: IAvailabilityRepository,
        // potentially inject branch repository for customer branch listings
    ) { }

    async getBranches(city?: string, serviceType?: string): Promise<any[]> {
        // Implementation to fetch branches with filtering
        // Mock response
        return [
            {
                id: 1,
                name: "Main Branch",
                city: city || "Amman",
                address: "Street 1",
                latitude: 31.95,
                longitude: 35.91
            }
        ];
    }

    async getBranchDetails(id: number): Promise<any> {
        // Implementation to fetch branch + services + facilities
        // Mock response matching the requested schema update
        return {
            id,
            name: "WeWork Abdali",
            facilities: [
                { id: 1, name: "WiFi", icon: "wifi", isAvailable: true, description: "100 Mbps" },
                { id: 2, name: "Parking", icon: "car", isAvailable: true }
            ],
            services: [
                { serviceId: 1, name: "Hot Desk", pricePerUnit: 10, unit: "hour" }
            ]
        };
    }

    async checkAvailability(dto: CheckAvailabilityDto): Promise<{ available: boolean; price: number }> {
        // Core business logic to check availability
        const isAvailable = await this.availabilityRepository.checkAvailability(
            dto.vendorServiceId.toString(),
            new Date(dto.startTime),
            new Date(dto.endTime),
            dto.quantity
        );

        // Calculate price based on service rules
        return { available: isAvailable, price: 50.00 }; // Mock price
    }

    async getMyBookings(userId: number): Promise<any[]> {
        return this.bookingRepository.findByCustomer(userId.toString());
    }

    async cancelBooking(bookingId: number, userId: number): Promise<{ message: string }> {
        const booking = await this.bookingRepository.findById(bookingId.toString());
        if (!booking) throw new NotFoundException('Booking not found');

        // Ensure the booking belongs to the requesting user (auth check)
        if (booking.customerId !== userId.toString()) {
            throw new NotFoundException('Booking not found for user');
        }

        booking.cancel();
        await this.bookingRepository.save(booking);

        return { message: "Booking cancelled successfully" };
    }
}

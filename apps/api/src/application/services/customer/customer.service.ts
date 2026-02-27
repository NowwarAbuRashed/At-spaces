import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IBookingRepository } from '../../../domain/interfaces/booking-repository.interface';
import type { IAvailabilityRepository } from '../../../domain/interfaces/availability-repository.interface';
import type { IPricingService } from '../../interfaces/services/pricing-service.interface';
import { CheckAvailabilityDto } from '../../dtos/customer/check-availability.dto';
import { PrismaService } from '../../../infrastructure/services/prisma.service';

@Injectable()
export class CustomerService {
    constructor(
        @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository,
        @Inject('IAvailabilityRepository') private readonly availabilityRepository: IAvailabilityRepository,
        @Inject('IPricingService') private readonly pricingService: IPricingService,
        private readonly prisma: PrismaService,
    ) { }

    async getBranches(city?: string, serviceType?: string): Promise<any[]> {
        const where: any = { status: 'active' };

        if (city) {
            where.city = city;
        }

        if (serviceType) {
            where.vendorServices = {
                some: {
                    service: { name: serviceType },
                    isAvailable: true,
                },
            };
        }

        return this.prisma.branch.findMany({
            where,
            include: {
                vendor: {
                    select: { id: true, fullName: true },
                },
                vendorServices: {
                    where: { isAvailable: true },
                    include: {
                        service: { select: { name: true, unit: true } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async getBranchDetails(id: number): Promise<any> {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                vendor: {
                    select: { id: true, fullName: true, email: true },
                },
                branchFacilities: {
                    include: {
                        facility: true,
                    },
                },
                vendorServices: {
                    where: { isAvailable: true },
                    include: {
                        service: true,
                        serviceFeatures: {
                            include: { feature: true },
                        },
                    },
                },
            },
        });

        if (!branch) throw new NotFoundException('Branch not found');

        return {
            id: branch.id,
            name: branch.name,
            description: branch.description,
            city: branch.city,
            address: branch.address,
            latitude: branch.latitude,
            longitude: branch.longitude,
            status: branch.status,
            vendor: branch.vendor,
            facilities: branch.branchFacilities.map(bf => ({
                id: bf.facility.id,
                name: bf.facility.name,
                icon: bf.facility.icon,
                isAvailable: bf.isAvailable,
                description: bf.description,
            })),
            services: branch.vendorServices.map(vs => ({
                vendorServiceId: vs.id,
                serviceName: vs.service.name,
                pricePerUnit: vs.pricePerUnit,
                priceUnit: vs.priceUnit,
                maxCapacity: vs.maxCapacity,
                minBookingDuration: vs.minBookingDuration,
                maxBookingDuration: vs.maxBookingDuration,
                features: vs.serviceFeatures.map(sf => ({
                    id: sf.feature.id,
                    name: sf.feature.name,
                    icon: sf.feature.icon,
                    quantity: sf.quantity,
                })),
            })),
        };
    }

    async checkAvailability(dto: CheckAvailabilityDto): Promise<{ available: boolean; price: number }> {
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);

        const isAvailable = await this.availabilityRepository.checkAvailability(
            dto.vendorServiceId.toString(),
            start,
            end,
            dto.quantity
        );

        const priceResult = await this.pricingService.calculatePrice(
            dto.vendorServiceId.toString(),
            start,
            end
        );

        return {
            available: isAvailable,
            price: priceResult.amount * dto.quantity,
        };
    }

    async getMyBookings(userId: number): Promise<any[]> {
        return this.bookingRepository.findByCustomer(userId.toString());
    }

    async cancelBooking(bookingId: number, userId: number): Promise<{ message: string }> {
        const booking = await this.bookingRepository.findById(bookingId.toString());
        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.customerId !== userId.toString()) {
            throw new NotFoundException('Booking not found for user');
        }

        booking.cancel();
        await this.bookingRepository.save(booking);

        return { message: "Booking cancelled successfully" };
    }
}

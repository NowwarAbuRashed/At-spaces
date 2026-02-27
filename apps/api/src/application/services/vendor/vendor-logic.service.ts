import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IVendorServiceRepository } from '../../../domain/interfaces/vendor-service-repository.interface';
import type { IBookingRepository } from '../../../domain/interfaces/booking-repository.interface';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
import { CreateApprovalRequestDto } from '../../../application/dtos/requests/create-approval-request.dto';
import { RequestType } from '../../../domain/enums/request-type.enum';
import { UpdatePriceDto, RequestCapacityDto, UpdateAvailabilityDto } from '../../dtos/vendor/vendor.dtos';
import { PrismaService } from '../../../infrastructure/services/prisma.service';

@Injectable()
export class VendorServiceLogic {
    constructor(
        @Inject('IVendorServiceRepository') private readonly vendorServiceRepository: IVendorServiceRepository,
        @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository,
        private readonly approvalRequestService: ApprovalRequestService,
        private readonly prisma: PrismaService,
    ) { }

    async getDashboard(vendorId: number): Promise<any> {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Get vendor's branches
        const branches = await this.prisma.branch.findMany({
            where: { vendorId },
            select: { id: true, status: true },
        });
        const branchIds = branches.map(b => b.id);

        // Get today's bookings count
        const todayBookings = await this.prisma.booking.count({
            where: {
                vendorService: { branchId: { in: branchIds } },
                bookingDate: { gte: startOfDay, lt: endOfDay },
                status: { in: ['confirmed', 'completed'] },
            },
        });

        // Get upcoming bookings (future confirmed)
        const upcomingBookings = await this.prisma.booking.count({
            where: {
                vendorService: { branchId: { in: branchIds } },
                bookingDate: { gte: endOfDay },
                status: 'confirmed',
            },
        });

        // Calculate occupancy: today's bookings / total capacity
        const totalCapacity = await this.prisma.vendorService.aggregate({
            where: { branchId: { in: branchIds }, isAvailable: true },
            _sum: { maxCapacity: true },
        });

        const capacity = totalCapacity._sum.maxCapacity || 1;
        const occupancy = Math.min(Math.round((todayBookings / capacity) * 100), 100);

        return {
            todayOccupancy: occupancy,
            todayBookings,
            upcomingBookings,
            activeBranches: branches.filter(b => b.status === 'active').length,
            totalBranches: branches.length,
        };
    }

    async getVendorServices(vendorId: number): Promise<any[]> {
        const services = await this.prisma.vendorService.findMany({
            where: {
                branch: { vendorId },
            },
            include: {
                service: true,
                branch: { select: { id: true, name: true } },
                serviceFeatures: {
                    include: { feature: true },
                },
            },
        });

        return services.map(vs => ({
            id: vs.id,
            branchId: vs.branchId,
            branchName: vs.branch.name,
            serviceName: vs.service.name,
            serviceDescription: vs.service.description,
            pricePerUnit: vs.pricePerUnit,
            priceUnit: vs.priceUnit,
            maxCapacity: vs.maxCapacity,
            isAvailable: vs.isAvailable,
            minBookingDuration: vs.minBookingDuration,
            maxBookingDuration: vs.maxBookingDuration,
            features: vs.serviceFeatures.map(sf => ({
                id: sf.feature.id,
                name: sf.feature.name,
                icon: sf.feature.icon,
                quantity: sf.quantity,
            })),
        }));
    }

    async updatePrice(vendorId: number, serviceId: number, dto: UpdatePriceDto): Promise<any> {
        let service = await this.vendorServiceRepository.findById(serviceId.toString());
        if (!service) throw new NotFoundException('Service not found');

        service.pricePerUnit = dto.pricePerUnit;
        service.priceUnit = dto.priceUnit;

        await this.vendorServiceRepository.save(service);
        return service;
    }

    async requestCapacityChange(vendorId: number, branchId: number, serviceId: number, dto: RequestCapacityDto): Promise<any> {
        // Fetch current capacity so oldValue is real
        const vendorService = await this.prisma.vendorService.findFirst({
            where: { id: serviceId, branch: { id: branchId, vendorId } },
        });

        const createDto: CreateApprovalRequestDto = {
            branchId: branchId.toString(),
            serviceId: serviceId.toString(),
            requestType: RequestType.CAPACITY_CHANGE,
            oldValue: vendorService ? vendorService.maxCapacity.toString() : '0',
            newValue: dto.newCapacity.toString(),
            reason: dto.reason
        };

        const request = await this.approvalRequestService.createRequest(vendorId.toString(), createDto);
        return { requestId: request.id };
    }

    async updateAvailability(dto: UpdateAvailabilityDto): Promise<void> {
        const vendorServiceId = typeof dto.vendorServiceId === 'string'
            ? parseInt(dto.vendorServiceId, 10) : dto.vendorServiceId;
        const date = new Date(dto.date);

        // Upsert: update existing slot or create new one
        const existing = await this.prisma.availability.findFirst({
            where: {
                vendorServiceId,
                date,
                startTime: dto.startTime ? new Date(dto.startTime) : undefined,
            },
        });

        if (existing) {
            await this.prisma.availability.update({
                where: { id: existing.id },
                data: {
                    availableUnits: dto.availableUnits,
                    isBlocked: dto.isBlocked ?? false,
                    endTime: dto.endTime ? new Date(dto.endTime) : existing.endTime,
                },
            });
        } else {
            await this.prisma.availability.create({
                data: {
                    vendorServiceId,
                    date,
                    startTime: dto.startTime ? new Date(dto.startTime) : null,
                    endTime: dto.endTime ? new Date(dto.endTime) : null,
                    availableUnits: dto.availableUnits,
                    isBlocked: dto.isBlocked ?? false,
                },
            });
        }
    }

    async getBranchBookings(vendorId: number, date?: string): Promise<any[]> {
        const where: any = {
            vendorService: {
                branch: { vendorId },
            },
        };

        if (date) {
            const bookingDate = new Date(date);
            const nextDay = new Date(bookingDate);
            nextDay.setDate(nextDay.getDate() + 1);
            where.bookingDate = { gte: bookingDate, lt: nextDay };
        }

        const bookings = await this.prisma.booking.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, fullName: true, email: true, phoneNumber: true },
                },
                vendorService: {
                    include: {
                        service: { select: { name: true } },
                        branch: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { bookingDate: 'desc' },
        });

        return bookings.map(b => ({
            id: b.id,
            bookingNumber: b.bookingNumber,
            bookingDate: b.bookingDate,
            startTime: b.startTime,
            endTime: b.endTime,
            quantity: b.quantity,
            totalPrice: b.totalPrice,
            status: b.status,
            paymentStatus: b.paymentStatus,
            customer: b.customer,
            serviceName: b.vendorService.service.name,
            branchName: b.vendorService.branch.name,
        }));
    }
}


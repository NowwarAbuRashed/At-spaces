import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IVendorServiceRepository } from '../../../domain/interfaces/vendor-service-repository.interface';
import type { IBookingRepository } from '../../../domain/interfaces/booking-repository.interface';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
import { CreateApprovalRequestDto } from '../../../application/dtos/requests/create-approval-request.dto';
import { RequestType } from '../../../domain/enums/request-type.enum';
import { UpdatePriceDto, RequestCapacityDto, UpdateAvailabilityDto } from '../../dtos/vendor/vendor.dtos';

@Injectable()
export class VendorServiceLogic {
    constructor(
        @Inject('IVendorServiceRepository') private readonly vendorServiceRepository: IVendorServiceRepository,
        @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository,
        private readonly approvalRequestService: ApprovalRequestService
    ) { }

    async getDashboard(vendorId: number): Promise<any> {
        return {
            todayOccupancy: 85,
            upcomingBookings: 12,
            branchStatus: "active"
        };
    }

    async getVendorServices(vendorId: number): Promise<any[]> {
        // Mock returning services matching schema update
        return [
            {
                id: 5,
                serviceName: "Private Office",
                pricePerUnit: 25,
                features: [
                    { id: 1, name: "Meeting table", quantity: 1 },
                    { id: 2, name: "Whiteboard", quantity: 1 }
                ]
            }
        ];
    }

    async updatePrice(vendorId: number, serviceId: number, dto: UpdatePriceDto): Promise<any> {
        let service = await this.vendorServiceRepository.findById(serviceId.toString());
        if (!service) throw new NotFoundException('Service not found');

        // Logic check auth etc omitted
        service.pricePerUnit = dto.pricePerUnit;
        service.priceUnit = dto.priceUnit;

        await this.vendorServiceRepository.save(service);
        return service;
    }

    async requestCapacityChange(vendorId: number, branchId: number, serviceId: number, dto: RequestCapacityDto): Promise<any> {
        const createDto: CreateApprovalRequestDto = {
            branchId: branchId.toString(),
            serviceId: serviceId.toString(),
            requestType: RequestType.CAPACITY_CHANGE,
            oldValue: '0', // should fetch actual
            newValue: dto.newCapacity.toString(),
            reason: dto.reason
        };

        const request = await this.approvalRequestService.createRequest(vendorId.toString(), createDto);
        return { requestId: request.id };
    }

    async updateAvailability(dto: UpdateAvailabilityDto): Promise<void> {
        // Implementation for changing blocks/sessions logic
    }

    async getBranchBookings(vendorId: number, date?: string): Promise<any[]> {
        // Return bookings tied to the vendor's branch filtered manually (or by repo)
        return [];
    }
}

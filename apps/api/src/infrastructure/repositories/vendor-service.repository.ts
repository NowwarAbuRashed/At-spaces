import { Injectable } from '@nestjs/common';
import { IVendorServiceRepository } from '../../domain/interfaces/vendor-service-repository.interface';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class VendorServiceRepository implements IVendorServiceRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<any> {
        return this.prisma.vendorService.findUnique({
            where: { id: parseInt(id, 10) },
            include: { service: true, branch: true }
        });
    }

    async save(vendorService: any): Promise<void> {
        const data = {
            branchId: vendorService.branchId ? parseInt(vendorService.branchId.toString(), 10) : undefined,
            serviceId: vendorService.serviceId ? parseInt(vendorService.serviceId.toString(), 10) : undefined,
            isAvailable: vendorService.isAvailable,
            maxCapacity: vendorService.maxCapacity ? parseInt(vendorService.maxCapacity.toString(), 10) : undefined,
            pricePerUnit: vendorService.pricePerUnit,
            priceUnit: vendorService.priceUnit,
            minBookingDuration: vendorService.minBookingDuration ? parseInt(vendorService.minBookingDuration.toString(), 10) : undefined,
            maxBookingDuration: vendorService.maxBookingDuration ? parseInt(vendorService.maxBookingDuration.toString(), 10) : null,
            cancellationPolicy: vendorService.cancellationPolicy
        };

        if (vendorService.id) {
            await this.prisma.vendorService.update({
                where: { id: parseInt(vendorService.id.toString(), 10) },
                data: { ...data, branchId: data.branchId || 1, serviceId: data.serviceId || 1, maxCapacity: data.maxCapacity || 1, pricePerUnit: data.pricePerUnit || 0, priceUnit: data.priceUnit || 'hour' }
            });
        } else {
            await this.prisma.vendorService.create({
                data: { ...data, branchId: data.branchId || 1, serviceId: data.serviceId || 1, maxCapacity: data.maxCapacity || 1, pricePerUnit: data.pricePerUnit || 0, priceUnit: data.priceUnit || 'hour' }
            });
        }
    }
}

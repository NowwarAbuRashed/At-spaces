import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';
import type { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { PrismaService } from '../../../infrastructure/services/prisma.service';

@Injectable()
export class AdminLogicService {
    constructor(
        private readonly approvalRequestService: ApprovalRequestService,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        private readonly prisma: PrismaService,
    ) { }

    async getBranches(): Promise<any[]> {
        return this.prisma.branch.findMany({
            include: {
                vendor: {
                    select: { id: true, fullName: true, email: true, status: true },
                },
                _count: {
                    select: { vendorServices: true, approvalRequests: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateBranchStatus(branchId: number, status: string): Promise<void> {
        const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch) throw new NotFoundException('Branch not found');

        await this.prisma.branch.update({
            where: { id: branchId },
            data: { status: status as any },
        });
    }

    async getVendors(): Promise<any[]> {
        const vendors = await this.prisma.user.findMany({
            where: { role: 'vendor' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                status: true,
                createdAt: true,
                branches: {
                    select: { id: true, name: true, city: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return vendors;
    }

    async updateVendorStatus(vendorId: number, status: UserStatus): Promise<void> {
        const vendor = await this.userRepository.findById(vendorId.toString());
        if (!vendor || vendor.role !== UserRole.vendor) throw new NotFoundException('Vendor not found');

        vendor.status = status;
        await this.userRepository.save(vendor);
    }

    async getAnalytics(from?: string, to?: string): Promise<any> {
        const dateFilter: any = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);

        const bookingWhere: any = {};
        if (from || to) bookingWhere.createdAt = dateFilter;

        // Total bookings
        const totalBookings = await this.prisma.booking.count({ where: bookingWhere });

        // Revenue (sum of totalPrice for paid bookings)
        const revenueResult = await this.prisma.booking.aggregate({
            where: { ...bookingWhere, paymentStatus: 'paid' },
            _sum: { totalPrice: true },
        });
        const revenue = revenueResult._sum.totalPrice
            ? Number(revenueResult._sum.totalPrice)
            : 0;

        // Total capacity across all active vendor services
        const capacityResult = await this.prisma.vendorService.aggregate({
            where: { isAvailable: true },
            _sum: { maxCapacity: true },
        });
        const totalCapacity = capacityResult._sum.maxCapacity || 1;

        // Confirmed + completed bookings for occupancy
        const activeBookings = await this.prisma.booking.count({
            where: { ...bookingWhere, status: { in: ['confirmed', 'completed'] } },
        });
        const occupancyRate = Math.min(activeBookings / totalCapacity, 1);

        // Top cities by booking count
        const branchBookings = await this.prisma.booking.findMany({
            where: bookingWhere,
            select: {
                vendorService: {
                    select: { branch: { select: { city: true } } },
                },
            },
        });

        const cityCounts: Record<string, number> = {};
        for (const b of branchBookings) {
            const city = b.vendorService.branch.city;
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([city]) => city);

        return {
            totalBookings,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            revenue,
            topCities,
        };
    }
}


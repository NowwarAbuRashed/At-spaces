import { Injectable } from '@nestjs/common';
import { IAvailabilityRepository } from '../../domain/interfaces/availability-repository.interface';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class AvailabilityRepository implements IAvailabilityRepository {
    constructor(private readonly prisma: PrismaService) { }

    async checkAvailability(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<boolean> {
        const availabilities = await this.prisma.availability.findMany({
            where: {
                vendorServiceId: parseInt(vendorServiceId, 10),
                date: {
                    gte: start,
                    lte: end
                }
            }
        });

        // Simplified logic: If any slot is blocked or has less than requested units, return false
        for (const slot of availabilities) {
            if (slot.isBlocked || slot.availableUnits < quantity) {
                return false;
            }
        }

        // If no availability records found but it's not strictly blocked, we could assume available or unavailable.
        // Usually, empty means fully available up to maxCapacity. Let's assume true for now.
        return true;
    }

    async decreaseUnits(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<void> {
        const slots = await this.prisma.availability.findMany({
            where: {
                vendorServiceId: parseInt(vendorServiceId, 10),
                date: { gte: start, lte: end },
                isBlocked: false,
            },
        });

        for (const slot of slots) {
            await this.prisma.availability.update({
                where: { id: slot.id },
                data: {
                    availableUnits: Math.max(slot.availableUnits - quantity, 0),
                },
            });
        }
    }

    async increaseUnits(vendorServiceId: string, start: Date, end: Date, quantity: number): Promise<void> {
        const slots = await this.prisma.availability.findMany({
            where: {
                vendorServiceId: parseInt(vendorServiceId, 10),
                date: { gte: start, lte: end },
            },
        });

        for (const slot of slots) {
            await this.prisma.availability.update({
                where: { id: slot.id },
                data: {
                    availableUnits: slot.availableUnits + quantity,
                },
            });
        }
    }
}

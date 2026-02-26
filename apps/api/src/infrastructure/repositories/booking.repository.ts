import { Injectable } from '@nestjs/common';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';
import { PrismaService } from '../services/prisma.service';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingRepository implements IBookingRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Booking | null> {
        const bookingRecord = await this.prisma.booking.findUnique({
            where: { id: parseInt(id, 10) }
        });
        if (!bookingRecord) return null;

        return new Booking(
            bookingRecord.id.toString(),
            bookingRecord.bookingNumber,
            bookingRecord.customerId.toString(),
            bookingRecord.vendorServiceId.toString(),
            bookingRecord.startTime || new Date(),
            bookingRecord.endTime || new Date(),
            bookingRecord.quantity,
            bookingRecord.totalPrice.toNumber(),
            bookingRecord.status as any,
            bookingRecord.paymentStatus,
            bookingRecord.createdAt,
            undefined, // checkInTime
            undefined, // cancelledAt
            undefined  // cancellationReason
        );
    }

    async findByCustomer(customerId: string): Promise<Booking[]> {
        const records = await this.prisma.booking.findMany({
            where: { customerId: parseInt(customerId, 10) }
        });

        return records.map(r => new Booking(
            r.id.toString(),
            r.bookingNumber,
            r.customerId.toString(),
            r.vendorServiceId.toString(),
            r.startTime || new Date(),
            r.endTime || new Date(),
            r.quantity,
            r.totalPrice.toNumber(),
            r.status as any,
            r.paymentStatus,
            r.createdAt,
            undefined, // checkInTime
            undefined, // cancelledAt
            undefined  // cancellationReason
        ));
    }

    async save(booking: Booking): Promise<void> {
        let paymentStatusValue: any = "pending";
        if (booking.paymentStatus === "completed" || booking.paymentStatus === "paid") {
            paymentStatusValue = "completed";
        } else if (booking.paymentStatus === "failed") {
            paymentStatusValue = "failed";
        }

        const data: any = {
            bookingNumber: booking.bookingNumber || `BK-${Date.now()}`,
            bookingDate: booking.startTime,
            startTime: booking.startTime,
            endTime: booking.endTime,
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            status: (booking.status as string).toLowerCase(),
            paymentStatus: paymentStatusValue,
        };

        const parsedId = booking.id ? parseInt(booking.id, 10) : NaN;
        const isExistingRecord = !isNaN(parsedId) && parsedId > 0 && parsedId < 2147483647;

        if (isExistingRecord) {
            await this.prisma.booking.update({
                where: { id: parsedId },
                data: {
                    ...data,
                    customerId: parseInt(booking.customerId, 10),
                    vendorServiceId: parseInt(booking.vendorServiceId, 10),
                }
            });
        } else {
            await this.prisma.booking.create({
                data: {
                    ...data,
                    customerId: parseInt(booking.customerId, 10),
                    vendorServiceId: parseInt(booking.vendorServiceId, 10),
                }
            });
        }
    }
}

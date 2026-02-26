import { DomainException } from '../exceptions/domain.exception';
import { BookingStatus } from '../enums/booking-status.enum';

export class Booking {
    id: string;
    bookingNumber: string;
    customerId: string;
    vendorServiceId: string;
    startTime: Date;
    endTime: Date;
    quantity: number;
    totalPrice: number;
    private _status: BookingStatus;
    paymentStatus: string;
    createdAt: Date;
    checkInTime?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;

    constructor(
        id: string,
        bookingNumber: string,
        customerId: string,
        vendorServiceId: string,
        startTime: Date,
        endTime: Date,
        quantity: number,
        totalPrice: number,
        status: BookingStatus = BookingStatus.PENDING,
        paymentStatus: string = "pending",
        createdAt: Date = new Date(),
        checkInTime?: Date,
        cancelledAt?: Date,
        cancellationReason?: string,
    ) {
        this.id = id;
        this.bookingNumber = bookingNumber;
        this.customerId = customerId;
        this.vendorServiceId = vendorServiceId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this._status = status;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.checkInTime = checkInTime;
        this.cancelledAt = cancelledAt;
        this.cancellationReason = cancellationReason;
    }

    get status(): BookingStatus {
        return this._status;
    }

    confirm(): void {
        if (this._status !== BookingStatus.PENDING) {
            throw new DomainException('Only pending bookings can be confirmed');
        }
        this._status = BookingStatus.CONFIRMED;
    }

    checkIn(): void {
        if (this._status !== BookingStatus.CONFIRMED) {
            throw new DomainException('Only confirmed bookings can be checked in');
        }
        this._status = BookingStatus.COMPLETED;
        this.checkInTime = new Date();
    }

    cancel(reason?: string): void {
        if (this._status === BookingStatus.COMPLETED || this._status === BookingStatus.NO_SHOW) {
            throw new DomainException('Completed or No-show bookings cannot be cancelled');
        }
        this._status = BookingStatus.CANCELLED;
        this.cancelledAt = new Date();
        this.cancellationReason = reason;
    }

    markNoShow(): void {
        if (this._status !== BookingStatus.CONFIRMED) {
            throw new DomainException('Only confirmed bookings can be marked as No Show');
        }
        this._status = BookingStatus.NO_SHOW;
    }
}

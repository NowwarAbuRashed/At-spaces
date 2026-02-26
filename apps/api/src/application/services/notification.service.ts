import { Injectable, Logger, Inject } from '@nestjs/common';
import type { INotificationService } from '../interfaces/services/notification-service.interface';
import type { IEmailService } from '../interfaces/external/email-service.interface';
import type { ISmsService } from '../interfaces/external/sms-service.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
import { ApprovalRequest } from '../../domain/entities/approval-request.entity';

@Injectable()
export class NotificationService implements INotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @Inject('IEmailService') private readonly emailService: IEmailService,
        @Inject('ISmsService') private readonly smsService: ISmsService,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    ) { }

    async sendBookingConfirmation(booking: Booking, customerId: string): Promise<void> {
        try {
            const user = await this.userRepository.findById(customerId);
            if (!user) return;

            const message = `Your booking ${booking.bookingNumber} is confirmed!`;
            if (user.email) await this.emailService.send(user.email, 'Booking Confirmed', message);
            if (user.phoneNumber) await this.smsService.send(user.phoneNumber, message);
        } catch (error) {
            this.logger.error(`Failed to send booking confirmation for ${booking.id}`, error);
        }
    }

    async sendBookingCancelled(booking: Booking, customerId: string): Promise<void> {
        try {
            const user = await this.userRepository.findById(customerId);
            if (!user) return;

            const message = `Your booking ${booking.bookingNumber} has been cancelled.`;
            if (user.email) await this.emailService.send(user.email, 'Booking Cancelled', message);
            if (user.phoneNumber) await this.smsService.send(user.phoneNumber, message);
        } catch (error) {
            this.logger.error(`Failed to send booking cancellation for ${booking.id}`, error);
        }
    }

    async sendApprovalResult(vendorId: string, request: ApprovalRequest, approved: boolean, reason?: string): Promise<void> {
        try {
            const vendor = await this.userRepository.findById(vendorId);
            if (!vendor) return;

            const status = approved ? 'Approved' : 'Rejected';
            const message = `Your capacity change request has been ${status}. ${reason ? 'Reason: ' + reason : ''}`;

            if (vendor.email) await this.emailService.send(vendor.email, `Request ${status}`, message);
            if (vendor.phoneNumber) await this.smsService.send(vendor.phoneNumber, message);
        } catch (error) {
            this.logger.error(`Failed to send approval result to vendor ${vendorId}`, error);
        }
    }

    async sendReminder(booking: Booking, customerId: string): Promise<void> {
        try {
            const user = await this.userRepository.findById(customerId);
            if (!user) return;

            const message = `Reminder: Your booking ${booking.bookingNumber} is tomorrow.`;
            if (user.email) await this.emailService.send(user.email, 'Booking Reminder', message);
            if (user.phoneNumber) await this.smsService.send(user.phoneNumber, message);
        } catch (error) {
            this.logger.error(`Failed to send booking reminder for ${booking.id}`, error);
        }
    }
}

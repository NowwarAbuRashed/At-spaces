import { Booking } from '../../../domain/entities/booking.entity';
import { ApprovalRequest } from '../../../domain/entities/approval-request.entity';

export interface INotificationService {
    sendBookingConfirmation(booking: Booking, customerId: string): Promise<void>;
    sendBookingCancelled(booking: Booking, customerId: string): Promise<void>;
    sendApprovalResult(vendorId: string, request: ApprovalRequest, approved: boolean, reason?: string): Promise<void>;
    sendReminder(booking: Booking, customerId: string): Promise<void>;
}

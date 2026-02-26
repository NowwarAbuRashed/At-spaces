import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { Booking } from '../../domain/entities/booking.entity';
import { ApprovalRequest } from '../../domain/entities/approval-request.entity';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { RequestType } from '../../domain/enums/request-type.enum';

describe('NotificationService', () => {
    let service: NotificationService;
    let emailServiceMock: any;
    let smsServiceMock: any;
    let userRepositoryMock: any;

    beforeEach(async () => {
        emailServiceMock = {
            send: jest.fn(),
        };

        smsServiceMock = {
            send: jest.fn(),
        };

        userRepositoryMock = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: 'IEmailService', useValue: emailServiceMock },
                { provide: 'ISmsService', useValue: smsServiceMock },
                { provide: 'IUserRepository', useValue: userRepositoryMock },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendBookingConfirmation', () => {
        it('should not send if user not found', async () => {
            userRepositoryMock.findById.mockResolvedValue(null);

            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);

            await service.sendBookingConfirmation(booking, 'c-1');

            expect(emailServiceMock.send).not.toHaveBeenCalled();
            expect(smsServiceMock.send).not.toHaveBeenCalled();
        });

        it('should send email and sms if user has both', async () => {
            userRepositoryMock.findById.mockResolvedValue({
                id: 'c-1', email: 'test@test.com', phoneNumber: '+123456789'
            });

            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);

            await service.sendBookingConfirmation(booking, 'c-1');

            expect(emailServiceMock.send).toHaveBeenCalledWith('test@test.com', 'Booking Confirmed', 'Your booking BKG-1 is confirmed!');
            expect(smsServiceMock.send).toHaveBeenCalledWith('+123456789', 'Your booking BKG-1 is confirmed!');
        });
    });

    describe('sendBookingCancelled', () => {
        it('should send email and sms', async () => {
            userRepositoryMock.findById.mockResolvedValue({
                id: 'c-1', email: 'test@test.com', phoneNumber: '+123456789'
            });

            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CANCELLED);

            await service.sendBookingCancelled(booking, 'c-1');

            expect(emailServiceMock.send).toHaveBeenCalledWith('test@test.com', 'Booking Cancelled', 'Your booking BKG-1 has been cancelled.');
            expect(smsServiceMock.send).toHaveBeenCalledWith('+123456789', 'Your booking BKG-1 has been cancelled.');
        });
    });

    describe('sendApprovalResult', () => {
        it('should send approval email and sms', async () => {
            userRepositoryMock.findById.mockResolvedValue({
                id: 'v-1', email: 'vendor@test.com', phoneNumber: '+123'
            });

            const request = new ApprovalRequest('r-1', 'v-1', 'b-1', 's-1', RequestType.CAPACITY_CHANGE, '10', '20');

            await service.sendApprovalResult('v-1', request, true, 'Looks good');

            expect(emailServiceMock.send).toHaveBeenCalledWith('vendor@test.com', 'Request Approved', 'Your capacity change request has been Approved. Reason: Looks good');
            expect(smsServiceMock.send).toHaveBeenCalledWith('+123', 'Your capacity change request has been Approved. Reason: Looks good');
        });

        it('should send rejection email and sms', async () => {
            userRepositoryMock.findById.mockResolvedValue({
                id: 'v-1', email: 'vendor@test.com', phoneNumber: '+123'
            });

            const request = new ApprovalRequest('r-1', 'v-1', 'b-1', 's-1', RequestType.CAPACITY_CHANGE, '10', '20');

            await service.sendApprovalResult('v-1', request, false, 'Invalid data');

            expect(emailServiceMock.send).toHaveBeenCalledWith('vendor@test.com', 'Request Rejected', 'Your capacity change request has been Rejected. Reason: Invalid data');
            expect(smsServiceMock.send).toHaveBeenCalledWith('+123', 'Your capacity change request has been Rejected. Reason: Invalid data');
        });
    });

    describe('sendReminder', () => {
        it('should send reminder email and sms', async () => {
            userRepositoryMock.findById.mockResolvedValue({
                id: 'c-1', email: 'test@test.com', phoneNumber: '+123456789'
            });

            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);

            await service.sendReminder(booking, 'c-1');

            expect(emailServiceMock.send).toHaveBeenCalledWith('test@test.com', 'Booking Reminder', 'Reminder: Your booking BKG-1 is tomorrow.');
            expect(smsServiceMock.send).toHaveBeenCalledWith('+123456789', 'Reminder: Your booking BKG-1 is tomorrow.');
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { BusinessException } from '../exceptions/business.exception';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { Money } from '../../domain/value-objects/money.vo';

describe('BookingService', () => {
    let service: BookingService;
    let bookingRepositoryMock: any;
    let availabilityRepositoryMock: any;
    let vendorServiceRepositoryMock: any;
    let pricingServiceMock: any;
    let notificationServiceMock: any;

    beforeEach(async () => {
        bookingRepositoryMock = {
            findById: jest.fn(),
            save: jest.fn(),
            findByCustomer: jest.fn(),
        };

        availabilityRepositoryMock = {
            checkAvailability: jest.fn(),
            decreaseUnits: jest.fn(),
            increaseUnits: jest.fn(),
        };

        vendorServiceRepositoryMock = {
            findById: jest.fn(),
        };

        pricingServiceMock = {
            calculatePrice: jest.fn(),
        };

        notificationServiceMock = {
            sendBookingConfirmation: jest.fn(),
            sendBookingCancelled: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingService,
                { provide: 'IBookingRepository', useValue: bookingRepositoryMock },
                { provide: 'IAvailabilityRepository', useValue: availabilityRepositoryMock },
                { provide: 'IVendorServiceRepository', useValue: vendorServiceRepositoryMock },
                { provide: 'IPricingService', useValue: pricingServiceMock },
                { provide: 'INotificationService', useValue: notificationServiceMock },
            ],
        }).compile();

        service = module.get<BookingService>(BookingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createBooking', () => {
        const dto = {
            vendorServiceId: 'service-1',
            startTime: '2024-01-01T10:00:00Z',
            endTime: '2024-01-01T12:00:00Z',
            quantity: 2,
            paymentMethod: PaymentMethod.CASH,
            userId: 'user-1',
        };

        it('should throw error if vendor service not found', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue(null);

            await expect(service.createBooking(dto, 'user-1')).rejects.toThrow(BusinessException);
        });

        it('should throw error if not available', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({ id: 'service-1' });
            availabilityRepositoryMock.checkAvailability.mockResolvedValue(false);

            await expect(service.createBooking(dto, 'user-1')).rejects.toThrow('Selected service is not available for requested time/quantity');
        });

        it('should create booking and confirm if CASH', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({ id: 'service-1' });
            availabilityRepositoryMock.checkAvailability.mockResolvedValue(true);
            const price = Money.create(10, 'JOD');
            pricingServiceMock.calculatePrice.mockResolvedValue(price);

            const result = await service.createBooking(dto, 'user-1');

            expect(result).toBeInstanceOf(Booking);
            expect(result.status).toBe(BookingStatus.CONFIRMED);
            expect(result.totalPrice).toBe(20); // 10 * 2
            expect(availabilityRepositoryMock.decreaseUnits).toHaveBeenCalledWith('service-1', expect.any(Date), expect.any(Date), 2);
            expect(bookingRepositoryMock.save).toHaveBeenCalledWith(result);
            expect(notificationServiceMock.sendBookingConfirmation).toHaveBeenCalledWith(result, 'user-1');
        });

        it('should rollback availability if saving booking fails', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({ id: 'service-1' });
            availabilityRepositoryMock.checkAvailability.mockResolvedValue(true);
            pricingServiceMock.calculatePrice.mockResolvedValue(Money.create(10, 'JOD'));

            bookingRepositoryMock.save.mockRejectedValue(new Error('DB Error'));

            await expect(service.createBooking(dto, 'user-1')).rejects.toThrow('DB Error');

            expect(availabilityRepositoryMock.increaseUnits).toHaveBeenCalledWith('service-1', expect.any(Date), expect.any(Date), 2);
        });
    });

    describe('checkIn', () => {
        it('should throw if booking not found', async () => {
            bookingRepositoryMock.findById.mockResolvedValue(null);
            await expect(service.checkIn('b-1', 'v-1')).rejects.toThrow(BusinessException);
        });

        it('should check in successfully', async () => {
            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);
            bookingRepositoryMock.findById.mockResolvedValue(booking);

            await service.checkIn('b-1', 'v-1');

            expect(booking.status).toBe(BookingStatus.COMPLETED);
            expect(bookingRepositoryMock.save).toHaveBeenCalledWith(booking);
        });
    });

    describe('cancelBooking', () => {
        it('should throw if unauthorized', async () => {
            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);
            bookingRepositoryMock.findById.mockResolvedValue(booking);

            await expect(service.cancelBooking('b-1', 'c-2')).rejects.toThrow('Not authorized to cancel this booking');
        });

        it('should cancel booking and increase units', async () => {
            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 2, 10, BookingStatus.CONFIRMED);
            bookingRepositoryMock.findById.mockResolvedValue(booking);

            await service.cancelBooking('b-1', 'c-1', 'Changed mind');

            expect(booking.status).toBe(BookingStatus.CANCELLED);
            expect(booking.cancellationReason).toBe('Changed mind');
            expect(bookingRepositoryMock.save).toHaveBeenCalledWith(booking);
            expect(availabilityRepositoryMock.increaseUnits).toHaveBeenCalledWith('s-1', expect.any(Date), expect.any(Date), 2);
            expect(notificationServiceMock.sendBookingCancelled).toHaveBeenCalledWith(booking, 'c-1');
        });
    });

    describe('markNoShow', () => {
        it('should mark no show', async () => {
            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.CONFIRMED);
            bookingRepositoryMock.findById.mockResolvedValue(booking);

            await service.markNoShow('b-1', 'v-1');

            expect(booking.status).toBe(BookingStatus.NO_SHOW);
            expect(bookingRepositoryMock.save).toHaveBeenCalledWith(booking);
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment', async () => {
            const booking = new Booking('b-1', 'BKG-1', 'c-1', 's-1', new Date(), new Date(), 1, 10, BookingStatus.PENDING);
            bookingRepositoryMock.findById.mockResolvedValue(booking);

            await service.confirmPayment('b-1');

            expect(booking.status).toBe(BookingStatus.CONFIRMED);
            expect(bookingRepositoryMock.save).toHaveBeenCalledWith(booking);
            expect(notificationServiceMock.sendBookingConfirmation).toHaveBeenCalledWith(booking, 'c-1');
        });
    });

    describe('findByCustomer', () => {
        it('should find bookings by customer', async () => {
            bookingRepositoryMock.findByCustomer.mockResolvedValue([{ id: 'b-1' }]);

            const result = await service.findByCustomer('c-1');

            expect(result.length).toBe(1);
            expect(bookingRepositoryMock.findByCustomer).toHaveBeenCalledWith('c-1');
        });
    });
});

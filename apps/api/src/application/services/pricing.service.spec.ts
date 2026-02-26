import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { Money } from '../../domain/value-objects/money.vo';
import { BusinessException } from '../exceptions/business.exception';

describe('PricingService', () => {
    let service: PricingService;
    let vendorServiceRepositoryMock: any;

    beforeEach(async () => {
        vendorServiceRepositoryMock = {
            findById: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PricingService,
                {
                    provide: 'IVendorServiceRepository',
                    useValue: vendorServiceRepositoryMock,
                },
            ],
        }).compile();

        service = module.get<PricingService>(PricingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculatePrice', () => {
        it('should throw an error if vendor service is not found', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue(null);

            await expect(
                service.calculatePrice('invalid-id', new Date(), new Date())
            ).rejects.toThrow(BusinessException);

            await expect(
                service.calculatePrice('invalid-id', new Date(), new Date())
            ).rejects.toThrow('Vendor service not found');
        });

        it('should calculate price for a valid hourly service', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({
                id: '1',
                priceUnit: 'hour',
                price: { amount: 10, currency: 'JOD' },
                minDuration: 1,
                maxDuration: null,
            });

            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T12:00:00Z'); // 2 hours

            const result = await service.calculatePrice('1', start, end);

            expect(result).toBeInstanceOf(Money);
            expect(result.amount).toBe(20);
            expect(result.currency).toBe('JOD');
        });

        it('should calculate price for a valid daily service', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({
                id: '1',
                priceUnit: 'day',
                price: { amount: 50, currency: 'JOD' },
                minDuration: 1,
                maxDuration: null,
            });

            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-03T10:00:00Z'); // 2 days

            const result = await service.calculatePrice('1', start, end);

            expect(result.amount).toBe(100);
            expect(result.currency).toBe('JOD');
        });

        it('should throw error if duration is less than minDuration', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({
                id: '1',
                priceUnit: 'hour',
                price: { amount: 10, currency: 'JOD' },
                minDuration: 3,
                maxDuration: null,
            });

            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T12:00:00Z'); // 2 hours

            await expect(
                service.calculatePrice('1', start, end)
            ).rejects.toThrow('Minimum duration is 3 hour');
        });

        it('should throw error if duration is greater than maxDuration', async () => {
            vendorServiceRepositoryMock.findById.mockResolvedValue({
                id: '1',
                priceUnit: 'hour',
                price: { amount: 10, currency: 'JOD' },
                minDuration: 1,
                maxDuration: 5,
            });

            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T16:00:00Z'); // 6 hours

            await expect(
                service.calculatePrice('1', start, end)
            ).rejects.toThrow('Maximum duration is 5 hour');
        });
    });
});

import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PrismaModule } from './prisma.module';
import { UserRepository } from './repositories/user.repository';
import { VendorServiceRepository } from './repositories/vendor-service.repository';
import { BookingRepository } from './repositories/booking.repository';
import { AvailabilityRepository } from './repositories/availability.repository';
import { ApprovalRequestRepository } from './repositories/approval-request.repository';
import { WebhookValidatorService } from './services/webhook-validator.service';

@Module({
    imports: [PrismaModule],
    providers: [
        EmailService,
        SmsService,
        UserRepository,
        VendorServiceRepository,
        BookingRepository,
        AvailabilityRepository,
        ApprovalRequestRepository,
        WebhookValidatorService,
    ],
    exports: [
        EmailService,
        SmsService,
        PrismaModule,
        UserRepository,
        VendorServiceRepository,
        BookingRepository,
        AvailabilityRepository,
        ApprovalRequestRepository,
        WebhookValidatorService,
    ],
})
export class InfrastructureModule { }

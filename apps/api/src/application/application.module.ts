import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Repositories
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { VendorServiceRepository } from '../infrastructure/repositories/vendor-service.repository';
import { BookingRepository } from '../infrastructure/repositories/booking.repository';
import { AvailabilityRepository } from '../infrastructure/repositories/availability.repository';
import { ApprovalRequestRepository } from '../infrastructure/repositories/approval-request.repository';

// Existing Services
import { NotificationService } from './services/notification.service';
import { PricingService } from './services/pricing.service';
import { ApprovalRequestService } from './services/approval-request.service';
import { BookingService } from './services/booking.service';
import { AuditService } from './services/audit.service';

// Application Specific Services
import { AuthService } from './services/auth/auth.service';
import { UsersService } from './services/users/users.service';
import { CustomerService } from './services/customer/customer.service';
import { VendorServiceLogic } from './services/vendor/vendor-logic.service';
import { AdminLogicService } from './services/admin/admin-logic.service';
import { SharedLogicService } from './services/shared/shared-logic.service';

// Guards
import { RolesGuard } from '../common/guards/roles.guard';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard';
import { WebhookValidatorService } from '../infrastructure/services/webhook-validator.service';

// Controllers
import { AuthController } from '../presentation/controllers/auth/auth.controller';
import { UsersController } from '../presentation/controllers/auth/users.controller';
import { CustomerController } from '../presentation/controllers/customer/customer.controller';
import { VendorController } from '../presentation/controllers/vendor/vendor.controller';
import { AdminController } from '../presentation/controllers/admin/admin.controller';
import { SharedController } from '../presentation/controllers/shared/shared.controller';
import { WebhookController } from '../presentation/controllers/webhooks/webhook.controller';

// Mocks (for unit testing / satisfying DI temporarily until Prisma repos are wired)
const MockEmailService = { provide: 'IEmailService', useValue: { sendConfirmation: async () => { } } };
const MockSmsService = { provide: 'ISmsService', useValue: { sendSms: async () => { } } };


@Module({
    imports: [InfrastructureModule, JwtModule],
    controllers: [
        AuthController,
        UsersController,
        CustomerController,
        VendorController,
        AdminController,
        SharedController,
        WebhookController,
    ],
    providers: [
        // Interfaces
        { provide: 'IPricingService', useClass: PricingService },
        { provide: 'INotificationService', useClass: NotificationService },
        { provide: 'IAuditService', useClass: AuditService },

        // Mocks for external services for now
        MockEmailService,
        MockSmsService,

        // Repositories mapped to Domain Interfaces
        { provide: 'IUserRepository', useExisting: UserRepository },
        { provide: 'IVendorServiceRepository', useExisting: VendorServiceRepository },
        { provide: 'IBookingRepository', useExisting: BookingRepository },
        { provide: 'IAvailabilityRepository', useExisting: AvailabilityRepository },
        { provide: 'IApprovalRequestRepository', useExisting: ApprovalRequestRepository },

        // Core Domain Services
        NotificationService,
        PricingService,
        ApprovalRequestService,
        BookingService,
        AuditService,

        // Application Specific Services
        AuthService,
        UsersService,
        CustomerService,
        VendorServiceLogic,
        AdminLogicService,
        SharedLogicService,

        // Guards (available for DI injection)
        RolesGuard,
        OwnershipGuard,
        WebhookSignatureGuard,
        WebhookValidatorService,
    ],
    exports: [
        NotificationService,
        PricingService,
        ApprovalRequestService,
        BookingService,
        AuditService,
        AuthService,
        UsersService,
        CustomerService,
        VendorServiceLogic,
        AdminLogicService,
        SharedLogicService,
    ],
})
export class ApplicationModule { }

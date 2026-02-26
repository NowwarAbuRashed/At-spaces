# AtSpaces — Backend Classes Documentation

## Architecture Overview

The backend is organized into four concentric layers following Clean Architecture. Each layer has distinct responsibilities and dependency rules — inner layers never depend on outer layers.

```
Presentation → Application → Domain ← Infrastructure
```

---

## 1. Domain Layer (`src/domain/`)

The innermost layer. Contains pure business logic with zero external dependencies.

### Entities

| Class | File | Purpose |
|-------|------|---------|
| `Booking` | `entities/booking.entity.ts` | Represents a workspace booking with lifecycle management (confirm, cancel, check-in, no-show). Contains business rules for status transitions. |
| `ApprovalRequest` | `entities/approval-request.entity.ts` | Represents a vendor change request that requires admin approval. Enforces the rule that only pending requests can be approved/rejected. |

#### Booking Entity

| Method | Description |
|--------|-------------|
| `constructor(...)` | Creates a booking with ID, customer, service, times, quantity, price, status, payment info |
| `confirm()` | Transitions status from `pending` → `confirmed` |
| `cancel()` | Transitions status to `cancelled` |
| `checkIn()` | Marks as `completed` (check-in at venue) |
| `markNoShow()` | Marks as `no_show` |

#### ApprovalRequest Entity

| Method | Description |
|--------|-------------|
| `constructor(...)` | Creates a request with vendor, branch, type, old/new values, reason |
| `approve(reviewerId, notes)` | Transitions from `pending` → `approved`. Throws if not pending. |
| `reject(reviewerId, notes)` | Transitions from `pending` → `rejected`. Throws if not pending. |

### Enums

| Enum | File | Values |
|------|------|--------|
| `UserRole` | `enums/user-role.enum.ts` | `customer`, `vendor`, `admin` |
| `UserStatus` | `enums/user-status.enum.ts` | `pending`, `active`, `suspended` |
| `BookingStatus` | `enums/booking-status.enum.ts` | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `ApprovalStatus` | `enums/approval-status.enum.ts` | `PENDING`, `APPROVED`, `REJECTED` |
| `RequestType` | `enums/request-type.enum.ts` | `CAPACITY_CHANGE`, `SERVICE_UPDATE` |
| `OtpPurpose` | `enums/otp-purpose.enum.ts` | `REGISTRATION`, `PASSWORD_RESET`, `LOGIN` |
| `PaymentMethod` | `enums/payment-method.enum.ts` | `CASH`, `CARD` |
| `PriceUnit` | `enums/price-unit.enum.ts` | `HOUR`, `DAY`, `WEEK`, `MONTH` |

### Value Objects

| Class | File | Purpose |
|-------|------|---------|
| `Money` | `value-objects/money.value-object.ts` | Immutable monetary value with currency. Supports `multiply()`, `add()`, and prevents negative amounts. |

### Interfaces (Repository Contracts)

| Interface | File | Purpose |
|-----------|------|---------|
| `IUserRepository` | `interfaces/user-repository.interface.ts` | User CRUD operations |
| `IBookingRepository` | `interfaces/booking-repository.interface.ts` | Booking persistence |
| `IVendorServiceRepository` | `interfaces/vendor-service-repository.interface.ts` | Vendor service lookup |
| `IAvailabilityRepository` | `interfaces/availability-repository.interface.ts` | Schedule management |
| `IApprovalRequestRepository` | `interfaces/approval-request-repository.interface.ts` | Approval workflow persistence |

### Exceptions

| Class | File | Purpose |
|-------|------|---------|
| `DomainException` | `exceptions/domain.exception.ts` | Business rule violations (e.g., "Only pending requests can be approved") |

---

## 2. Application Layer (`src/application/`)

Orchestrates domain logic, coordinates repositories, and implements use cases.

### Core Services

| Class | File | Purpose | Key Methods |
|-------|------|---------|-------------|
| `BookingService` | `services/booking.service.ts` | Booking lifecycle management | `createBooking()`, `confirmBooking()`, `cancelBooking()`, `checkIn()`, `markNoShow()` |
| `PricingService` | `services/pricing.service.ts` | Dynamic pricing calculation | `calculatePrice()` — computes total from price per unit × duration, enforces min/max duration |
| `ApprovalRequestService` | `services/approval-request.service.ts` | Admin approval workflow | `createRequest()`, `approveRequest()`, `rejectRequest()`, `getPendingRequests()` |
| `NotificationService` | `services/notification.service.ts` | Email/SMS notifications | `sendBookingConfirmation()`, `sendCancellationNotice()`, `sendApprovalNotification()` |
| `AuditService` | `services/audit.service.ts` | Admin activity audit trail | `logAction()`, `getAuditTrail()` |

### Application-Specific Services

| Class | File | Purpose |
|-------|------|---------|
| `AuthService` | `services/auth/auth.service.ts` | Registration, login, OTP, JWT signing with bcrypt password hashing |
| `UsersService` | `services/users/users.service.ts` | User profile CRUD |
| `CustomerService` | `services/customer/customer.service.ts` | Branch browsing, availability checking, booking management |
| `VendorServiceLogic` | `services/vendor/vendor-logic.service.ts` | Vendor dashboard, service management, pricing, availability |
| `AdminLogicService` | `services/admin/admin-logic.service.ts` | Branch/vendor management, analytics |
| `SharedLogicService` | `services/shared/shared-logic.service.ts` | Cities, facilities, features, AI recommendations |

### Exceptions

| Class | File | Purpose |
|-------|------|---------|
| `BusinessException` | `exceptions/business.exception.ts` | Application-level validation errors (HTTP 400) |

### DTOs (Data Transfer Objects)

| Group | Files | Purpose |
|-------|-------|---------|
| Auth DTOs | `dtos/auth/register.dto.ts`, `login.dto.ts`, `verify-otp.dto.ts`, `resend-otp.dto.ts` | Input validation for auth endpoints |
| Customer DTOs | `dtos/customer/check-availability.dto.ts` | Availability check parameters |
| Vendor DTOs | `dtos/vendor/vendor.dtos.ts` | Price update, capacity request, availability update |
| Admin DTOs | `dtos/admin/admin.dtos.ts` | Approval review, branch status, vendor status |
| Request DTOs | `dtos/requests/create-booking.dto.ts` | Booking creation parameters |
| Shared DTOs | `dtos/shared/shared.dtos.ts` | AI recommendation, facility/feature updates |

---

## 3. Infrastructure Layer (`src/infrastructure/`)

Implements repository interfaces and integrates with external systems.

### Repositories (Prisma Implementations)

| Class | File | Implements | Purpose |
|-------|------|-----------|---------|
| `UserRepository` | `repositories/user.repository.ts` | `IUserRepository` | User CRUD via Prisma |
| `BookingRepository` | `repositories/booking.repository.ts` | `IBookingRepository` | Booking CRUD with enum mapping, ID overflow handling |
| `VendorServiceRepository` | `repositories/vendor-service.repository.ts` | `IVendorServiceRepository` | Vendor service lookup and updates |
| `AvailabilityRepository` | `repositories/availability.repository.ts` | `IAvailabilityRepository` | Schedule slot management |
| `ApprovalRequestRepository` | `repositories/approval-request.repository.ts` | `IApprovalRequestRepository` | Approval workflow persistence with enum/relation mapping |

### External Services

| Class | File | Purpose |
|-------|------|---------|
| `PrismaService` | `services/prisma.service.ts` | Singleton Prisma client (extends `PrismaClient`), handles connection lifecycle |
| `EmailService` | `services/email.service.ts` | SMTP email sending via Nodemailer |
| `SmsService` | `services/sms.service.ts` | SMS sending (stub for development) |
| `WebhookValidatorService` | `services/webhook-validator.service.ts` | Payment webhook signature validation for Apple Pay, Visa, Mastercard |

#### WebhookValidatorService Methods

| Method | Provider | Validation |
|--------|----------|-----------|
| `validateApplePay()` | Apple Pay | ECDSA/SHA-256 certificate chain + merchant ID hash |
| `validateVisa()` | Visa | HMAC-SHA256 + ±5 min timestamp window |
| `validateMastercard()` | Mastercard | HMAC-SHA256 + nonce + timestamp replay protection |

### Modules

| Module | File | Purpose |
|--------|------|---------|
| `PrismaModule` | `prisma.module.ts` | Provides and exports `PrismaService` as a global singleton |
| `InfrastructureModule` | `infrastructure.module.ts` | Registers all repositories and services, exports them for `ApplicationModule` |

---

## 4. Presentation Layer (`src/presentation/`)

HTTP interface — controllers that handle requests and delegate to services.

### Controllers

| Class | File | Route Prefix | Purpose |
|-------|------|-------------|---------|
| `AuthController` | `controllers/auth/auth.controller.ts` | `/api/auth` | Registration, login, OTP verification |
| `UsersController` | `controllers/auth/users.controller.ts` | `/api/users` | User profile management |
| `CustomerController` | `controllers/customer/customer.controller.ts` | `/api` | Branch browsing, booking, availability |
| `VendorController` | `controllers/vendor/vendor.controller.ts` | `/api` | Vendor dashboard, services, pricing, capacity |
| `AdminController` | `controllers/admin/admin.controller.ts` | `/api/admin` | Approval requests, branch/vendor management, analytics, audit logs |
| `SharedController` | `controllers/shared/shared.controller.ts` | `/api` | Cities, facilities, features, AI recommendations |
| `WebhookController` | `controllers/webhooks/webhook.controller.ts` | `/api/webhooks` | Payment event webhooks (Apple Pay, Visa, Mastercard) |

---

## 5. Common Layer (`src/common/`)

Cross-cutting concerns shared across all layers.

### Guards

| Class | File | Purpose |
|-------|------|---------|
| `JwtAuthGuard` | `guards/jwt-auth.guard.ts` | Validates JWT Bearer token, attaches user to `req.user` |
| `RolesGuard` | `guards/roles.guard.ts` | Checks `req.user.role` against `@Roles()` metadata. Returns structured 403. |
| `OwnershipGuard` | `guards/ownership.guard.ts` | Verifies vendor owns the resource via branch → vendorId chain. Admins bypass. |
| `WebhookSignatureGuard` | `guards/webhook-signature.guard.ts` | Routes to correct `WebhookValidatorService` method based on `@WebhookProvider()`. Returns 401. |

### Decorators

| Decorator | File | Purpose |
|-----------|------|---------|
| `@Roles(...)` | `decorators/roles.decorator.ts` | Sets required roles metadata for `RolesGuard` |
| `@OwnershipCheck(entity, param)` | `decorators/ownership.decorator.ts` | Sets entity type and param name for `OwnershipGuard` |
| `@WebhookProvider(provider)` | `decorators/webhook-provider.decorator.ts` | Sets payment provider for `WebhookSignatureGuard` |

### Strategies

| Class | File | Purpose |
|-------|------|---------|
| `JwtStrategy` | `strategies/jwt.strategy.ts` | Passport strategy that extracts Bearer token, validates with secret, returns `{ id, role, email }` |

---

## 6. Module Wiring (`ApplicationModule`)

The `ApplicationModule` is the central wiring point that:

1. Imports `InfrastructureModule` (which provides all repositories and external services)
2. Maps domain interfaces to concrete implementations (e.g., `IBookingRepository → BookingRepository`)
3. Registers all application services and guards
4. Declares all controllers

```typescript
// Repository mapping example
{ provide: 'IUserRepository', useExisting: UserRepository }
{ provide: 'IBookingRepository', useExisting: BookingRepository }
```

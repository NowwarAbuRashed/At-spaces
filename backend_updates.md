# Backend Updates Summary

This document summarizes the recently implemented backend features and architectures for the **At Spaces** platform. The implementations follow a Domain-Driven Design (DDD) approach with clear layer separation (Domain, Application, Infrastructure, Presentation).

---

## 🏗️ 1. Pricing Engine (TASK BE-01)
Created the core pricing logic to calculate costs for different services based on business rules.
* **Domain Layer:** 
  * `Money` Value Object: Encapsulates currency and amount logic (`add`, `multiply`, `equals`), strictly ensuring valid values (no negative amounts).
* **Application Layer:** 
  * `IPricingService` Interface.
  * `PricingService` Implementation: Calculates prices based on a vendor service, verifying `minDuration` and `maxDuration` business constraints.

---

## 📝 2. Approval Workflow (TASK BE-02)
Implemented the system for vendors to request capacity or configuration changes, which admins can approve or reject.
* **Domain Layer:** 
  * `ApprovalRequest` Entity: Maintains the request state (`status`, `oldValue`, `newValue`) and internal transition logic (`approve()`, `reject()`).
  * `IApprovalRequestRepository` Interface.
* **Application Layer:** 
  * `CreateApprovalRequestDto`: DTO with validations (`@IsUUID`, `@IsEnum`) for branch and service IDs.
  * `ApprovalRequestService`: Handles request creation, approval logic (auto-updating vendor capacities when approved), and rejection logic.
* **Presentation Layer:**
  * `VendorApprovalController`: Exposes `POST /vendor/approval-requests`.
  * `AdminApprovalController`: Exposes endpoints to review (`GET /admin/approval-requests`), approve, and reject requests.

---

## 📅 3. Booking Lifecycle (TASK BE-03)
Built the comprehensive booking system handling everything from creation to checking in and cancellations.
* **Domain Layer:** 
  * `Booking` Entity: Manages statuses (`PENDING`, `CONFIRMED`, `COMPLETED`, `NO_SHOW`, `CANCELLED`) with rigid state transition guards.
  * `IAvailabilityRepository` Interface: Defines checks and unit increments/decrements.
* **Application Layer:**
  * `CreateBookingDto`: Payload validation for start/end times and configurations.
  * `BookingNumber Utility`: Auto-generates unique `BKG-` identifiers.
  * `BookingService` (`IBookingService`): Deep business logic interacting with Pricing, Availability, Validation, and Notifications safely. Manages booking lifecycles like `createBooking`, `checkIn`, `cancelBooking`, and `markNoShow`.
* **Presentation Layer:**
  * `BookingsController`: Customer endpoints to create and cancel bookings, view my-bookings; Vendor endpoints to manage check-ins and no-shows.

---

## 🔔 4. Notification Service (TASK BE-04)
Implemented multi-channel delivery for alerts and transactional messaging.
* **Application Layer:** 
  * `INotificationService`: High-level business actions (`sendBookingConfirmation`, `sendApprovalResult`, `sendBookingCancelled`, etc.).
  * `IEmailService` & `ISmsService`: Abstractions for external notification clients.
  * `NotificationService`: Resolves users (via `IUserRepository`) and decides when and how to notify them across channels via Email and SMS.
* **Infrastructure Layer:**
  * `EmailService`: Implementation ready for Nodemailer integration.
  * `SmsService`: Implementation ready for Twilio integration.
  * `InfrastructureModule` & `ApplicationModule`: Registered all new providers and exported the services for Dependency Injection across `app.module.ts`.

# Changelog — Mock Data to Real Prisma Migration

> Session: 2026-02-27 | Branch: `main` | Repo: [NowwarAbuRashed/At-spaces](https://github.com/NowwarAbuRashed/At-spaces)

---

## Commit 1 — `1fcc5ab`
**refactor: replace all mock data with real Prisma database queries**

### Files Changed (5 files, +408 −66)

#### [customer.service.ts](file:///d:/AtSpacesV1/apps/api/src/application/services/customer/customer.service.ts)
| Method | What Changed | Why |
|---|---|---|
| `getBranches()` | Was returning a hardcoded array `[{ id: 1, name: "Main Branch" }]`. Now uses `prisma.branch.findMany()` with optional `city` and `serviceType` filters, includes vendor and services. | Customers need to see real branches from the database, filtered by their search criteria. |
| `getBranchDetails()` | Was returning hardcoded `"WeWork Abdali"`. Now uses `prisma.branch.findUnique()` with full relation includes (facilities, services, features). | Branch detail pages must show real data — facilities, services, pricing, and vendor info. |
| `checkAvailability()` | Price was hardcoded to `50.00`. Now uses `PricingService.calculatePrice()` multiplied by quantity. | Pricing must reflect each vendor service's actual rates. |

#### [vendor-logic.service.ts](file:///d:/AtSpacesV1/apps/api/src/application/services/vendor/vendor-logic.service.ts)
| Method | What Changed | Why |
|---|---|---|
| `getDashboard()` | Was returning `{ todayOccupancy: 85, upcomingBookings: 12 }`. Now computes live stats: today's bookings, upcoming count, occupancy rate, active/total branches. | Vendor dashboard must reflect real-time business metrics. |
| `getVendorServices()` | Was returning hardcoded `"Private Office"`. Now uses `prisma.vendorService.findMany()` with features and branch info. | Vendors need to see their actual services and manage them. |
| `getBranchBookings()` | Was returning `[]`. Now queries bookings with customer details, service name, branch name, and optional date filter. | Vendors need to see their actual bookings to manage operations. |
| `updateAvailability()` | Was an empty stub. Now upserts availability slots (update existing or create new) via Prisma. | Vendors need to manage time slot availability for their services. |
| `requestCapacityChange()` | `oldValue` was hardcoded to `'0'`. Now fetches the real current capacity from the database. | Approval requests must show accurate before/after values. |

#### [admin-logic.service.ts](file:///d:/AtSpacesV1/apps/api/src/application/services/admin/admin-logic.service.ts)
| Method | What Changed | Why |
|---|---|---|
| `getBranches()` | Was returning `[{ name: "WeWork Abdali" }]`. Now uses `prisma.branch.findMany()` with vendor info and service/request counts. | Admins need to see all real branches with their status and vendor details. |
| `updateBranchStatus()` | Was an empty stub. Now finds branch by ID, throws `NotFoundException` if missing, then updates status via Prisma. | Admins must be able to activate/deactivate branches. |
| `getVendors()` | Was returning `[{ fullName: "Ahmad Doe" }]`. Now queries `prisma.user.findMany({ role: 'vendor' })` with branch info. | Admin vendor management requires real vendor data. |
| `getAnalytics()` | Was returning `{ totalBookings: 1540, revenue: 25000.50 }`. Now computes real aggregations: booking count, revenue sum, occupancy rate, and top cities by booking volume. | Analytics must reflect actual platform performance. |

#### [availability.repository.ts](file:///d:/AtSpacesV1/apps/api/src/infrastructure/repositories/availability.repository.ts)
| Method | What Changed | Why |
|---|---|---|
| `decreaseUnits()` | Was a stub (`// Logic to decrease units`). Now finds matching availability slots and decrements `availableUnits` via Prisma. | Booking creation must reduce available capacity. |
| `increaseUnits()` | Was a stub (`// Logic to increase units`). Now finds matching slots and increments `availableUnits` back. | Booking cancellation must restore capacity. |

#### [vendor.dtos.ts](file:///d:/AtSpacesV1/apps/api/src/application/dtos/vendor/vendor.dtos.ts)
| What Changed | Why |
|---|---|
| Added `startTime`, `endTime`, `availableUnits`, `isBlocked` fields to `UpdateAvailabilityDto`. | The real `updateAvailability` implementation needs these fields to manage time slots properly. |

---

## Commit 2 — `b7ab2d6`
**feat: activate capacity update and audit logging in ApprovalRequestService**

### Files Changed (1 file, +24 −13)

#### [approval-request.service.ts](file:///d:/AtSpacesV1/apps/api/src/application/services/approval-request.service.ts)
| Change | What Changed | Why |
|---|---|---|
| Capacity update | Was commented out: `// vendorService.setCapacity(...)`. Now uses `prisma.vendorService.update({ data: { maxCapacity } })` on approval. | When an admin approves a capacity change request, it must actually update the service's capacity. |
| Audit logging (approve) | Was commented out: `// this.auditService.log(...)`. Now calls `this.auditService.logAction()` with action `APPROVED_REQUEST`. | All admin actions must be tracked in the audit trail for accountability. |
| Audit logging (reject) | Same — was commented out. Now calls `logAction()` with `REJECTED_REQUEST`. | Rejection decisions also need an audit record. |
| DI wiring | Injected `AuditService` via `@Inject('IAuditService')` and `PrismaService`. | Required for the capacity update and audit logging to work. |

---

## Commit 3 — `a790b6f`
**refactor: replace mock data in SharedLogicService AI recommendation**

### Files Changed (1 file, +21 −8)

#### [shared-logic.service.ts](file:///d:/AtSpacesV1/apps/api/src/application/services/shared/shared-logic.service.ts)
| Change | What Changed | Why |
|---|---|---|
| AI prompt | Was listing `Available Mock Branches: "WeWork Abdali" (ID: 1), "ZINC King Hussein Business Park" (ID: 2)`. Now dynamically fetches real branches from DB and formats them into the prompt with name, ID, and city. | The AI must recommend from actual branches that exist in the platform. |
| `getFallbackRecommendation()` | Was returning hardcoded `{ id: 1, name: "WeWork Abdali" }`. Now takes a `branches` array parameter and returns the first real branch + alternatives. Returns `null` if no branches exist. | Fallback must reflect real data, not fictional branches. |

---

## Commit 4 — `ed7c7fc`
**feat: implement real EmailService and SmsService**

### Files Changed (4 files, +86 −47)

#### [email.service.ts](file:///d:/AtSpacesV1/apps/api/src/infrastructure/services/email.service.ts)
| Change | What Changed | Why |
|---|---|---|
| Full implementation | Was entirely commented out, only `console.log`. Now uses `nodemailer` with Gmail SMTP (`service: 'gmail'`). Reads `SMTP_EMAIL` and `SMTP_APP_PASSWORD` from `ConfigService`. Includes proper error handling with NestJS `Logger`. | The platform needs to actually send emails for notifications, password resets, booking confirmations, etc. |

#### [sms.service.ts](file:///d:/AtSpacesV1/apps/api/src/infrastructure/services/sms.service.ts)
| Change | What Changed | Why |
|---|---|---|
| Conditional Twilio | Was entirely commented out, only `console.log`. Now checks for `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` in config. If present, initializes Twilio client via dynamic `require()`. If missing, gracefully falls back to logging with a warning. | SMS should work when Twilio is configured, but shouldn't crash the app when it's not. |

#### package.json + package-lock.json
| Change | Why |
|---|---|
| Added `nodemailer` and `@types/nodemailer` dependencies. | Required for the EmailService implementation. |

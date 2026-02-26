# AtSpaces — API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via the `/api/auth/login` or `/api/auth/verify-otp` endpoints. The token payload contains `{ sub: userId, role: userRole, email: userEmail }`.

---

## 1. Authentication Endpoints

### POST `/api/auth/register`

Register a new user (customer or vendor).

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `fullName` | body | string | ✅ | User's full name |
| `email` | body | string | ✅ | Email address (unique) |
| `phoneNumber` | body | string | ✅ | Phone number for OTP verification |
| `password` | body | string | ✅ | Account password |
| `role` | body | string | ❌ | `customer` (default) or `vendor` |

**Example Request:**

```json
{
  "fullName": "Ahmad Al-Masri",
  "email": "ahmad@example.com",
  "phoneNumber": "+962791234567",
  "password": "SecurePass123!",
  "role": "customer"
}
```

**Success Response (201):**

```json
{
  "userId": 12,
  "message": "User registered successfully. Please verify OTP."
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Email already registered"
}
```

---

### POST `/api/auth/verify-otp`

Verify the OTP sent during registration. Activates the user account and returns a JWT.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `phoneNumber` | body | string | ✅ | Phone number OTP was sent to |
| `otpCode` | body | string | ✅ | 4-digit OTP code |

**Example Request:**

```json
{
  "phoneNumber": "+962791234567",
  "otpCode": "4821"
}
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 12,
    "role": "customer",
    "email": "ahmad@example.com",
    "fullName": "Ahmad Al-Masri"
  }
}
```

---

### POST `/api/auth/login`

Authenticate with email and password. Returns a JWT token.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `email` | body | string | ✅ | Registered email |
| `password` | body | string | ✅ | Account password |

**Example Request:**

```json
{
  "email": "ahmad@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 12,
    "role": "customer",
    "email": "ahmad@example.com",
    "fullName": "Ahmad Al-Masri"
  }
}
```

**Error Response (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid email or password"
}
```

---

### POST `/api/auth/resend-otp`

Resend OTP to a phone number. Invalidates previous unused OTPs.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `phoneNumber` | body | string | ✅ | Target phone number |

**Success Response (200):**

```json
{
  "message": "OTP resent successfully"
}
```

---

## 2. Customer Endpoints

### GET `/api/branches`

List all active branches with optional filtering.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `city` | query | string | ❌ | Filter by city name |
| `serviceType` | query | string | ❌ | Filter by service type |

**Example:** `GET /api/branches?city=Amman`

**Success Response (200):**

```json
[
  {
    "id": 10,
    "name": "WeWork Abdali",
    "city": "Amman",
    "address": "Abdali Boulevard, Building 5",
    "status": "active",
    "vendorId": 11
  }
]
```

---

### GET `/api/branches/:id`

Get detailed information about a specific branch.

**Success Response (200):**

```json
{
  "id": 10,
  "name": "WeWork Abdali",
  "city": "Amman",
  "address": "Abdali Boulevard",
  "description": "Modern coworking space in downtown Amman",
  "services": [...],
  "facilities": [...]
}
```

---

### POST `/api/availability/check`

Check workspace availability and get pricing.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `vendorServiceId` | body | number | ✅ | The service to check |
| `date` | body | string | ✅ | Date in ISO format |
| `startTime` | body | string | ✅ | Start time |
| `endTime` | body | string | ✅ | End time |

**Example Request:**

```json
{
  "vendorServiceId": 10,
  "date": "2026-03-01",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Success Response (200):**

```json
{
  "available": true,
  "price": 45.00,
  "currency": "JOD"
}
```

---

### POST `/api/bookings`

Create a new booking. Requires authentication.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `vendorServiceId` | body | string | ✅ | Service to book |
| `startTime` | body | string | ✅ | ISO datetime start |
| `endTime` | body | string | ✅ | ISO datetime end |
| `quantity` | body | number | ❌ | Number of units (default: 1) |
| `customerId` | body | number | ❌ | Customer ID (auto from JWT if omitted) |

**Success Response (201):**

```json
{
  "bookingId": "25",
  "bookingNumber": "BK-1740567890123",
  "totalPrice": 45.00,
  "status": "pending"
}
```

---

### GET `/api/bookings/my`

List the authenticated customer's bookings.

**Success Response (200):**

```json
[
  {
    "id": "25",
    "bookingNumber": "BK-1740567890123",
    "status": "pending",
    "startTime": "2026-03-01T09:00:00.000Z",
    "endTime": "2026-03-01T17:00:00.000Z",
    "totalPrice": 45.00
  }
]
```

---

### POST `/api/bookings/:id/cancel`

Cancel a booking by ID.

**Success Response (200):**

```json
{
  "message": "Booking cancelled"
}
```

---

## 3. Vendor Endpoints

### POST `/api/vendors/register`

Submit a vendor registration request (requires admin approval).

**Success Response (202):**

```json
{
  "message": "Vendor registration request submitted."
}
```

---

### GET `/api/vendors/dashboard`

Get vendor dashboard overview (branch summary, booking stats).

**Success Response (200):**

```json
{
  "branches": [...],
  "totalBookings": 42,
  "recentBookings": [...]
}
```

---

### GET `/api/vendor-services`

List all services offered by the authenticated vendor.

**Success Response (200):**

```json
[
  {
    "id": 10,
    "branchId": 10,
    "serviceName": "hot_desk",
    "maxCapacity": 50,
    "pricePerUnit": 15.00,
    "priceUnit": "hour"
  }
]
```

---

### PUT `/api/vendor-services/:id/price`

Update the price of a specific service.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `price` | body | number | ✅ | New price per unit |

**Success Response (200):**

```json
{
  "message": "Price updated successfully"
}
```

---

### POST `/api/vendor-services/:id/capacity-request`

Request a capacity change (requires admin approval).

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `newCapacity` | body | number | ✅ | Requested new capacity |
| `reason` | body | string | ❌ | Reason for the change |

**Success Response (202):**

```json
{
  "message": "Capacity change request submitted for approval"
}
```

---

### PUT `/api/availability`

Update availability schedule for a branch service.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `vendorServiceId` | body | number | ✅ | Service ID |
| `dayOfWeek` | body | number | ✅ | 0 (Sunday) to 6 (Saturday) |
| `startTime` | body | string | ✅ | Opening time |
| `endTime` | body | string | ✅ | Closing time |

**Success Response (200):**

```json
{
  "message": "Availability updated"
}
```

---

### GET `/api/vendors/bookings`

View bookings for the vendor's branches.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `date` | query | string | ❌ | Filter by date |

**Success Response (200):** Array of booking objects.

---

### PATCH `/api/bookings/:id/status`

Update booking status (check-in or mark no-show).

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `status` | body | string | ✅ | `completed` or `no_show` |

**Success Response (200):**

```json
{
  "message": "Booking status updated"
}
```

---

## 4. Admin Endpoints

### GET `/api/admin/approval-requests`

List pending approval requests.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `status` | query | string | ❌ | `pending`, `approved`, or `rejected` |

**Success Response (200):** Array of approval request objects.

---

### POST `/api/admin/approval-requests/:id/review`

Approve or reject an approval request.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `decision` | body | string | ✅ | `approved` or `rejected` |
| `reviewNotes` | body | string | ❌ | Review notes |

**Success Response (200):**

```json
{
  "message": "Request successfully approved"
}
```

---

### GET `/api/admin/branches`

List all branches for management.

**Success Response (200):** Array of branch objects.

---

### PATCH `/api/admin/branches/:id/status`

Update a branch's status.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `status` | body | string | ✅ | `active`, `suspended`, or `pending` |

**Success Response (200):**

```json
{
  "message": "Branch status updated"
}
```

---

### GET `/api/admin/vendors`

List all vendors.

**Success Response (200):** Array of vendor user objects.

---

### PATCH `/api/admin/vendors/:id/status`

Update a vendor's account status.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `status` | body | string | ✅ | `active` or `suspended` |

**Success Response (200):**

```json
{
  "message": "Vendor status updated"
}
```

---

### GET `/api/admin/analytics`

View platform analytics.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `from` | query | string | ❌ | Start date |
| `to` | query | string | ❌ | End date |

**Success Response (200):**

```json
{
  "totalBookings": 1540,
  "occupancyRate": 0.75,
  "revenue": 25000.50,
  "topCities": ["Amman"]
}
```

---

### GET `/api/admin/audit-logs`

View admin activity audit trail.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `adminId` | query | number | ❌ | Filter by admin |
| `action` | query | string | ❌ | Filter by action type |
| `entityType` | query | string | ❌ | Filter by entity type |
| `limit` | query | number | ❌ | Max results (default: 50) |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "adminId": 11,
    "action": "APPROVED_REQUEST",
    "entityType": "ApprovalRequest",
    "entityId": 5,
    "details": { "reviewNotes": "Looks good" },
    "ipAddress": "::1",
    "createdAt": "2026-02-26T10:15:00.000Z",
    "admin": {
      "id": 11,
      "fullName": "Admin User",
      "email": "admin@atspaces.com",
      "role": "admin"
    }
  }
]
```

---

## 5. Shared Endpoints

### GET `/api/cities`

List all supported cities.

**Success Response (200):**

```json
["Amman", "Irbid", "Aqaba"]
```

---

### GET `/api/facilities`

List all available branch facilities.

**Success Response (200):**

```json
[
  { "id": 11, "name": "WiFi", "icon": "wifi" }
]
```

---

### GET `/api/features`

List all available service features.

**Success Response (200):**

```json
[
  { "id": 11, "name": "Whiteboard", "icon": "board" }
]
```

---

### POST `/api/ai/recommend`

Get AI-powered branch recommendations.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `preferences` | body | string | ✅ | User preferences description |
| `city` | body | string | ❌ | Preferred city |

**Success Response (200):**

```json
{
  "recommendation": "Based on your preferences, I recommend..."
}
```

---

### PUT `/api/branches/:id/facilities`

Update facilities for a specific branch.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `facilityIds` | body | number[] | ✅ | Array of facility IDs |

**Success Response (200):**

```json
{
  "message": "Branch facilities updated"
}
```

---

### PUT `/api/vendor-services/:id/features`

Update features for a specific vendor service.

| Field | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `featureIds` | body | number[] | ✅ | Array of feature IDs |

**Success Response (200):**

```json
{
  "message": "Service features updated"
}
```

---

## 6. Webhook Endpoints

These endpoints receive payment event notifications from payment processors. Each is protected by signature validation (see [Security.md](./Security.md)).

### POST `/api/webhooks/apple-pay`

Handle Apple Pay payment events. Validates `Apple-Pay-Signature` header using ECDSA/SHA-256.

### POST `/api/webhooks/visa`

Handle Visa payment events. Validates `X-Pay-Token` header using HMAC-SHA256 with timestamp check.

### POST `/api/webhooks/mastercard`

Handle Mastercard payment events. Validates `X-Signature` header using HMAC-SHA256 with nonce and timestamp.

**Success Response (200):**

```json
{
  "received": true,
  "provider": "visa"
}
```

**Error Response (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid Visa signature"
}
```

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `202` | Request accepted (pending approval) |
| `400` | Bad request / Validation error |
| `401` | Unauthorized (missing or invalid JWT / webhook signature) |
| `403` | Forbidden (insufficient role or ownership) |
| `404` | Resource not found |
| `500` | Internal server error |

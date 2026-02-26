# AtSpaces — Security Documentation

## 1. Authentication

### JWT (JSON Web Tokens)

AtSpaces uses **stateless JWT authentication** via `@nestjs/jwt` and `passport-jwt`.

**Token Structure:**

```json
{
  "sub": 12,          // User ID
  "role": "customer", // User role
  "email": "user@example.com",
  "iat": 1740567890,  // Issued at
  "exp": 1740654290   // Expires (24h)
}
```

**Configuration:**

| Setting | Value | Source |
|---------|-------|--------|
| Algorithm | HMAC SHA-256 | Default `@nestjs/jwt` |
| Expiration | 24 hours | `signOptions.expiresIn` |
| Secret | Configurable | `JWT_SECRET` env var |
| Extraction | `Authorization: Bearer <token>` | `ExtractJwt.fromAuthHeaderAsBearerToken()` |

**Implementation Files:**

| File | Purpose |
|------|---------|
| `src/common/strategies/jwt.strategy.ts` | Passport JWT strategy — validates token and returns `{ id, role, email }` to `req.user` |
| `src/common/guards/jwt-auth.guard.ts` | NestJS guard wrapping `AuthGuard('jwt')` |
| `src/application/services/auth/auth.service.ts` | Signs tokens on login and OTP verification |

### OTP Phone Verification

- **Generation**: 4-digit random code on registration
- **Storage**: `OtpSession` table in PostgreSQL with expiration timestamp
- **Expiry**: 10 minutes after generation
- **One-time use**: OTP is marked as `isUsed: true` after verification
- **Resend**: Invalidates all previous unused OTPs before generating a new one

### Password Security

| Measure | Implementation |
|---------|---------------|
| **Hashing** | `bcrypt` with salt rounds = 10 |
| **Comparison** | `bcrypt.compare()` (constant-time internally) |
| **Storage** | Only the hash is stored in `users.password_hash` |
| **Raw password** | Never logged, never stored, never returned in responses |

---

## 2. Authorization — Role-Based Access Control (RBAC)

### Role Hierarchy

| Role | Access Level |
|------|-------------|
| `admin` | Full platform management — approvals, status changes, analytics, audit trail |
| `vendor` | Own branches and services only — pricing, capacity, availability, bookings |
| `customer` | Own bookings — browse, book, cancel |

### Guard Architecture

Three composable guards enforce authorization in layers:

```
Request → JwtAuthGuard → RolesGuard → OwnershipGuard → Controller
```

#### RolesGuard

- **File**: `src/common/guards/roles.guard.ts`
- **Reads**: `@Roles()` decorator metadata via `Reflector`
- **Behavior**: Compares `req.user.role` against allowed roles
- **Error**: Returns structured `{ statusCode: 403, message: "...", error: "Forbidden" }` — **never returns 404** (no security through obscurity)

#### OwnershipGuard

- **File**: `src/common/guards/ownership.guard.ts`
- **Reads**: `@OwnershipCheck(entityType, paramName)` decorator metadata
- **Behavior**: For vendor-scoped mutations, queries the database to verify the vendorId from JWT matches the resource's owner via the `VendorService → Branch → vendorId` chain
- **Bypass**: Admin role bypasses ownership checks entirely
- **Error**: Returns structured 403 if ownership doesn't match

#### Usage Example

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Roles('vendor')
@OwnershipCheck('VendorService', 'id')
@Put('vendor-services/:id/price')
async updatePrice(@Param('id') id: number, @Body() dto: UpdatePriceDto) { ... }
```

### Decorators

| Decorator | File | Purpose |
|-----------|------|---------|
| `@Roles('admin', 'vendor')` | `decorators/roles.decorator.ts` | Declares required roles for a route |
| `@OwnershipCheck('VendorService', 'id')` | `decorators/ownership.decorator.ts` | Declares which entity to verify ownership for |

---

## 3. Webhook Signature Validation

Payment processor webhooks are validated before any payload is processed. Invalid signatures receive an immediate **HTTP 401** — the payload is never read.

### Implementation

| File | Purpose |
|------|---------|
| `src/infrastructure/services/webhook-validator.service.ts` | Core validation logic for all 3 providers |
| `src/common/guards/webhook-signature.guard.ts` | NestJS guard that invokes the correct validator |
| `src/common/decorators/webhook-provider.decorator.ts` | `@WebhookProvider('visa')` metadata decorator |

### Provider-Specific Validation

| Provider | Header | Algorithm | Anti-Replay |
|----------|--------|-----------|-------------|
| **Apple Pay** | `Apple-Pay-Signature` | ECDSA / SHA-256 certificate chain | Merchant ID hash verification |
| **Visa** | `X-Pay-Token` | HMAC-SHA256 | ±5 minute timestamp window |
| **Mastercard** | `X-Signature` + `X-Nonce` + `X-Timestamp` | HMAC-SHA256 | Nonce + ±5 minute timestamp window |

### Constant-Time Comparison

All signature comparisons use `crypto.timingSafeEqual()` to prevent **timing attacks**:

```typescript
private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufA, bufB);
}
```

### Failure Logging

Every failed validation attempt is logged with:

- Provider name
- Failure reason
- Source IP address
- Timestamp
- Headers received (keys only, not values)

---

## 4. Audit Logging

All admin state-changing actions are recorded in the `audit_logs` database table for compliance and forensic analysis.

### Logged Actions

| Action | Trigger |
|--------|---------|
| `APPROVED_REQUEST` | Admin approves an approval request |
| `REJECTED_REQUEST` | Admin rejects an approval request |
| `UPDATED_BRANCH_STATUS` | Admin changes branch status |
| `UPDATED_VENDOR_STATUS` | Admin changes vendor status |

### Audit Log Schema

| Field | Type | Description |
|-------|------|-------------|
| `adminId` | INT | Who performed the action |
| `action` | VARCHAR(100) | Action type (e.g., `APPROVED_REQUEST`) |
| `entityType` | VARCHAR(50) | Affected entity (e.g., `ApprovalRequest`) |
| `entityId` | INT | ID of the affected record |
| `details` | JSON | Request body, old/new values, notes |
| `ipAddress` | VARCHAR(45) | Source IP of the request |
| `createdAt` | TIMESTAMP | When the action occurred |

### Querying Audit Logs

```
GET /api/admin/audit-logs?adminId=5&action=APPROVED_REQUEST&limit=20
```

---

## 5. Secrets Management

### Environment Variables

All sensitive values are stored in `.env` files and accessed via `@nestjs/config`:

| Secret | Env Variable | Purpose |
|--------|-------------|---------|
| Database URL | `DATABASE_URL` | PostgreSQL connection string |
| JWT Signing Secret | `JWT_SECRET` | Token signing and verification |
| OpenAI API Key | `OPENAI_API_KEY` | AI recommendation engine |
| SMTP Credentials | `SMTP_EMAIL`, `SMTP_APP_PASSWORD` | Email sending |
| Apple Pay Merchant ID | `APPLE_PAY_MERCHANT_ID` | Webhook merchant verification |
| Apple Pay Certificate | `APPLE_PAY_CERTIFICATE` | ECDSA signature verification |
| Visa Webhook Secret | `VISA_WEBHOOK_SECRET` | HMAC signing key |
| Mastercard Webhook Secret | `MASTERCARD_WEBHOOK_SECRET` | HMAC signing key |

### Security Rules

- `.env` is listed in `.gitignore` — never committed to version control
- Secrets are injected via `ConfigService.get()` — never hardcoded
- Production deployments should use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault)

---

## 6. Data Protection

| Measure | Implementation |
|---------|---------------|
| **Password hashing** | bcrypt with 10 salt rounds |
| **Sensitive fields** | `passwordHash` is never returned in API responses |
| **OTP expiry** | OTPs expire after 10 minutes and are single-use |
| **SQL injection** | Prevented by Prisma's parameterized queries |
| **Type safety** | TypeScript + Prisma generated types prevent type confusion attacks |

---

## 7. Input Validation

| Layer | Mechanism |
|-------|-----------|
| **DTOs** | TypeScript classes with type annotations for all endpoint inputs |
| **Prisma** | Schema-level constraints (unique, not null, varchar lengths, enums) |
| **Domain** | Entity methods enforce business rules (e.g., "only pending requests can be approved") |
| **Guards** | Request-level auth and ownership validation before controller execution |

---

## 8. OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|---------------|-----------|
| **A01 Broken Access Control** | RolesGuard + OwnershipGuard enforce role and resource ownership |
| **A02 Cryptographic Failures** | bcrypt for passwords, HMAC-SHA256 for webhooks, JWT for sessions |
| **A03 Injection** | Prisma parameterized queries (no raw SQL) |
| **A04 Insecure Design** | Clean Architecture separates concerns; guards run before controllers |
| **A05 Security Misconfiguration** | Secrets from env vars, structured error responses (no stack traces in production) |
| **A06 Vulnerable Components** | npm audit for dependency scanning |
| **A07 Auth Failures** | OTP verification, bcrypt, JWT expiration, constant-time comparison |
| **A08 Data Integrity** | Webhook signature validation, audit logging |
| **A09 Logging Failures** | Audit log captures all admin actions with IP, timestamp, details |
| **A10 SSRF** | No user-controlled URL fetching; OpenAI calls use hardcoded endpoint |

---

## 9. Future Security Enhancements

| Enhancement | Status | Priority |
|-------------|--------|----------|
| Enable CORS with whitelist | Pending | High |
| Global `ValidationPipe` for DTO validation | Pending | High |
| Rate limiting (`@nestjs/throttler`) | Pending | Medium |
| Helmet security headers | Pending | Medium |
| Refresh token rotation | Pending | Medium |
| Failed login attempt lockout | Pending | Low |
| CSP headers | Pending | Low |

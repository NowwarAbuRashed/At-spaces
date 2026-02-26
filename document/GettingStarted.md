# AtSpaces — Getting Started

## 1. Project Overview

AtSpaces is a full-stack coworking space booking platform built with NestJS (backend) and Next.js (frontend) in a Turborepo monorepo. It supports three user roles: **Customer** (book workspaces), **Vendor** (manage branches and services), and **Admin** (oversee approvals and platform analytics).

## 2. Prerequisites

Ensure the following are installed on your system before proceeding:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x or later | JavaScript runtime |
| **npm** | 9.x or later | Package manager (comes with Node.js) |
| **PostgreSQL** | 15.x or later | Relational database |
| **Git** | 2.x or later | Version control |

Optional but recommended:

| Tool | Purpose |
|------|---------|
| **pgAdmin** or **DBeaver** | Visual database management |
| **Postman** or **Insomnia** | API testing client |

## 3. Installation Steps

### 3.1 Clone the Repository

```bash
git clone https://github.com/NowwarAbuRashed/At-spaces.git
cd At-spaces
```

### 3.2 Install Dependencies

From the project root (monorepo root):

```bash
npm install
```

This installs dependencies for all workspaces, including `apps/api`.

### 3.3 Set Up PostgreSQL

Create a new database:

```sql
CREATE DATABASE atspaces;
```

Ensure a PostgreSQL user with access to this database is available (default: `postgres` with password `password`).

## 4. Environment Variables

Create a `.env` file in `apps/api/`:

```bash
cp apps/api/.env.example apps/api/.env
```

If no `.env.example` exists, create `apps/api/.env` with the following:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/atspaces"

# JWT Authentication
JWT_SECRET="your-secure-jwt-secret-here"

# OpenAI (for AI recommendations)
OPENAI_API_KEY="sk-your-openai-api-key"

# SMTP (for email notifications)
SMTP_EMAIL="your-email@gmail.com"
SMTP_APP_PASSWORD="your-app-password"

# Webhook Signing Secrets (use test values for development)
APPLE_PAY_MERCHANT_ID="merchant.com.atspaces"
APPLE_PAY_CERTIFICATE=""
VISA_WEBHOOK_SECRET="visa-test-webhook-secret"
MASTERCARD_WEBHOOK_SECRET="mc-test-webhook-secret"
```

> **Important**: Never commit `.env` to version control. It is already in `.gitignore`.

## 5. Database Setup

### 5.1 Push Schema to Database

```bash
cd apps/api
npx prisma db push
```

This creates all tables, enums, and indexes defined in `prisma/schema.prisma`.

### 5.2 Generate Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript client used by the application.

### 5.3 Seed the Database (Optional)

If a seed script exists:

```bash
npx prisma db seed
```

Otherwise, the test script (`test-all-apis.ts`) creates sample data automatically.

## 6. Running the Project Locally

### 6.1 Development Mode (Hot Reload)

```bash
cd apps/api
npm run start:dev
```

The API starts on **http://localhost:3001**. Changes to source files trigger automatic recompilation.

### 6.2 Production Build

```bash
npm run build
npm run start:prod
```

### 6.3 Swagger API Documentation

Once the server is running, open:

```
http://localhost:3001/api/docs
```

This provides interactive API documentation with request/response examples.

## 7. Running Tests

### 7.1 Unit Tests

```bash
npm run test
```

Runs all Jest unit tests across the project.

### 7.2 Specific Test Files

```bash
npx jest src/common/guards/roles.guard.spec.ts --no-coverage
```

### 7.3 End-to-End API Tests

The `test-all-apis.ts` script bootstraps the NestJS app and tests all endpoints:

```bash
cd apps/api
npx ts-node -r tsconfig-paths/register test-all-apis.ts
```

> **Note**: Stop any running dev server first — the test script starts its own instance on port 3001.

### 7.4 TypeScript Type Checking

```bash
npx tsc --noEmit
```

## 8. Project Structure

```
At-spaces/
├── apps/
│   └── api/                        # NestJS Backend
│       ├── prisma/
│       │   └── schema.prisma       # Database schema
│       ├── src/
│       │   ├── common/             # Guards, decorators, strategies
│       │   ├── domain/             # Entities, enums, interfaces
│       │   ├── application/        # Services, DTOs, use cases
│       │   ├── infrastructure/     # Repositories, external services
│       │   ├── presentation/       # Controllers
│       │   ├── app.module.ts       # Root module
│       │   └── main.ts            # Bootstrap entry point
│       ├── test-all-apis.ts       # E2E test script
│       └── package.json
├── packages/                       # Shared packages (if any)
├── turbo.json                     # Turborepo config
└── package.json                   # Root workspace config
```

## 9. Common Issues

| Issue | Solution |
|-------|----------|
| `EADDRINUSE: port 3001` | Stop any other process on port 3001 before starting the server |
| `PrismaClientInitializationError` | Ensure PostgreSQL is running and `DATABASE_URL` is correct |
| `Property 'X' does not exist on PrismaService` | Run `npx prisma generate` to regenerate the client |
| `Cannot find module` | Run `npm install` from the project root |

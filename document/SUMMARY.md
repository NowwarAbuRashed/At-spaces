# AtSpaces — Project Summary

## Overview

**AtSpaces** is a coworking space booking and management platform built for the Jordanian market. It connects customers seeking workspace with vendors operating coworking branches, all governed by an admin approval system.

The platform supports three user roles:

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse branches, check availability, book workspaces, manage bookings |
| **Vendor** | Register branches, manage services and pricing, handle bookings, request capacity changes |
| **Admin** | Approve/reject vendor requests, manage branch and vendor statuses, view analytics, audit trail |

## Key Features

- **JWT Authentication** — Secure stateless authentication with bcrypt password hashing and OTP phone verification
- **Role-Based Access Control** — Composable guard system (`RolesGuard`, `OwnershipGuard`) enforcing role and resource ownership
- **Booking Engine** — Availability checking, dynamic pricing by duration, and booking lifecycle management
- **Approval Workflow** — Vendor changes (capacity, branch status) require admin approval before taking effect
- **Webhook Payment Validation** — Signature verification for Apple Pay, Visa, and Mastercard payment events
- **AI Recommendations** — OpenAI-powered branch recommendations based on user preferences
- **Admin Audit Log** — Full activity trail of all admin actions (approvals, rejections, status changes)
- **Swagger API Docs** — Auto-generated interactive documentation at `/api/docs`

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | NestJS 10 + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM 6 |
| Authentication | Passport JWT + bcrypt |
| AI | OpenAI GPT API |
| API Documentation | Swagger / OpenAPI |
| Monorepo | Turborepo |
| Testing | Jest |

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, design patterns, module hierarchy, database schema |
| [GettingStarted.md](./GettingStarted.md) | Installation, environment setup, running locally, testing |
| [API.md](./API.md) | Complete REST API endpoint documentation with request/response examples |
| [BackendClasses.md](./BackendClasses.md) | All backend classes organized by architectural layer |
| [Security.md](./Security.md) | Authentication, authorization, webhook validation, secrets management |

## Quick Navigation

- **Setting up the project?** → [GettingStarted.md](./GettingStarted.md)
- **Understanding the codebase?** → [ARCHITECTURE.md](./ARCHITECTURE.md) → [BackendClasses.md](./BackendClasses.md)
- **Integrating the API?** → [API.md](./API.md)
- **Reviewing security?** → [Security.md](./Security.md)
- **Swagger UI** → `http://localhost:3001/api/docs` (when server is running)

# At Spaces - Database Documentation

This document provides a comprehensive overview of the "At Spaces" database architecture, including schema details, relationships, and instructions on how to run and manage the database using Docker and Prisma.

## 1. Database Architecture Overview

The "At Spaces" platform uses **PostgreSQL** as its primary relational database. The schema is designed to handle multiple vendors, each having multiple branches, offering various coworking services (hot desks, private offices, meeting rooms) with real-time availability and booking management.

### Entity Relationship Diagram (Conceptual)

```mermaid
erDiagram
    USER ||--o{ BRANCH : "owns (as vendor)"
    USER ||--o{ BOOKING : "makes (as customer)"
    USER ||--o{ APPROVAL_REQUEST : "submits/reviews"
    BRANCH ||--o{ VENDOR_SERVICE : "offers"
    BRANCH ||--o{ BRANCH_FACILITY : "has"
    SERVICE ||--o{ VENDOR_SERVICE : "type of"
    VENDOR_SERVICE ||--o{ AVAILABILITY : "has slots"
    VENDOR_SERVICE ||--o{ BOOKING : "is booked"
    VENDOR_SERVICE ||--o{ SERVICE_FEATURE : "includes"
    BOOKING ||--o{ PAYMENT : "has"
```

## 2. Table Definitions

### 2.1 Core Tables
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `users` | All system users (Customers, Vendors, Admins) | `id`, `email`, `role`, `status` |
| `branches` | Physical locations owned by vendors | `id`, `vendor_id`, `city`, `address` |
| `services` | Static types of services (e.g., Hot Desk) | `id`, `name`, `unit` |
| `vendor_services` | Specific service offerings per branch | `id`, `branch_id`, `service_id`, `price` |

### 2.2 Availability & Bookings
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `availability` | Real-time units available per date/time | `id`, `vendor_service_id`, `date`, `units` |
| `bookings` | Customer reservations | `id`, `booking_number`, `status`, `total_price` |
| `payments` | Financial transactions | `id`, `booking_id`, `transaction_id`, `status` |

### 2.3 Facilities & Features
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `facilities` | Amenities at a branch (WiFi, Coffee) | `id`, `name`, `icon` |
| `features` | Specific features for a service (Whiteboard) | `id`, `name`, `icon` |

---

## 3. How to Run

### 3.1 Prerequisites
- **Docker & Docker Compose** installed.
- **Node.js** (v18+) installed.

### 3.2 Running the Database with Docker
The database runs in a containerized PostgreSQL environment.

1.  **Start the containers**:
    Navigate to the root directory and run:
    ```bash
    docker compose up -d
    ```
    This starts:
    - **PostgreSQL**: On port `5432`
    - **Redis**: On port `6379` (used for caching/sessions)

2.  **Verify Status**:
    ```bash
    docker compose ps
    ```

### 3.3 Managing with Prisma
All commands should be run from the `apps/api` directory.

1.  **Environment Setup**:
    Ensure your `apps/api/.env` has the correct connection string:
    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/atspaces?schema=public"
    ```

2.  **Initialize/Update Schema**:
    To apply the current schema to your Docker database:
    ```bash
    npx prisma migrate dev --name init_full_schema
    ```

3.  **Seed the Database**:
    To populate the database with initial Jordanian vendors and test data:
    ```bash
    npx prisma db seed
    ```

4.  **Open Prisma Studio**:
    To view and edit your data in a beautiful UI:
    ```bash
    npx prisma studio
    ```

## 4. Maintenance Commands

- **Reset Database**: `npx prisma migrate reset` (Warning: deletes all data).
- **Generate Client**: `npx prisma generate` (Updates TypeScript types after schema changes).
- **Logs**: `docker compose logs -f postgres` to see database errors.

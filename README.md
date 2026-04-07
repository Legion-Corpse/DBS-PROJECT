# ServeMart — Local Service Marketplace

> A full-stack web application that connects customers with verified local service providers for home and personal services. Built as a Database Systems mini-project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Database Schema](#5-database-schema)
6. [PL/SQL Objects](#6-plsql-objects)
7. [Backend API](#7-backend-api)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Booking Lifecycle](#10-booking-lifecycle)
11. [Running the Project](#11-running-the-project)
12. [Seed Data / Demo Credentials](#12-seed-data--demo-credentials)

---

## 1. Project Overview

**ServeMart** is a three-role marketplace:

| Role | What they can do |
|------|-----------------|
| **Customer** | Browse providers, book services, manage bookings, pay invoices, leave reviews |
| **Provider** | Manage offered services, set weekly availability slots, manage service areas, mark jobs complete |
| **Admin** | Approve provider background checks, add service-area cities, view revenue analytics, monitor error logs |

Core business rules enforced at the database level:
- No double-booking of a provider's time slot (overlap check in `sp_create_booking`)
- Promo codes are validated, usage-capped, and date-bound; an invalid code silently falls through so the booking still proceeds
- Invoices are auto-generated when a provider marks a job complete (platform fee 10%, GST 5%)
- Cancellations automatically flip any paid payment to `REFUNDED`
- A compound trigger recalculates `rating_avg` and `jobs_completed` on `SERVICE_PROVIDERS` whenever a review is inserted, updated, or deleted

---

## 2. Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.19 | HTTP server & routing |
| `oracledb` | 6.5 | Oracle Database driver (connection pool) |
| `bcrypt` | 5.1 | Password hashing (cost factor 10) |
| `jsonwebtoken` | 9.0 | JWT generation & verification (24 h expiry) |
| `zod` | 3.23 | Runtime request-body validation schemas |
| `cors` | 2.8 | Cross-Origin Resource Sharing |
| `express-rate-limit` | 7.3 | Rate limiting — 500 req/15 min general, 20 req/15 min for auth |
| `dotenv` | 16.4 | Environment variable loading |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2 | UI library |
| `react-dom` | 19.2 | DOM rendering |
| `react-router-dom` | 7.14 | Client-side routing |
| `axios` | 1.14 | HTTP client with JWT interceptors |
| `recharts` | 3.8 | Admin revenue bar chart |
| `leaflet` + `react-leaflet` | 1.9 / 5.0 | Interactive map on landing page |
| `react-icons` | 5.6 | Icon library |
| `vite` | 8.0 | Build tool & dev server |

### Database
- **Oracle Database** (XE or full edition)
- PL/SQL stored procedures, a function, a compound trigger, and a view

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                │
│  Axios (auto-attaches Bearer token) → REST API calls     │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌──────────────────────────────────────────────────────────┐
│              Node.js / Express  (port 3000)              │
│                                                          │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │ /auth    │  │/providers│  │/bookings │  │/invoices │  │
│  └──────────┘  └─────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐                              │
│  │ /admin   │  │ /reviews │                              │
│  └──────────┘  └──────────┘                              │
│                                                          │
│  Middleware: JWT check · Zod validation · Rate limiter   │
│  Utility:   ORA-code → human-readable error mapper       │
└───────────────────────────┬──────────────────────────────┘
                            │ oracledb connection pool
                            ▼
┌──────────────────────────────────────────────────────────┐
│                   Oracle Database                        │
│  16 Tables · 1 View · 3 Procedures · 1 Function          │
│  1 Compound Trigger · Seed data                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
DBS PROJECT/
├── init.sql                    # Complete DB initialisation (schema + PL/SQL + seed data)
├── backend/
│   ├── server.js               # Express app entry point; sets up middleware & routes
│   ├── db.js                   # Oracle connection pool (poolMin 2 / poolMax 10)
│   ├── .env                    # DB credentials + JWT_SECRET (not committed)
│   ├── middleware/
│   │   ├── auth.js             # requireAuth — validates Bearer JWT, attaches req.user
│   │   └── validate.js         # Generic Zod schema validation middleware
│   ├── routes/
│   │   ├── auth.js             # POST /register, POST /login
│   │   ├── providers.js        # Provider CRUD + public browse/recommend endpoints
│   │   ├── bookings.js         # Create / list / complete / cancel bookings
│   │   ├── invoices.js         # Fetch invoice + trigger payment
│   │   ├── reviews.js          # POST review for a completed booking
│   │   └── admin.js            # Revenue stats, error logs, provider approval
│   └── utils/
│       └── errorMapper.js      # Translates ORA-XXXXX codes to user-friendly messages
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx            # App mount, BrowserRouter, AuthProvider wrapper
        ├── App.jsx             # Route definitions (public / customer / provider / admin)
        ├── context/
        │   └── AuthContext.jsx # JWT stored in localStorage; decodes role & expiry
        ├── api/
        │   ├── axios.js        # Axios instance with auth interceptor + 401 redirect
        │   ├── auth.js         # login(), register() calls
        │   ├── bookings.js     # createBooking(), getMyBookings(), etc.
        │   ├── providers.js    # getProviders(), getProviderById(), recommend(), etc.
        │   ├── invoices.js     # getInvoice(), payInvoice()
        │   └── admin.js        # getRevenue(), getErrorLogs(), approveProvider()
        ├── components/
        │   ├── Navbar.jsx          # Role-aware navigation bar
        │   ├── ProtectedRoute.jsx  # Redirect to /login if unauthenticated or wrong role
        │   ├── BookingCard.jsx     # Booking summary card with status badge
        │   ├── ProviderCard.jsx    # Provider listing card
        │   ├── InvoiceModal.jsx    # Overlay showing full invoice breakdown
        │   ├── CategoryGrid.jsx    # Service category icon grid on landing
        │   ├── MapView.jsx         # Leaflet map (landing page)
        │   ├── StarRating.jsx      # Interactive 1-5 star rater
        │   ├── ErrorModal.jsx      # Standardised error display overlay
        │   └── LoadingSpinner.jsx  # Centred spinner
        └── pages/
            ├── Landing.jsx         # Public hero page with category grid + Leaflet map
            ├── Login.jsx           # Username + password form
            ├── Register.jsx        # Role-specific registration (CUSTOMER or PROVIDER)
            ├── customer/
            │   ├── Dashboard.jsx   # Recent bookings, recommended providers for location
            │   ├── Browse.jsx      # Search/filter provider listing
            │   ├── BookingForm.jsx # Multi-step: pick service → slot → address → promo
            │   ├── MyBookings.jsx  # Full booking history with status + invoice view
            │   └── ReviewForm.jsx  # 1-5 star + text review for a completed booking
            ├── provider/
            │   ├── Dashboard.jsx   # Pending/upcoming jobs, earnings summary
            │   ├── ManageSlots.jsx # Add / delete weekly availability time slots
            │   ├── ManageServices.jsx # Add / delete offered services & hourly rates
            │   ├── ManageAreas.jsx # Add / remove service cities
            │   └── JobComplete.jsx # Mark a booking complete, choose payment method
            └── admin/
                ├── Dashboard.jsx   # Revenue breakdown bar chart by category (Recharts)
                ├── Providers.jsx   # List all providers; one-click background-check approval
                └── ErrorLogs.jsx   # Table of all PL/SQL error log entries
```

---

## 5. Database Schema

The schema contains **16 tables** created in foreign-key dependency order.

### Table Reference

#### `ERROR_LOGS`
Central error table. Every PL/SQL procedure uses `EXCEPTION WHEN OTHERS` to insert here before re-raising.

| Column | Type | Notes |
|--------|------|-------|
| `log_id` | NUMBER (identity PK) | Auto-generated |
| `severity` | VARCHAR2(10) | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `procedure_name` | VARCHAR2(100) | Which PL/SQL object raised the error |
| `error_message` | VARCHAR2(2000) | `SQLERRM` text |
| `logged_at` | TIMESTAMP | Defaults to `CURRENT_TIMESTAMP` |

---

#### `USERS`
Single authentication table for all roles.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | NUMBER (identity PK) | |
| `username` | VARCHAR2(50) UNIQUE | |
| `password_hash` | VARCHAR2(256) | bcrypt hash |
| `email` | VARCHAR2(100) UNIQUE | |
| `user_role` | VARCHAR2(20) | `CUSTOMER` / `PROVIDER` / `ADMIN` |
| `is_active` | NUMBER(1,0) | 0 = deactivated, 1 = active (default) |
| `last_login` | TIMESTAMP | Updated on each successful login |
| `created_at` | TIMESTAMP | Defaults to `CURRENT_TIMESTAMP` |

---

#### `CUSTOMERS`
Profile extension for users with role `CUSTOMER`.

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | NUMBER (identity PK) | |
| `user_id` | NUMBER UNIQUE | FK → `USERS` (cascade delete) |
| `first_name` | VARCHAR2(50) | |
| `last_name` | VARCHAR2(50) | |
| `phone` | VARCHAR2(20) | Optional |

---

#### `CUSTOMER_ADDRESSES`
A customer can save multiple addresses (home, office, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `address_id` | NUMBER (identity PK) | |
| `customer_id` | NUMBER | FK → `CUSTOMERS` (cascade delete) |
| `location_label` | VARCHAR2(50) | Defaults to `'HOME'` |
| `house_no` | VARCHAR2(50) | |
| `building_name` | VARCHAR2(150) | Optional |
| `area_landmark` | VARCHAR2(255) | |
| `city` | VARCHAR2(100) | |
| `postal_code` | NUMBER(10) | |

---

#### `SERVICE_PROVIDERS`
Profile extension for users with role `PROVIDER`. Stats (`rating_avg`, `jobs_completed`) are maintained automatically by the compound trigger.

| Column | Type | Notes |
|--------|------|-------|
| `provider_id` | NUMBER (identity PK) | |
| `user_id` | NUMBER UNIQUE | FK → `USERS` (cascade delete) |
| `first_name` | VARCHAR2(50) | |
| `last_name` | VARCHAR2(50) | |
| `phone` | VARCHAR2(20) | |
| `experience_yrs` | NUMBER | Defaults 0 |
| `background_chk` | VARCHAR2(20) | `PENDING` / `APPROVED` / `REJECTED` |
| `rating_avg` | NUMBER(3,2) | Auto-updated by trigger |
| `jobs_completed` | NUMBER | Auto-updated by trigger |

---

#### `SERVICE_AREAS`
Master list of cities the platform operates in.

| Column | Type | Notes |
|--------|------|-------|
| `area_id` | NUMBER (identity PK) | |
| `city_name` | VARCHAR2(100) | |
| `region_code` | VARCHAR2(50) | State/UT abbreviation (e.g. `MH`, `KA`) |
| *(unique)* | | `(city_name, region_code)` |

---

#### `PROVIDER_AREAS`
Many-to-many: which cities a provider serves.

| Column | Type | Notes |
|--------|------|-------|
| `provider_area_id` | NUMBER (identity PK) | |
| `provider_id` | NUMBER | FK → `SERVICE_PROVIDERS` |
| `area_id` | NUMBER | FK → `SERVICE_AREAS` |
| *(unique)* | | `(provider_id, area_id)` — prevents duplicates |

---

#### `PROVIDER_AVAILABILITY`
Weekly recurring time slots (stored with a sentinel date `2000-01-01`; only the HH24:MI portion matters at runtime).

| Column | Type | Notes |
|--------|------|-------|
| `availability_id` | NUMBER (identity PK) | |
| `provider_id` | NUMBER | FK → `SERVICE_PROVIDERS` |
| `day_of_week` | VARCHAR2(15) | `MONDAY` … `SUNDAY` |
| `slot_start` | DATE | Time stored on `2000-01-01 HH24:MI` |
| `slot_end` | DATE | Must be > `slot_start` |
| `is_available` | NUMBER(1,0) | 1 = open, 0 = blocked by a booking |

---

#### `SERVICE_CATEGORIES`
Lookup table for service types (seeded: `PLUMBING`, `ELECTRICAL`, `CLEANING`, `PAINTING`, `CARPENTRY`, `APPLIANCE REPAIR`).

| Column | Type | Notes |
|--------|------|-------|
| `category_id` | NUMBER (identity PK) | |
| `category_name` | VARCHAR2(100) UNIQUE | |

---

#### `SERVICES_OFFERED`
Each row is one service a provider offers with a specific hourly rate.

| Column | Type | Notes |
|--------|------|-------|
| `service_id` | NUMBER (identity PK) | |
| `provider_id` | NUMBER | FK → `SERVICE_PROVIDERS` |
| `category_id` | NUMBER | FK → `SERVICE_CATEGORIES` |
| `service_name` | VARCHAR2(100) | e.g. "Pipe Leak Fix" |
| `hourly_rate` | NUMBER(10,2) | Must be ≥ 0 |
| `is_active` | NUMBER(1,0) | 1 = listed, 0 = hidden |

---

#### `PROMOTIONS`
Discount codes with usage caps and validity windows.

| Column | Type | Notes |
|--------|------|-------|
| `promo_id` | NUMBER (identity PK) | |
| `promo_code` | VARCHAR2(20) UNIQUE | Case-insensitive match at runtime |
| `discount_percentage` | NUMBER(3,0) | 1–100 |
| `max_discount_amt` | NUMBER(10,2) | Cap on the discount ₹ amount |
| `min_order_amt` | NUMBER(10,2) | Order must meet this minimum |
| `valid_from` | TIMESTAMP | Defaults to now |
| `valid_until` | TIMESTAMP | Must be > `valid_from` |
| `max_uses` | NUMBER | Total redemptions allowed |
| `current_uses` | NUMBER | Incremented in `sp_create_booking` |
| `is_active` | NUMBER(1,0) | Toggle |

---

#### `BOOKINGS`
The central transaction table.

| Column | Type | Notes |
|--------|------|-------|
| `booking_id` | NUMBER (identity PK) | |
| `customer_id` | NUMBER | FK → `CUSTOMERS` |
| `service_id` | NUMBER | FK → `SERVICES_OFFERED` |
| `address_id` | NUMBER | FK → `CUSTOMER_ADDRESSES` |
| `availability_id` | NUMBER | FK → `PROVIDER_AVAILABILITY` |
| `promo_id` | NUMBER (nullable) | FK → `PROMOTIONS` (set null on delete) |
| `scheduled_date` | TIMESTAMP | Exact start date-time |
| `duration_hours` | NUMBER(4,1) | Length in hours |
| `status` | VARCHAR2(20) | `PENDING` / `CONFIRMED` / `IN_PROGRESS` / `COMPLETED` / `CANCELLED` |
| `created_at` | TIMESTAMP | |

---

#### `INVOICES`
One invoice per booking, generated by `sp_generate_invoice`.

| Column | Type | Notes |
|--------|------|-------|
| `invoice_id` | NUMBER (identity PK) | |
| `booking_id` | NUMBER UNIQUE | FK → `BOOKINGS` (1-to-1) |
| `base_amount` | NUMBER(10,2) | `hourly_rate × duration_hours` |
| `discount_amount` | NUMBER(10,2) | Promo discount (capped at `max_discount_amt`) |
| `platform_fee` | NUMBER(10,2) | 10% of post-discount amount |
| `tax_amount` | NUMBER(10,2) | 5% GST of post-discount amount |
| `net_total` | NUMBER(10,2) | `(base − discount) + fee + tax` |
| `generated_at` | TIMESTAMP | |

---

#### `PAYMENTS`
One payment record per invoice.

| Column | Type | Notes |
|--------|------|-------|
| `payment_id` | NUMBER (identity PK) | |
| `invoice_id` | NUMBER UNIQUE | FK → `INVOICES` |
| `amount_paid` | NUMBER(10,2) | |
| `payment_method` | VARCHAR2(50) | `CASH` / `CREDIT_CARD` / `UPI` / `STRIPE` |
| `payment_status` | VARCHAR2(20) | `PENDING` / `SUCCESS` / `COMPLETED` / `FAILED` / `REFUNDED` |
| `transaction_id` | VARCHAR2(100) | Auto-generated as `TXN_<timestamp>` |
| `paid_at` | TIMESTAMP | |

---

#### `REVIEWS`
One review per completed booking (enforced by UNIQUE on `booking_id`).

| Column | Type | Notes |
|--------|------|-------|
| `review_id` | NUMBER (identity PK) | |
| `booking_id` | NUMBER UNIQUE | FK → `BOOKINGS` |
| `rating` | NUMBER(1,0) | 1–5 |
| `comments` | VARCHAR2(1000) | |
| `created_at` | TIMESTAMP | |

Writing a review fires the `trg_update_provider_rating` trigger.

---

#### `CANCELLATIONS`
Audit table; one row per cancelled booking.

| Column | Type | Notes |
|--------|------|-------|
| `cancellation_id` | NUMBER (identity PK) | |
| `booking_id` | NUMBER UNIQUE | FK → `BOOKINGS` |
| `cancelled_by` | VARCHAR2(10) | `CUSTOMER` / `PROVIDER` / `SYSTEM` |
| `reason` | VARCHAR2(500) | Free text |
| `cancelled_at` | TIMESTAMP | |

---

## 6. PL/SQL Objects

### View — `VW_PROVIDER_SUMMARY`
Used by the provider detail endpoint. Joins `SERVICE_PROVIDERS` ↔ `USERS`, selects the one active category name per provider using a correlated subquery, and filters out deactivated accounts.

---

### Procedure — `SP_CREATE_BOOKING`

**Parameters:** `p_cust_id`, `p_srvc_id`, `p_addr_id`, `p_avail_id`, `p_promo_code`, `p_date`, `p_dur`

**Logic steps:**
1. Resolve `provider_id` from `SERVICES_OFFERED`
2. Fetch the availability slot's absolute time range for the requested date (`TRUNC(p_date) + HH24:MI fraction`)
3. Reject if `p_date` falls outside the window → `ORA-20011`
4. Count overlapping active bookings for that provider → reject if > 0 → `ORA-20010`
5. Validate promo code (active, not expired, not over max uses); silently ignore if invalid so the booking proceeds; increment `current_uses` on success
6. `INSERT` into `BOOKINGS` with status `CONFIRMED`
7. Any exception → `ROLLBACK`, log to `ERROR_LOGS`, then `RAISE`

---

### Procedure — `SP_GENERATE_INVOICE`

**Parameter:** `p_booking_id`

**Logic steps:**
1. Fetch `hourly_rate` and `duration_hours`; compute `base_amount`
2. Loop over the booking's promo (if any) and compute `discount_amount = MIN(base × pct/100, max_discount_amt)`
3. `platform_fee = ROUND((base − discount) × 0.10, 2)`
4. `tax_amount  = ROUND((base − discount) × 0.05, 2)`
5. `net_total   = ROUND((base − discount) + fee + tax, 2)`
6. `INSERT` into `INVOICES`

Called automatically by the *complete booking* endpoint immediately after the status is set to `COMPLETED`.

---

### Procedure — `SP_CANCEL_BOOKING`

**Parameters:** `p_booking_id`, `p_cancelled_by`, `p_reason`

**Logic steps:**
1. Fetch current status; reject if `COMPLETED` → `ORA-20020` or already `CANCELLED` → `ORA-20021`
2. Update status → `CANCELLED`
3. Re-open the availability slot (`is_available = 1`)
4. Insert into `CANCELLATIONS`
5. If a `SUCCESS`/`COMPLETED` payment exists, set it to `REFUNDED`

---

### Function — `FN_RECOMMEND_PROVIDERS`

**Parameter:** `p_area_id`  
**Returns:** `SYS_REFCURSOR`

Ranks providers in a given city using a composite score:
```
score = (rating_avg × 0.5) + (LEAST(jobs_completed, 100) / 100 × 0.3) + 0.2
```
- The 0.2 baseline ensures brand-new providers still appear in results
- Capping `jobs_completed` at 100 prevents highly experienced providers from monopolising rankings
- Only `APPROVED` providers with active accounts are returned

---

### Trigger — `TRG_UPDATE_PROVIDER_RATING`

**Type:** `COMPOUND TRIGGER FOR INSERT OR UPDATE OR DELETE ON REVIEWS`

- **AFTER EACH ROW**: collects the affected `provider_id` into an associative array (`INDEX BY PLS_INTEGER`)
- **AFTER STATEMENT**: iterates the array, and for each provider updates `SERVICE_PROVIDERS` with:
  - `rating_avg` ← `AVG(rating)` across all reviews joined to that provider's bookings
  - `jobs_completed` ← `COUNT(DISTINCT booking_id WHERE status = 'COMPLETED')`

Using a compound trigger avoids the "mutating table" error that a row-level trigger would cause.

---

## 7. Backend API

Base URL: `http://localhost:3000/api`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Creates `USERS` + `CUSTOMERS` or `SERVICE_PROVIDERS` row atomically |
| POST | `/login` | Public | Verifies bcrypt hash; returns 24 h JWT; updates `last_login` |

Zod schemas enforce minimum lengths and valid email format before the DB is touched.

---

### Providers — `/api/providers`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all active providers with cities (LISTAGG) sorted by rating |
| GET | `/categories` | Public | All service categories |
| GET | `/areas` | Public | All service areas (cities) |
| GET | `/recommend/:area_id` | Public | Calls `FN_RECOMMEND_PROVIDERS` via `SYS_REFCURSOR` |
| GET | `/:id` | Public | Provider detail + availability + areas + services (uses `VW_PROVIDER_SUMMARY`) |
| GET | `/my/areas` | Provider | Provider's own service areas |
| POST | `/my/areas` | Provider | Add a service area |
| DELETE | `/my/areas/:areaId` | Provider | Remove a service area |
| GET | `/my/slots` | Provider | Own availability slots |
| POST | `/my/slots` | Provider | Add a weekly slot |
| DELETE | `/my/slots/:slotId` | Provider | Delete a slot |
| GET | `/my/services` | Provider | Own offered services |
| POST | `/my/services` | Provider | Add a service |
| DELETE | `/my/services/:serviceId` | Provider | Delete a service |

---

### Bookings — `/api/bookings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create` | Customer | Calls `SP_CREATE_BOOKING`; auto-creates address if none given |
| GET | `/my` | Customer / Provider | Booking history (role-filtered) |
| GET | `/booked-slots/:providerId` | Public | Returns occupied time ranges for calendar blocking |
| GET | `/validate-promo` | Auth | Preview promo discount before booking |
| GET | `/my-city` | Customer | Auto-detects last-used city for recommendations |
| POST | `/complete/:id` | Provider | Sets `COMPLETED`, calls `SP_GENERATE_INVOICE`, creates payment |
| POST | `/cancel/:id` | Customer / Provider | Calls `SP_CANCEL_BOOKING` with ownership check |

---

### Invoices — `/api/invoices`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:booking_id` | Customer / Provider / Admin | Invoice + payment detail; ownership verified |
| POST | `/:booking_id/pay` | Auth | Upserts payment record to `SUCCESS` |

---

### Reviews — `/api/reviews`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:booking_id` | Customer | Inserts review (1–5 stars + comment); must be `COMPLETED` booking owned by caller |

---

### Admin — `/api/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/revenue` | Admin | Revenue grouped by category (fees, gross) for completed bookings |
| GET | `/error-logs` | Admin | All `ERROR_LOGS` rows, newest first |
| GET | `/providers` | Admin | All providers with background-check status |
| POST | `/providers/:id/approve` | Admin | Sets `background_chk = 'APPROVED'` |
| POST | `/areas` | Admin | Adds a new city to `SERVICE_AREAS` |

---

## 8. Frontend Pages & Components

### Public Pages

| Page | Path | Description |
|------|------|-------------|
| `Landing` | `/` | Hero section, animated category grid, Leaflet map showing service cities, CTA buttons |
| `Login` | `/login` | Username + password login form |
| `Register` | `/register/customer` `/register/provider` | Role-specific registration; shared component driven by `type` prop |

### Customer Pages

| Page | Path | Description |
|------|------|-------------|
| `Dashboard` | `/customer/dashboard` | Greeting, quick stats, recommended providers auto-detected by last booking city |
| `Browse` | `/customer/browse` | Provider cards with search/filter; links to booking |
| `BookingForm` | `/customer/book/:providerId` | Loads provider services, availability slots, and booked-slots from API; promo code validation; new-address form; submits to `SP_CREATE_BOOKING` |
| `MyBookings` | `/customer/bookings` | Full history with status badges, invoice modal, cancel button, review link for completed jobs |
| `ReviewForm` | `/customer/review/:bookingId` | Interactive star rater + text comment; one review per booking enforced by DB UNIQUE constraint |

### Provider Pages

| Page | Path | Description |
|------|------|-------------|
| `Dashboard` | `/provider/dashboard` | Upcoming + pending jobs, monthly earnings summary |
| `ManageSlots` | `/provider/slots` | Weekly slot grid; add/delete availability windows |
| `ManageServices` | `/provider/services` | List services; add new (category + name + hourly rate); delete |
| `ManageAreas` | `/provider/areas` | Add/remove cities the provider covers |
| `JobComplete` | `/provider/complete/:bookingId` | Confirm job done, select payment method; triggers invoice generation |

### Admin Pages

| Page | Path | Description |
|------|------|-------------|
| `Dashboard` | `/admin/dashboard` | Recharts bar chart of platform revenue and booking counts by service category |
| `Providers` | `/admin/providers` | Full provider list with background-check status; one-click approval |
| `ErrorLogs` | `/admin/errors` | Timestamped table of all PL/SQL errors with severity colour coding |

### Shared Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Role-aware navigation; links change based on `user_role`; logout clears token |
| `ProtectedRoute` | Wraps role-restricted routes; redirects to `/login` if unauthenticated or wrong role |
| `BookingCard` | Displays booking summary with status badge, time, location, invoice trigger |
| `ProviderCard` | Provider avatar (initials), rating stars, category, city tags |
| `InvoiceModal` | Full invoice breakdown overlay: base → discount → platform fee → GST → net total |
| `CategoryGrid` | Icon + label grid for service categories on the landing page |
| `MapView` | Leaflet map centred on India showing service-area markers |
| `StarRating` | Clickable 1–5 star widget |
| `ErrorModal` | Standardised overlay for API error messages |
| `LoadingSpinner` | Centred animated spinner |

---

## 9. Authentication & Authorization

**JWT flow:**
1. On login, the server signs `{ user_id, username, user_role }` with `JWT_SECRET` (24 h expiry)
2. The token is stored in `localStorage` under the key `marketplace_token`
3. The Axios instance attaches `Authorization: Bearer <token>` to every request via a request interceptor
4. A response interceptor clears the token and redirects to `/login` on any `401`
5. `AuthContext` decodes the JWT payload client-side (no extra API call) to get role and expiry; stale tokens are purged on app load
6. `ProtectedRoute` checks `user_role` against `allowedRoles`; wrong-role access redirects to home
7. Server-side: `requireAuth` middleware verifies the signature with `jwt.verify`; all protected routes double-check resource ownership (e.g., a customer cannot cancel another customer's booking)

**Password security:** bcrypt with cost factor 10 (`$2b$10$...`).

**Rate limiting:**
- General API: 500 requests / 15 min per IP
- Auth endpoints (`/login`, `/register`): 20 requests / 15 min per IP (brute-force protection)

---

## 10. Booking Lifecycle

```
Customer selects service + slot + address + (optional promo)
              │
              ▼
    POST /api/bookings/create
              │
              ▼
    SP_CREATE_BOOKING (PL/SQL)
    ├── Validates time within provider slot
    ├── Checks no overlapping active booking
    ├── Validates + increments promo use
    └── INSERTs BOOKING with status = CONFIRMED
              │
              ▼
    Provider sees job on Dashboard
              │
              ▼ (provider marks complete)
    POST /api/bookings/complete/:id
    ├── UPDATE BOOKINGS status = COMPLETED
    ├── SP_GENERATE_INVOICE (10% fee + 5% GST)
    └── Auto-creates PAYMENT record (SUCCESS)
              │
              ├──── Customer views invoice via InvoiceModal
              │
              └──── Customer leaves review (1-5 stars)
                         │
                         ▼
              TRG_UPDATE_PROVIDER_RATING fires
              └── Recalculates rating_avg + jobs_completed
                  on SERVICE_PROVIDERS
```

**Cancellation path:**
```
POST /api/bookings/cancel/:id
    │
    ▼
SP_CANCEL_BOOKING
├── Guard: cannot cancel COMPLETED or already CANCELLED
├── UPDATE BOOKINGS status = CANCELLED
├── Reopens availability slot (is_available = 1)
├── INSERTs CANCELLATIONS audit row
└── If payment was SUCCESS/COMPLETED → REFUNDED
```

---

## 11. Running the Project

### Prerequisites
- Oracle Database (XE is fine) running locally
- Node.js ≥ 18
- Oracle Instant Client (required by `oracledb` v6 in thick mode)

### 1 — Initialize the Database

Connect to Oracle as your schema user and run:
```sql
@init.sql
```
This drops and recreates all tables, views, PL/SQL objects, and inserts seed data in one shot.

### 2 — Configure the Backend

Create `backend/.env`:
```env
DB_USER=your_oracle_username
DB_PASS=your_oracle_password
DB_HOST=localhost
DB_PORT=1521
DB_SID=XE
JWT_SECRET=your_super_secret_key
PORT=3000
```

### 3 — Start the Backend
```bash
cd backend
npm install
npm run dev      # uses nodemon; or: node server.js
```
Server starts at `http://localhost:3000`.

### 4 — Start the Frontend
```bash
cd frontend
npm install
npm run dev      # Vite dev server
```
App available at `http://localhost:5173` (or Vite's chosen port).

---

## 12. Seed Data / Demo Credentials

All seed accounts use password: **`pass123`**

| Username | Role | Profile |
|----------|------|---------|
| `john_cust` | CUSTOMER | John Doe, Mumbai |
| `sara_cust` | CUSTOMER | Sara Mehta, Bangalore |
| `bob_pro` | PROVIDER | Bob Builder — Plumbing, Mumbai, 12 yrs exp |
| `dave_pro` | PROVIDER | Dave Spark — Electrical, Bangalore, 8 yrs exp |
| `priya_pro` | PROVIDER | Priya Verma — Cleaning, Bangalore, 5 yrs exp |
| `admin` | ADMIN | Platform administrator |

**Seeded service areas:** Mumbai (MH), Delhi (DL), Bangalore (KA), Hyderabad (TS), Manipal (KA)

**Seeded promo codes:**
- `SAVE10` — 10% off, max ₹150 discount, min order ₹200 (valid 1 year)
- `WELCOME20` — 20% off, max ₹200 discount, min order ₹300 (valid 1 year)

**Demo booking:** `john_cust` has one completed booking for "Pipe Leak Fix" (2 hrs × ₹350 = ₹700 base), with a fully generated invoice (`net_total ₹805`) and a 5-star review already persisted.

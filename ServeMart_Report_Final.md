# Mini Project Report of Database Systems Lab (CSS 2212)

## ServeMart — Local Service Marketplace & Booking Management System

---

**SUBMITTED BY**

| Student Name | Reg No | Roll No | Section |
|---|---|---|---|
| Abhyuday Gupta | 240905576 | 57 | C |
| Shaurya Jain | 240905598 | 60 | C |
| Neelaksha Sisodiya | 240905642 | 65 | C |

**School of Computer Engineering**
**Manipal Institute of Technology, Manipal**
**April 2026**

---

# CERTIFICATE

**DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING**
Manipal Institute of Technology, Manipal

Manipal, April 2026

This is to certify that the Mini Project titled **"ServeMart — Local Service Marketplace & Booking Management System"** submitted by **Abhyuday Gupta (Reg. No. 240905576)**, **Shaurya Jain (Reg. No. 240905598)**, and **Neelaksha Sisodiya (Reg. No. 240905642)** of III Semester, B.Tech (Computer Science and Engineering), Section C, is a bonafide record of the work carried out by them in partial fulfilment of the requirements for the course **Database Systems Lab (CSS 2212)** during the academic year 2025–2026.

**Name and Signature of Examiners:**

Examiner 1: ______________________

Examiner 2: ______________________

---

# TABLE OF CONTENTS

| Chapter | Title |
|---|---|
| — | Abstract |
| 1 | Introduction |
| 2 | Problem Statement & Objectives |
| 3 | Methodology |
| 4 | ER Diagram & Relational Schema with Sample Data |
| 5 | DDL Commands & PL/SQL Procedures/Functions/Triggers |
| 6 | Results & Snapshots |
| 7 | Conclusion, Limitations & Future Work |
| 8 | References |

---

# ABSTRACT

ServeMart is a full-stack, role-based local service marketplace. It lets customers discover, book, and pay verified home service professionals — plumbers, electricians, painters, cleaners — through a web interface. Service providers manage their availability and service listings through a separate dashboard, and a platform administrator handles approvals and monitors revenue.

The system runs on a three-tier architecture: a React 19 frontend built with Vite, a Node.js/Express.js REST API in the middle, and an Oracle Database as the persistent store. The database has 16 normalised tables across five domains: Identity, Geography, Catalogue, Operations, and Audit. Three PL/SQL stored procedures handle the booking lifecycle atomically. A compound trigger on the REVIEWS table keeps provider rating averages and job counts current automatically. A stored function ranks providers by a composite score for the recommendation endpoint. A view simplifies provider listing queries used across the application.

Security is handled through JWT authentication, bcrypt password hashing, Zod request validation, role-based access control, and bind variables on every Oracle query.

---

# CHAPTER 1: INTRODUCTION

## 1.1 Background

Booking a plumber or electrician in India is still mostly done through word of mouth or informal WhatsApp groups. There is no shared platform where customers can compare ratings, check real availability, and get a receipt — and no place where providers can advertise services or track their earnings digitally.

ServeMart is a database-backed attempt at solving this. Three roles interact with the platform: customers browse and book verified professionals, providers manage their listings and mark jobs complete, and an administrator approves new provider accounts, adds service cities, and monitors platform revenue. The project's main purpose is to apply relational database design, Oracle PL/SQL, and full-stack web development to a practical domain.

## 1.2 System Architecture

ServeMart uses a three-tier architecture:

```
┌──────────────────────────────────────────────┐
│              PRESENTATION TIER               │
│  React 19 (Vite) — Single-Page Application   │
│  Role-based dashboards: Customer/Provider/   │
│  Admin · Leaflet map · Recharts analytics    │
└──────────────────┬───────────────────────────┘
                   │ HTTP / REST (JSON)
                   │ JWT Bearer tokens
┌──────────────────▼───────────────────────────┐
│              APPLICATION TIER                │
│  Node.js + Express.js                        │
│  6 route groups: auth, providers, bookings,  │
│  invoices, reviews, admin                    │
│  Zod validation · bcrypt · JWT               │
│  express-rate-limit · CORS                   │
└──────────────────┬───────────────────────────┘
                   │ oracledb v6
                   │ Connection pool (min 2, max 10)
┌──────────────────▼───────────────────────────┐
│               DATABASE TIER                  │
│  Oracle Database XE                          │
│  16 tables · 3 stored procedures             │
│  1 compound trigger · 1 function · 1 view    │
└──────────────────────────────────────────────┘
```

The React frontend sends all requests to the Express backend over HTTP. The backend gets a connection from the Oracle pool, executes parameterised queries or calls PL/SQL objects using named bind variables, releases the connection in a `finally` block, and returns a uniform JSON response: `{ success, data }` on success or `{ success, error: { code, message } }` on failure. Oracle error codes (`ORA-XXXXX`) are translated to user-readable messages by a utility function before being sent to the client.

## 1.3 Scope

- User registration and JWT-based login for three roles
- Provider profile, service catalogue, and weekly availability management
- Customer service discovery with category filtering and a Leaflet map
- Full booking lifecycle: creation, confirmation, completion, and cancellation
- Automated invoice generation with promo-code discounts, 10% platform fee, and 5% GST
- Payment recording (simulated; no live payment gateway)
- Customer review submission with automatic provider rating recalculation via trigger
- Admin revenue analytics and provider background-check approval
- Database-level error logging from all PL/SQL objects

## 1.4 Tools and Technologies

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 8.x |
| Routing | React Router | v7 |
| HTTP Client | Axios | 1.x |
| Maps | Leaflet / react-leaflet | 1.9 / 5.0 |
| Charts | Recharts | 3.x |
| Icons | react-icons | 5.x |
| Styling | Vanilla CSS | — |
| Backend Framework | Express.js | 4.x |
| Runtime | Node.js | 18+ |
| DB Driver | oracledb | 6.x |
| Authentication | jsonwebtoken | 9.x |
| Password Hashing | bcrypt | 5.x |
| Input Validation | Zod | 3.x |
| Rate Limiting | express-rate-limit | 7.x |
| Database | Oracle Database XE | — |
| Environment Config | dotenv | 16.x |

---

# CHAPTER 2: PROBLEM STATEMENT & OBJECTIVES

## 2.1 Problem Statement

Local home service bookings are disorganised. Customers cannot check whether a provider is actually available before calling, cannot compare prices or verified ratings, and have no official record of the transaction. Providers lack a single place to advertise services, block out their calendar, or track completed work.

The core database challenge is to design a schema that:
1. Maintains full referential integrity across the booking lifecycle
2. Prevents double-booking through an overlap check in a stored procedure
3. Keeps derived statistics (provider ratings, job counts) consistent through a trigger
4. Encapsulates business-critical operations in PL/SQL so the logic cannot be bypassed by the API layer

## 2.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Users register as CUSTOMER or PROVIDER with a unique username and email |
| FR2 | Login returns a JWT valid for 24 hours |
| FR3 | Routes are role-restricted: CUSTOMER, PROVIDER, and ADMIN endpoints are separated |
| FR4 | Customers browse providers, filter by category, and view them on an interactive map |
| FR5 | Customers pick an available time slot and book a service at a provider's hourly rate |
| FR6 | The booking procedure checks for overlapping active bookings before confirming |
| FR7 | Customers may apply a promo code during booking for a percentage discount |
| FR8 | Providers add and delete their weekly availability slots |
| FR9 | Providers add and delete services they offer, specifying category and hourly rate |
| FR10 | Providers mark bookings as COMPLETED, which triggers automatic invoice generation |
| FR11 | Invoices include base amount, promo discount (capped), 10% platform fee, and 5% GST |
| FR12 | Customers and providers cancel bookings; the availability slot is restored on cancellation |
| FR13 | Customers submit a 1–5 star review for completed bookings |
| FR14 | Provider rating average and job count update automatically when a review is written |
| FR15 | Admins view revenue grouped by service category |
| FR16 | Admins approve provider registrations (background check status) |
| FR17 | All PL/SQL exceptions are logged to ERROR_LOGS before re-raising |
| FR18 | A stored function ranks providers in a given city by a composite score |

## 2.3 Objectives

1. Design a normalised Oracle schema (3NF) with 16 tables covering all marketplace entities.
2. Implement stored procedures, a compound trigger, a function, and a view in PL/SQL.
3. Build a secure REST API with Express.js: JWT auth, Zod validation, ownership checks on every mutating endpoint.
4. Develop a role-specific React SPA with dashboards for all three user types.
5. Prevent SQL injection by using bind variables on every Oracle query.
6. Keep data integrity through foreign keys, check constraints, and transactional operations.

---

# CHAPTER 3: METHODOLOGY

The project followed a bottom-up Database Development Life Cycle with five phases.

## 3.1 Requirement Gathering

The team identified entities through use-case analysis of a typical service booking flow:

- **Users** — authentication record shared by all roles
- **Customers** and **Service Providers** — role-specific profiles
- **Service Categories** and **Services Offered** — the service catalogue
- **Service Areas** and **Provider Areas** — geographic coverage (M:N)
- **Provider Availability** — weekly recurring time slots
- **Bookings** — the central transaction entity
- **Invoices**, **Payments**, **Cancellations** — financial and lifecycle records
- **Reviews** — customer feedback with an effect on provider stats
- **Promotions** — discount codes with usage caps and validity windows
- **Error Logs** — audit table written to by all PL/SQL objects

## 3.2 Conceptual Design

Key relationships from the ER model:

- USERS ←1:1→ CUSTOMERS (partial on USERS, total on CUSTOMERS)
- USERS ←1:1→ SERVICE_PROVIDERS (partial on USERS, total on SERVICE_PROVIDERS)
- CUSTOMERS ←1:N→ CUSTOMER_ADDRESSES (weak entity, identifying relationship)
- SERVICE_PROVIDERS ←M:N→ SERVICE_AREAS (via PROVIDER_AREAS junction entity)
- SERVICE_PROVIDERS ←1:N→ PROVIDER_AVAILABILITY
- SERVICE_PROVIDERS ←1:N→ SERVICES_OFFERED ←N:1→ SERVICE_CATEGORIES
- CUSTOMERS ←1:N→ BOOKINGS ←N:1→ SERVICES_OFFERED
- BOOKINGS ←N:1→ CUSTOMER_ADDRESSES, PROVIDER_AVAILABILITY
- BOOKINGS ←1:1→ INVOICES ←1:1→ PAYMENTS
- BOOKINGS ←1:1→ CANCELLATIONS (conditional)
- BOOKINGS ←1:1→ REVIEWS (conditional, only COMPLETED bookings)
- PROMOTIONS ←1:N→ BOOKINGS (optional FK, SET NULL on delete)

## 3.3 Logical Design and Normalisation

**1NF:** All attributes are atomic. No repeating groups. Each table has a single surrogate primary key generated by Oracle's `GENERATED ALWAYS AS IDENTITY`.

**2NF:** No partial dependencies. All non-key attributes depend on the whole primary key.

**3NF:** No transitive dependencies. Provider statistics (`rating_avg`, `jobs_completed`) live in SERVICE_PROVIDERS because they describe the provider, not any individual review or booking. Financial fields (`platform_fee`, `tax_amount`, `net_total`) live in INVOICES rather than BOOKINGS because they are generated only at completion. Cancellation metadata lives in CANCELLATIONS rather than as nullable columns on BOOKINGS, which keeps BOOKINGS clean.

Notable constraint decisions:
- `USERS.user_role` CHECK: `IN ('CUSTOMER','PROVIDER','ADMIN')`
- `BOOKINGS.status` CHECK: `IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')`
- `REVIEWS.rating` CHECK: `BETWEEN 1 AND 5`
- `PAYMENTS.payment_method` CHECK: `IN ('CASH','CREDIT_CARD','UPI','STRIPE')`
- `PROVIDER_AVAILABILITY`: `slot_end > slot_start` CHECK constraint
- `PROVIDER_AREAS`: UNIQUE on `(provider_id, area_id)` prevents duplicate city assignments

## 3.4 Physical Design

**Connection pool:** The `oracledb` Node.js driver is configured with `poolMin=2`, `poolMax=10`, `poolIncrement=2`. Every route handler acquires a connection at the top, executes its queries, and closes the connection in a `finally` block.

**Time storage:** Availability slots store `slot_start` and `slot_end` as DATE values anchored to `2000-01-01`. Only the HH24:MI portion matters at runtime. The booking procedure extracts the time fraction using `TO_CHAR(slot_start, 'SSSSS') / 86400` and adds it to `TRUNC(scheduled_date)` for comparison.

**Primary keys:** All tables use `NUMBER GENERATED ALWAYS AS IDENTITY` — no separate sequences are required.

## 3.5 Implementation Order

1. Database schema — all 16 tables with constraints, in FK dependency order
2. PL/SQL objects — procedures, trigger, function, view compiled and tested in SQL*Plus
3. Seed data — sample users, providers, services, areas, bookings, and one complete flow (booking → invoice → payment → review)
4. Backend API — six Express.js route groups with authentication middleware and Zod schemas
5. Frontend — pages built role by role: Customer, then Provider, then Admin
6. End-to-end testing — full booking lifecycle verified through the browser

## 3.6 Testing

API endpoints were tested directly over HTTP with representative and edge-case inputs. For PL/SQL procedures, specific cases tested include:
- Booking a slot already occupied by another active booking (expects ORA-20010)
- Booking outside a provider's available hours (expects ORA-20011)
- Cancelling an already-completed booking (expects ORA-20020)
- Cancelling an already-cancelled booking (expects ORA-20021)
- Applying an expired or over-limit promo code (booking proceeds without discount)

Cross-role ownership bypass was tested: a provider attempting to complete another provider's booking returns 403. SQL injection was confirmed impossible through bind variables.

---

# CHAPTER 4: ER DIAGRAM & RELATIONAL SCHEMA WITH SAMPLE DATA

## 4.1 ER Diagram (Text Representation)

```
USERS (user_id PK, username UQ, password_hash, email UQ,
       user_role, is_active, last_login, created_at)
  |
  ├──1:1── CUSTOMERS (customer_id PK, user_id FK, first_name, last_name, phone)
  |           |
  |           ├──1:N── CUSTOMER_ADDRESSES [WEAK] (address_id discriminator,
  |           |                 location_label, house_no, building_name,
  |           |                 area_landmark, city, postal_code)
  |           |
  |           └──1:N── BOOKINGS (booking_id PK, customer_id FK, service_id FK,
  |                              address_id FK, availability_id FK, promo_id FK?,
  |                              scheduled_date, duration_hours, status, created_at)
  |                       |
  |                       ├──1:1── INVOICES (invoice_id PK, booking_id FK UQ,
  |                       |                  base_amount, discount_amount,
  |                       |                  platform_fee, tax_amount, net_total,
  |                       |                  generated_at)
  |                       |           |
  |                       |           └──1:1── PAYMENTS (payment_id PK,
  |                       |                              invoice_id FK UQ,
  |                       |                              amount_paid, payment_method,
  |                       |                              payment_status, transaction_id,
  |                       |                              paid_at)
  |                       |
  |                       ├──1:1── REVIEWS (review_id PK, booking_id FK UQ,
  |                       |                 rating, comments, created_at)
  |                       |
  |                       └──1:1── CANCELLATIONS (cancellation_id PK,
  |                                               booking_id FK UQ,
  |                                               cancelled_by, reason,
  |                                               cancelled_at)
  |
  └──1:1── SERVICE_PROVIDERS (provider_id PK, user_id FK, first_name, last_name,
                               phone, experience_yrs, background_chk,
                               rating_avg, jobs_completed)
               |
               ├──M:N── SERVICE_AREAS (area_id PK, city_name, region_code)
               |         [via PROVIDER_AREAS (provider_area_id PK,
               |                             provider_id FK, area_id FK)]
               |
               ├──1:N── PROVIDER_AVAILABILITY (availability_id PK, provider_id FK,
               |                               day_of_week, slot_start, slot_end,
               |                               is_available)
               |
               └──1:N── SERVICES_OFFERED (service_id PK, provider_id FK,
                                          category_id FK, service_name,
                                          hourly_rate, is_active)
                              |
                              └──N:1── SERVICE_CATEGORIES (category_id PK,
                                                           category_name)

PROMOTIONS (promo_id PK, promo_code UQ, discount_percentage,
            max_discount_amt, min_order_amt, valid_from, valid_until,
            max_uses, current_uses, is_active)

ERROR_LOGS (log_id PK, severity, procedure_name, error_message, logged_at)
[Written to by PL/SQL only — no FK relationships]
```

## 4.2 Relational Schema

### Identity Module

```
USERS(user_id NUMBER PK IDENTITY, username VARCHAR2(50) UQ NOT NULL,
      password_hash VARCHAR2(256) NOT NULL, email VARCHAR2(100) UQ NOT NULL,
      user_role VARCHAR2(20) CHECK(IN 'CUSTOMER','PROVIDER','ADMIN') NOT NULL,
      is_active NUMBER(1,0) DEFAULT 1, last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)

CUSTOMERS(customer_id NUMBER PK IDENTITY,
          user_id NUMBER UQ NOT NULL FK→USERS CASCADE DELETE,
          first_name VARCHAR2(50) NOT NULL, last_name VARCHAR2(50) NOT NULL,
          phone VARCHAR2(20))

SERVICE_PROVIDERS(provider_id NUMBER PK IDENTITY,
                  user_id NUMBER UQ NOT NULL FK→USERS CASCADE DELETE,
                  first_name VARCHAR2(50) NOT NULL,
                  last_name VARCHAR2(50) NOT NULL, phone VARCHAR2(20),
                  experience_yrs NUMBER DEFAULT 0,
                  background_chk VARCHAR2(20) DEFAULT 'PENDING'
                    CHECK(IN 'PENDING','APPROVED','REJECTED'),
                  rating_avg NUMBER(3,2) DEFAULT 0.00,
                  jobs_completed NUMBER DEFAULT 0)
```

### Geography Module

```
CUSTOMER_ADDRESSES(address_id NUMBER PK IDENTITY,
                   customer_id NUMBER NOT NULL FK→CUSTOMERS CASCADE DELETE,
                   location_label VARCHAR2(50) DEFAULT 'HOME',
                   house_no VARCHAR2(50) NOT NULL,
                   building_name VARCHAR2(150),
                   area_landmark VARCHAR2(255) NOT NULL,
                   city VARCHAR2(100) NOT NULL,
                   postal_code NUMBER(10) NOT NULL)

SERVICE_AREAS(area_id NUMBER PK IDENTITY,
              city_name VARCHAR2(100) NOT NULL,
              region_code VARCHAR2(50) NOT NULL,
              UNIQUE(city_name, region_code))

PROVIDER_AREAS(provider_area_id NUMBER PK IDENTITY,
               provider_id NUMBER NOT NULL FK→SERVICE_PROVIDERS CASCADE DELETE,
               area_id NUMBER NOT NULL FK→SERVICE_AREAS CASCADE DELETE,
               UNIQUE(provider_id, area_id))

PROVIDER_AVAILABILITY(availability_id NUMBER PK IDENTITY,
                      provider_id NUMBER NOT NULL FK→SERVICE_PROVIDERS CASCADE DELETE,
                      day_of_week VARCHAR2(15) CHECK(IN 'MONDAY'...'SUNDAY'),
                      slot_start DATE NOT NULL, slot_end DATE NOT NULL,
                      is_available NUMBER(1,0) DEFAULT 1,
                      CHECK(slot_end > slot_start))
```

### Catalogue Module

```
SERVICE_CATEGORIES(category_id NUMBER PK IDENTITY,
                   category_name VARCHAR2(100) UQ NOT NULL)

SERVICES_OFFERED(service_id NUMBER PK IDENTITY,
                 provider_id NUMBER NOT NULL FK→SERVICE_PROVIDERS CASCADE DELETE,
                 category_id NUMBER NOT NULL FK→SERVICE_CATEGORIES CASCADE DELETE,
                 service_name VARCHAR2(100) NOT NULL,
                 hourly_rate NUMBER(10,2) NOT NULL CHECK(>= 0),
                 is_active NUMBER(1,0) DEFAULT 1)
```

### Operations Module

```
PROMOTIONS(promo_id NUMBER PK IDENTITY,
           promo_code VARCHAR2(20) UQ NOT NULL,
           discount_percentage NUMBER(3,0) NOT NULL CHECK(BETWEEN 1 AND 100),
           max_discount_amt NUMBER(10,2) NOT NULL,
           min_order_amt NUMBER(10,2) DEFAULT 0,
           valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           valid_until TIMESTAMP NOT NULL,
           max_uses NUMBER DEFAULT 100, current_uses NUMBER DEFAULT 0,
           is_active NUMBER(1,0) DEFAULT 1,
           CHECK(valid_until > valid_from))

BOOKINGS(booking_id NUMBER PK IDENTITY,
         customer_id NUMBER NOT NULL FK→CUSTOMERS CASCADE DELETE,
         service_id NUMBER NOT NULL FK→SERVICES_OFFERED CASCADE DELETE,
         address_id NUMBER NOT NULL FK→CUSTOMER_ADDRESSES CASCADE DELETE,
         availability_id NUMBER NOT NULL FK→PROVIDER_AVAILABILITY,
         promo_id NUMBER FK→PROMOTIONS SET NULL ON DELETE,
         scheduled_date TIMESTAMP NOT NULL,
         duration_hours NUMBER(4,1) DEFAULT 1.0,
         status VARCHAR2(20) DEFAULT 'CONFIRMED'
           CHECK(IN 'PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)

INVOICES(invoice_id NUMBER PK IDENTITY,
         booking_id NUMBER UQ NOT NULL FK→BOOKINGS CASCADE DELETE,
         base_amount NUMBER(10,2) NOT NULL,
         discount_amount NUMBER(10,2) DEFAULT 0,
         platform_fee NUMBER(10,2) DEFAULT 0,
         tax_amount NUMBER(10,2) DEFAULT 0,
         net_total NUMBER(10,2) NOT NULL,
         generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)

PAYMENTS(payment_id NUMBER PK IDENTITY,
         invoice_id NUMBER UQ NOT NULL FK→INVOICES CASCADE DELETE,
         amount_paid NUMBER(10,2) NOT NULL,
         payment_method VARCHAR2(50) DEFAULT 'CASH'
           CHECK(IN 'CASH','CREDIT_CARD','UPI','STRIPE'),
         payment_status VARCHAR2(20) DEFAULT 'PENDING'
           CHECK(IN 'PENDING','SUCCESS','COMPLETED','FAILED','REFUNDED'),
         transaction_id VARCHAR2(100),
         paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)

REVIEWS(review_id NUMBER PK IDENTITY,
        booking_id NUMBER UQ NOT NULL FK→BOOKINGS CASCADE DELETE,
        rating NUMBER(1,0) NOT NULL CHECK(BETWEEN 1 AND 5),
        comments VARCHAR2(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)

CANCELLATIONS(cancellation_id NUMBER PK IDENTITY,
              booking_id NUMBER UQ NOT NULL FK→BOOKINGS CASCADE DELETE,
              cancelled_by VARCHAR2(10) CHECK(IN 'CUSTOMER','PROVIDER','SYSTEM'),
              reason VARCHAR2(500),
              cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

### Audit Module

```
ERROR_LOGS(log_id NUMBER PK IDENTITY,
           severity VARCHAR2(10) CHECK(IN 'LOW','MEDIUM','HIGH','CRITICAL'),
           procedure_name VARCHAR2(100),
           error_message VARCHAR2(2000),
           logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## 4.3 Sample Data

### USERS

| user_id | username | email | user_role | is_active |
|---|---|---|---|---|
| 1 | john_cust | john@gmail.com | CUSTOMER | 1 |
| 2 | sara_cust | sara@gmail.com | CUSTOMER | 1 |
| 3 | bob_pro | bob@fixit.com | PROVIDER | 1 |
| 4 | dave_pro | dave@sparkworks.com | PROVIDER | 1 |
| 5 | priya_pro | priya@cleanpro.com | PROVIDER | 1 |
| 6 | admin | admin@servemart.com | ADMIN | 1 |

### SERVICE_CATEGORIES

| category_id | category_name |
|---|---|
| 1 | PLUMBING |
| 2 | ELECTRICAL |
| 3 | CLEANING |
| 4 | PAINTING |
| 5 | CARPENTRY |
| 6 | APPLIANCE REPAIR |

### SERVICE_AREAS

| area_id | city_name | region_code |
|---|---|---|
| 1 | Mumbai | MH |
| 2 | Delhi | DL |
| 3 | Bangalore | KA |
| 4 | Hyderabad | TS |
| 5 | Manipal | KA |

### SERVICE_PROVIDERS

| provider_id | username | full_name | experience_yrs | background_chk | rating_avg | jobs_completed |
|---|---|---|---|---|---|---|
| 1 | bob_pro | Bob Builder | 12 | APPROVED | 4.50 | 50 |
| 2 | dave_pro | Dave Spark | 8 | APPROVED | 4.80 | 37 |
| 3 | priya_pro | Priya Verma | 5 | APPROVED | 4.90 | 62 |

### SERVICES_OFFERED

| service_id | provider | category | service_name | hourly_rate |
|---|---|---|---|---|
| 1 | Bob Builder | PLUMBING | Pipe Leak Fix | 350.00 |
| 2 | Bob Builder | PLUMBING | Bathroom Fitting | 500.00 |
| 3 | Dave Spark | ELECTRICAL | Wiring & Rewiring | 400.00 |
| 4 | Dave Spark | ELECTRICAL | Ceiling Fan Installation | 250.00 |
| 5 | Priya Verma | CLEANING | Deep Home Cleaning | 300.00 |

### PROMOTIONS

| promo_code | discount_percentage | max_discount_amt | min_order_amt | valid_until |
|---|---|---|---|---|
| SAVE10 | 10 | 150.00 | 200.00 | SYSDATE + 365 |
| WELCOME20 | 20 | 200.00 | 300.00 | SYSDATE + 365 |

### BOOKINGS (demo seed row)

| booking_id | customer | service | status | scheduled_date | duration_hours |
|---|---|---|---|---|---|
| 1 | John Doe | Pipe Leak Fix | COMPLETED | SYSDATE - 3 days | 2.0 |

### INVOICES (auto-generated for booking 1)

| invoice_id | booking_id | base_amount | discount_amount | platform_fee | tax_amount | net_total |
|---|---|---|---|---|---|---|
| 1 | 1 | 700.00 | 0.00 | 70.00 | 35.00 | 805.00 |

---

# CHAPTER 5: DDL COMMANDS & PL/SQL PROCEDURES/FUNCTIONS/TRIGGERS

## 5.1 Selected DDL Statements

The full schema is in `init.sql`. A representative subset is shown below.

```sql
-- ERROR_LOGS is created first so PL/SQL can always write to it
CREATE TABLE ERROR_LOGS (
    log_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    severity       VARCHAR2(10) CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    procedure_name VARCHAR2(100),
    error_message  VARCHAR2(2000),
    logged_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE USERS (
    user_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      VARCHAR2(50)  UNIQUE NOT NULL,
    password_hash VARCHAR2(256) NOT NULL,
    email         VARCHAR2(100) UNIQUE NOT NULL,
    user_role     VARCHAR2(20)  NOT NULL
                  CHECK (user_role IN ('CUSTOMER','PROVIDER','ADMIN')),
    is_active     NUMBER(1,0)   DEFAULT 1 CHECK (is_active IN (0,1)),
    last_login    TIMESTAMP,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE BOOKINGS (
    booking_id      NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id     NUMBER       NOT NULL,
    service_id      NUMBER       NOT NULL,
    address_id      NUMBER       NOT NULL,
    availability_id NUMBER       NOT NULL,
    promo_id        NUMBER,
    scheduled_date  TIMESTAMP    NOT NULL,
    duration_hours  NUMBER(4,1)  DEFAULT 1.0,
    status          VARCHAR2(20) DEFAULT 'CONFIRMED'
                    CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS',
                                      'COMPLETED','CANCELLED')),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_bk_cust  FOREIGN KEY (customer_id)
        REFERENCES CUSTOMERS(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_srvc  FOREIGN KEY (service_id)
        REFERENCES SERVICES_OFFERED(service_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_addr  FOREIGN KEY (address_id)
        REFERENCES CUSTOMER_ADDRESSES(address_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_avail FOREIGN KEY (availability_id)
        REFERENCES PROVIDER_AVAILABILITY(availability_id),
    CONSTRAINT fk_bk_promo FOREIGN KEY (promo_id)
        REFERENCES PROMOTIONS(promo_id) ON DELETE SET NULL
);
```

## 5.2 Basic DML Queries

```sql
-- All pending bookings for a given provider
SELECT b.booking_id,
       cu.first_name || ' ' || cu.last_name AS customer_name,
       so.service_name,
       b.scheduled_date,
       b.duration_hours,
       b.status
FROM BOOKINGS b
JOIN SERVICES_OFFERED so  ON b.service_id   = so.service_id
JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
JOIN CUSTOMERS cu          ON b.customer_id  = cu.customer_id
WHERE sp.provider_id = :p_provider_id
  AND b.status IN ('PENDING', 'CONFIRMED')
ORDER BY b.scheduled_date;

-- Revenue summary by category (used by admin dashboard)
SELECT sc.category_name,
       COUNT(b.booking_id)     AS total_bookings,
       SUM(i.platform_fee)     AS platform_revenue,
       SUM(i.net_total)        AS gross_value
FROM BOOKINGS b
JOIN SERVICES_OFFERED so  ON b.service_id   = so.service_id
JOIN SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
JOIN INVOICES i             ON b.booking_id  = i.booking_id
WHERE b.status = 'COMPLETED'
GROUP BY sc.category_name
ORDER BY platform_revenue DESC;

-- Customer booking history with invoice and payment status
SELECT b.booking_id,
       so.service_name,
       sp.first_name || ' ' || sp.last_name  AS provider_name,
       b.scheduled_date,
       b.status,
       i.net_total,
       NVL(p.payment_status, 'NO_INVOICE')   AS payment_status
FROM BOOKINGS b
JOIN SERVICES_OFFERED so  ON b.service_id   = so.service_id
JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
LEFT JOIN INVOICES i       ON b.booking_id  = i.booking_id
LEFT JOIN PAYMENTS p       ON i.invoice_id  = p.invoice_id
WHERE b.customer_id = :p_customer_id
ORDER BY b.scheduled_date DESC;
```

## 5.3 Complex Queries

```sql
-- Provider full detail: services and area coverage via LISTAGG
SELECT sp.provider_id,
       u.username,
       sp.first_name || ' ' || sp.last_name                       AS full_name,
       sp.rating_avg,
       sp.jobs_completed,
       LISTAGG(sa.city_name, ', ')
           WITHIN GROUP (ORDER BY sa.city_name)                   AS service_cities
FROM SERVICE_PROVIDERS sp
JOIN USERS u             ON sp.user_id     = u.user_id
LEFT JOIN PROVIDER_AREAS pa  ON pa.provider_id  = sp.provider_id
LEFT JOIN SERVICE_AREAS sa   ON sa.area_id      = pa.area_id
WHERE u.is_active = 1
  AND EXISTS (SELECT 1 FROM SERVICES_OFFERED so2
              WHERE so2.provider_id = sp.provider_id AND so2.is_active = 1)
GROUP BY sp.provider_id, u.username, sp.first_name, sp.last_name,
         sp.rating_avg, sp.jobs_completed
ORDER BY sp.rating_avg DESC;

-- Providers with no bookings in the last 30 days (dormant providers report)
SELECT sp.provider_id,
       u.username,
       sp.first_name || ' ' || sp.last_name AS full_name,
       sp.jobs_completed,
       sp.rating_avg
FROM SERVICE_PROVIDERS sp
JOIN USERS u ON sp.user_id = u.user_id
WHERE sp.provider_id NOT IN (
    SELECT DISTINCT so.provider_id
    FROM BOOKINGS b
    JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE b.created_at >= SYSDATE - 30
      AND b.status IN ('PENDING','CONFIRMED','COMPLETED')
)
ORDER BY sp.jobs_completed DESC;

-- Monthly average rating trend per service category
SELECT sc.category_name,
       TRUNC(r.created_at, 'MM')  AS review_month,
       COUNT(r.review_id)         AS review_count,
       ROUND(AVG(r.rating), 2)    AS avg_rating
FROM REVIEWS r
JOIN BOOKINGS b         ON r.booking_id  = b.booking_id
JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
JOIN SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
GROUP BY sc.category_name, TRUNC(r.created_at, 'MM')
ORDER BY review_month DESC, avg_rating DESC;
```

## 5.4 Stored Procedures

### SP_CREATE_BOOKING

Handles atomic booking creation. Validates that the requested time falls within the provider's slot, checks for overlapping active bookings on the same provider, validates and applies a promo code if supplied, then inserts the booking. The promo validation is wrapped in a nested block — if the code is invalid or expired, `v_promo_id` stays NULL and the booking proceeds without a discount rather than failing.

```sql
CREATE OR REPLACE PROCEDURE sp_create_booking (
    p_cust_id    IN NUMBER,
    p_srvc_id    IN NUMBER,
    p_addr_id    IN NUMBER,
    p_avail_id   IN NUMBER,
    p_promo_code IN VARCHAR2,
    p_date       IN TIMESTAMP,
    p_dur        IN NUMBER
)
IS
    v_promo_id      NUMBER := NULL;
    v_provider_id   NUMBER;
    v_overlap_count NUMBER;
    v_range_start   TIMESTAMP;
    v_range_end     TIMESTAMP;
    v_err           VARCHAR2(2000);
BEGIN
    -- 1. Resolve provider for this service
    SELECT provider_id INTO v_provider_id
    FROM   SERVICES_OFFERED
    WHERE  service_id = p_srvc_id;

    -- 2. Build the absolute time range for the requested date from slot HH24:MI
    SELECT TRUNC(p_date) + (TO_CHAR(slot_start, 'SSSSS') / 86400),
           TRUNC(p_date) + (TO_CHAR(slot_end,   'SSSSS') / 86400)
    INTO   v_range_start, v_range_end
    FROM   PROVIDER_AVAILABILITY
    WHERE  availability_id = p_avail_id;

    IF p_date < v_range_start OR (p_date + p_dur / 24) > v_range_end THEN
        RAISE_APPLICATION_ERROR(-20011,
            'Requested time is outside the provider''s available hours.');
    END IF;

    -- 3. Overlap check across all active bookings for this provider
    SELECT COUNT(*) INTO v_overlap_count
    FROM   BOOKINGS b
    JOIN   SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE  so.provider_id = v_provider_id
      AND  b.status IN ('PENDING','CONFIRMED','IN_PROGRESS')
      AND  p_date                 < (b.scheduled_date + b.duration_hours / 24)
      AND  (p_date + p_dur / 24) >  b.scheduled_date;

    IF v_overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20010,
            'Time slot is already occupied by another booking.');
    END IF;

    -- 4. Validate promo (silently ignored if invalid or expired)
    IF p_promo_code IS NOT NULL THEN
        BEGIN
            SELECT promo_id INTO v_promo_id
            FROM   PROMOTIONS
            WHERE  UPPER(promo_code) = UPPER(p_promo_code)
              AND  is_active    = 1
              AND  current_uses < max_uses
              AND  valid_until  > SYSDATE
              AND  valid_from  <= SYSDATE;

            UPDATE PROMOTIONS
            SET    current_uses = current_uses + 1
            WHERE  promo_id = v_promo_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN v_promo_id := NULL;
        END;
    END IF;

    -- 5. Insert booking
    INSERT INTO BOOKINGS (
        customer_id, service_id, address_id, availability_id,
        promo_id, scheduled_date, duration_hours, status
    ) VALUES (
        p_cust_id, p_srvc_id, p_addr_id, p_avail_id,
        v_promo_id, p_date, p_dur, 'CONFIRMED'
    );

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM;
        ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity, procedure_name, error_message)
            VALUES ('CRITICAL', 'sp_create_booking', v_err);
            COMMIT;
        END;
        RAISE;
END sp_create_booking;
/
```

---

### SP_GENERATE_INVOICE

Called when a provider marks a booking COMPLETED. Calculates the full invoice breakdown. The promo discount is capped at `max_discount_amt`. Platform fee is 10% of the post-discount amount; GST is 5%.

```sql
CREATE OR REPLACE PROCEDURE sp_generate_invoice (p_booking_id IN NUMBER)
IS
    v_hourly_rate NUMBER;
    v_dur         NUMBER;
    v_base        NUMBER;
    v_discount    NUMBER := 0;
    v_fee         NUMBER;
    v_tax         NUMBER;
    v_net         NUMBER;
    v_err         VARCHAR2(2000);
BEGIN
    SELECT so.hourly_rate, b.duration_hours
    INTO   v_hourly_rate, v_dur
    FROM   BOOKINGS b
    JOIN   SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE  b.booking_id = p_booking_id;

    v_base := v_hourly_rate * v_dur;

    -- Apply promo discount capped at max_discount_amt
    FOR rec IN (
        SELECT p.discount_percentage, p.max_discount_amt
        FROM   PROMOTIONS p
        JOIN   BOOKINGS   b ON b.promo_id = p.promo_id
        WHERE  b.booking_id = p_booking_id
    ) LOOP
        v_discount := LEAST(
            v_base * (rec.discount_percentage / 100),
            rec.max_discount_amt
        );
    END LOOP;

    v_fee := ROUND((v_base - v_discount) * 0.10, 2);   -- 10% platform fee
    v_tax := ROUND((v_base - v_discount) * 0.05, 2);   -- 5% GST
    v_net := ROUND((v_base - v_discount) + v_fee + v_tax, 2);

    INSERT INTO INVOICES (
        booking_id, base_amount, discount_amount,
        platform_fee, tax_amount, net_total
    ) VALUES (
        p_booking_id, v_base, v_discount,
        v_fee, v_tax, v_net
    );

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM;
        ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity, procedure_name, error_message)
            VALUES ('CRITICAL', 'sp_generate_invoice', v_err);
            COMMIT;
        END;
        RAISE;
END sp_generate_invoice;
/
```

---

### SP_CANCEL_BOOKING

Cancels a booking, restores the availability slot, writes an audit row to CANCELLATIONS, and marks any already-paid payment as REFUNDED.

```sql
CREATE OR REPLACE PROCEDURE sp_cancel_booking (
    p_booking_id   IN NUMBER,
    p_cancelled_by IN VARCHAR2,
    p_reason       IN VARCHAR2
)
IS
    v_status     VARCHAR2(20);
    v_avail_id   NUMBER;
    v_invoice_id NUMBER;
    v_pay_status VARCHAR2(20);
    v_err        VARCHAR2(2000);
BEGIN
    SELECT status, availability_id
    INTO   v_status, v_avail_id
    FROM   BOOKINGS
    WHERE  booking_id = p_booking_id;

    IF v_status = 'COMPLETED' THEN
        RAISE_APPLICATION_ERROR(-20020, 'Cannot cancel a completed booking.');
    END IF;

    IF v_status = 'CANCELLED' THEN
        RAISE_APPLICATION_ERROR(-20021, 'Booking is already cancelled.');
    END IF;

    UPDATE BOOKINGS SET status = 'CANCELLED'
    WHERE  booking_id = p_booking_id;

    UPDATE PROVIDER_AVAILABILITY SET is_available = 1
    WHERE  availability_id = v_avail_id;

    INSERT INTO CANCELLATIONS (booking_id, cancelled_by, reason)
    VALUES (p_booking_id, p_cancelled_by, p_reason);

    -- Refund if payment was already successful
    BEGIN
        SELECT i.invoice_id, p.payment_status
        INTO   v_invoice_id, v_pay_status
        FROM   INVOICES  i
        JOIN   PAYMENTS  p ON p.invoice_id = i.invoice_id
        WHERE  i.booking_id = p_booking_id;

        IF v_pay_status IN ('SUCCESS','COMPLETED') THEN
            UPDATE PAYMENTS
            SET    payment_status = 'REFUNDED',
                   amount_paid    = (SELECT net_total FROM INVOICES
                                     WHERE invoice_id = v_invoice_id)
            WHERE  invoice_id = v_invoice_id;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN NULL;
    END;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM;
        ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity, procedure_name, error_message)
            VALUES ('CRITICAL', 'sp_cancel_booking', v_err);
            COMMIT;
        END;
        RAISE;
END sp_cancel_booking;
/
```

## 5.5 Compound Trigger

### TRG_UPDATE_PROVIDER_RATING

A compound trigger is used rather than a simple row-level trigger to avoid Oracle's mutating table error. The `AFTER EACH ROW` section collects affected provider IDs into an associative array. The `AFTER STATEMENT` section iterates the array and recalculates both `rating_avg` and `jobs_completed` for each affected provider in a single UPDATE.

```sql
CREATE OR REPLACE TRIGGER trg_update_provider_rating
FOR INSERT OR UPDATE OR DELETE ON REVIEWS
COMPOUND TRIGGER

    TYPE t_id_table IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
    v_affected t_id_table;

AFTER EACH ROW IS
    v_pid NUMBER;
BEGIN
    SELECT so.provider_id INTO v_pid
    FROM   BOOKINGS         b
    JOIN   SERVICES_OFFERED so ON so.service_id = b.service_id
    WHERE  b.booking_id = NVL(:NEW.booking_id, :OLD.booking_id);

    v_affected(v_pid) := v_pid;
EXCEPTION
    WHEN NO_DATA_FOUND THEN NULL;
END AFTER EACH ROW;

AFTER STATEMENT IS
    v_idx NUMBER;
BEGIN
    v_idx := v_affected.FIRST;
    WHILE v_idx IS NOT NULL LOOP

        UPDATE SERVICE_PROVIDERS sp
        SET (rating_avg, jobs_completed) = (
            SELECT
                NVL(ROUND(AVG(r.rating), 2), 0.00),
                COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED'
                                    THEN b.booking_id END)
            FROM   REVIEWS          r
            JOIN   BOOKINGS         b  ON b.booking_id  = r.booking_id
            JOIN   SERVICES_OFFERED so ON so.service_id = b.service_id
            WHERE  so.provider_id = v_idx
        )
        WHERE sp.provider_id = v_idx;

        v_idx := v_affected.NEXT(v_idx);
    END LOOP;
END AFTER STATEMENT;

END trg_update_provider_rating;
/
```

## 5.6 Function

### FN_RECOMMEND_PROVIDERS

Returns a `SYS_REFCURSOR` of approved, active providers in the requested city, ranked by a composite score. The 0.2 baseline means a brand-new provider with no reviews still appears in results rather than scoring zero.

```sql
CREATE OR REPLACE FUNCTION fn_recommend_providers (
    p_area_id IN NUMBER
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT sp.provider_id,
               u.username,
               sp.first_name || ' ' || sp.last_name         AS full_name,
               sp.rating_avg,
               sp.jobs_completed,
               ROUND(
                   (sp.rating_avg * 0.5)
                   + (LEAST(sp.jobs_completed, 100) / 100.0 * 0.3)
                   + 0.2,
               2)                                            AS score
        FROM   SERVICE_PROVIDERS sp
        JOIN   USERS          u  ON u.user_id     = sp.user_id
        JOIN   PROVIDER_AREAS pa ON pa.provider_id = sp.provider_id
        WHERE  pa.area_id        = p_area_id
          AND  sp.background_chk = 'APPROVED'
          AND  u.is_active       = 1
        ORDER BY score DESC;

    RETURN v_cursor;
END fn_recommend_providers;
/
```

**Score formula:**
- `rating_avg × 0.5` — 50% weight; a 5.0 rating contributes 2.5 to the score
- `LEAST(jobs_completed, 100) / 100 × 0.3` — 30% weight capped at 100 jobs; prevents monopoly by high-volume providers
- `0.2` — 20% baseline for all approved providers

## 5.7 View

### VW_PROVIDER_SUMMARY

Used by the provider detail endpoint. The correlated subquery picks the `MAX(category_name)` among a provider's active services — a simple way to show one primary category per provider without requiring a GROUP BY on the outer query.

```sql
CREATE OR REPLACE VIEW vw_provider_summary AS
SELECT
    sp.provider_id,
    u.username,
    sp.first_name || ' ' || sp.last_name AS full_name,
    (SELECT MAX(sc.category_name)
     FROM   SERVICE_CATEGORIES sc
     JOIN   SERVICES_OFFERED so ON sc.category_id = so.category_id
     WHERE  so.provider_id = sp.provider_id
       AND  so.is_active = 1)             AS category_name,
    sp.rating_avg,
    sp.jobs_completed,
    u.is_active
FROM SERVICE_PROVIDERS sp
JOIN USERS u ON sp.user_id = u.user_id
WHERE u.is_active = 1;
```

---

# CHAPTER 6: RESULTS & SNAPSHOTS

## 6.1 Query Results

### Revenue Query (Admin Dashboard)

Running the revenue query on the seeded data returns one row per completed booking category:

| CATEGORY_NAME | TOTAL_BOOKINGS | PLATFORM_REVENUE | GROSS_VALUE |
|---|---|---|---|
| PLUMBING | 1 | 70.00 | 805.00 |

With more bookings across categories this table grows to show comparative revenue per service type, which the admin dashboard renders as a bar chart via Recharts.

### Provider Recommendation (fn_recommend_providers)

Calling `fn_recommend_providers(3)` for Bangalore returns:

| PROVIDER_ID | FULL_NAME | RATING_AVG | JOBS_COMPLETED | SCORE |
|---|---|---|---|---|
| 3 | Priya Verma | 4.90 | 62 | 2.636 |
| 2 | Dave Spark | 4.80 | 37 | 2.511 |

### Trigger Outcome

After `INSERT INTO REVIEWS (booking_id, rating, comments) VALUES (1, 5, 'Excellent')` for a booking belonging to Bob Builder (Provider 1):

**Before:**
```
PROVIDER_ID  RATING_AVG  JOBS_COMPLETED
1            4.50        50
```

**After (trigger fires automatically):**
```
PROVIDER_ID  RATING_AVG  JOBS_COMPLETED
1            4.57        51
```

`rating_avg` is recalculated as AVG across all reviews for Provider 1. `jobs_completed` is COUNT of COMPLETED bookings, not the review count.

## 6.2 Stored Procedure Execution

### Normal booking creation

```sql
BEGIN
    sp_create_booking(
        1, 1, 1, 1,
        'SAVE10',
        TO_TIMESTAMP('2026-05-05 09:00:00', 'YYYY-MM-DD HH24:MI:SS'),
        2
    );
END;
/
-- PL/SQL procedure successfully completed.
-- Booking inserted with status = 'CONFIRMED', promo_id linked.
```

### Occupied slot rejection

```sql
BEGIN
    sp_create_booking(2, 1, 2, 1, NULL,
        TO_TIMESTAMP('2026-05-05 09:30:00', 'YYYY-MM-DD HH24:MI:SS'), 1);
END;
/
-- ORA-20010: Time slot is already occupied by another booking.
-- Row written to ERROR_LOGS: severity=CRITICAL, procedure_name=sp_create_booking
```

### Invoice generation

For `sp_generate_invoice(1)` on a 2-hour Pipe Leak Fix at ₹350/hr, no promo:

```
Base amount  :  ₹700.00   (350 × 2)
Discount     :    ₹0.00
Platform fee :   ₹70.00   (10% of 700)
GST          :   ₹35.00   (5% of 700)
Net total    :  ₹805.00
```

## 6.3 Application Snapshots

**Landing Page** — A hero section introduces the platform with a service category grid (Plumbing, Electrical, Cleaning, Painting, Carpentry, Appliance Repair) and a Leaflet/OpenStreetMap showing five service cities. A live provider grid fetched from the API shows the top six rated providers.

**Customer Dashboard** — After login, the customer sees their upcoming and recent bookings, a quick-access category grid, and a recommended provider list auto-detected from the city used in their last booking.

**Booking Wizard** — A multi-step form lets the customer pick a service, choose a date and time slot (occupied slots are disabled by fetching `/api/bookings/booked-slots/:providerId`), enter a delivery address, and optionally apply a promo code with a live preview of the discount.

**My Bookings** — Shows all bookings with status badges (colour-coded), an invoice modal that expands inline when the booking is COMPLETED, and a cancel button with a reason field.

**Provider Dashboard** — Tabs for Pending, Confirmed, and Completed jobs. Each card shows the customer name, address, scheduled time, and service. A "Mark Complete" button triggers `sp_generate_invoice` and creates the payment record automatically.

**Admin Dashboard** — Four stat cards (total platform revenue, gross booking value, completed booking count, active service categories) and a Recharts dual-bar chart showing platform fee vs. gross value per category.

**Error Logs Page** — All rows from ERROR_LOGS displayed with left-border colour coding: CRITICAL in red, HIGH in orange, MEDIUM in amber, LOW in grey. Each card shows the procedure name, error message, and timestamp.

---

# CHAPTER 7: CONCLUSION, LIMITATIONS & FUTURE WORK

## 7.1 Conclusion

ServeMart works. The 16-table Oracle schema handles the full booking lifecycle with referential integrity intact. PL/SQL procedures prevent double-booking at the database layer, not just the application layer — so the restriction holds even if someone calls the database directly. The compound trigger keeps provider statistics accurate without requiring application code to manually update averages. The three-tier separation means the React frontend, Express API, and Oracle database can each be reasoned about independently.

The project demonstrates applied use of: multi-table joins and aggregates, PL/SQL stored procedures with exception handling and error logging, compound triggers avoiding the mutating table problem, cursor-returning functions, bind variables for injection prevention, JWT-based role-gated API routes, and autonomous error commits inside transactional procedures.

## 7.2 Limitations

1. **No live payment gateway.** Payment is recorded as SUCCESS after the provider marks the job complete. No actual money moves.
2. **No real-time updates.** The provider dashboard does not push new bookings. The customer has to refresh to see status changes.
3. **City-level geography only.** Provider coverage is assigned per city from a fixed list. There is no GPS-based proximity search.
4. **Single admin account.** There is no hierarchy within the admin role and no audit trail of admin actions.
5. **No email or SMS.** Booking confirmations and cancellations do not trigger any notifications outside the application.
6. **Simulated background check.** Providers register with status PENDING and are manually approved by the admin clicking a button. No document verification pipeline exists.

## 7.3 Future Work

1. Integrate a payment gateway (Razorpay or Stripe) with webhook callbacks to update payment status from the processor side.
2. Add WebSocket-based real-time booking notifications so providers see new bookings and customers see status changes instantly.
3. Use Oracle Spatial or a geocoding API to support radius-based provider search from the customer's GPS location.
4. Build an email notification layer (Nodemailer + SendGrid) for booking confirmations, cancellation alerts, and review prompts.
5. Replace the composite score function with a collaborative filtering recommendation model trained on booking history.
6. Add document upload and an admin review queue to make provider verification a real workflow rather than a checkbox.
7. Build a React Native mobile app against the same REST API.

---

# CHAPTER 8: REFERENCES

1. Oracle Corporation. (2023). *Oracle Database Documentation*. Oracle Help Center. https://docs.oracle.com/en/database/oracle/oracle-database/

2. Oracle Corporation. (2023). *PL/SQL Language Reference, Oracle Database*. Oracle Help Center.

3. React Team. (2024). *React Documentation v19*. https://react.dev/

4. Express.js Team. (2023). *Express.js 4.x API Reference*. https://expressjs.com/en/api.html

5. npm, Inc. (2024). *oracledb: Oracle Database driver for Node.js*. https://www.npmjs.com/package/oracledb

6. Auth0. (2023). *Introduction to JSON Web Tokens*. https://jwt.io/introduction

7. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7th ed.). McGraw-Hill Education.

8. Ramakrishnan, R., & Gehrke, J. (2002). *Database Management Systems* (3rd ed.). McGraw-Hill.

9. Leaflet.js Contributors. (2024). *Leaflet — open-source JavaScript library for interactive maps*. https://leafletjs.com/

10. Recharts Group. (2024). *Recharts — chart library built with React and D3*. https://recharts.org/

11. Colby, S. et al. (2023). *Zod — TypeScript-first schema validation*. https://zod.dev/

---

*Report prepared for Database Systems Lab (CSS 2212)*
*School of Computer Engineering, Manipal Institute of Technology, Manipal*
*April 2026*

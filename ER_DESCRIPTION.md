# ServeMart — ER Diagram Description

> This document fully describes every entity, attribute, and relationship in the `init.sql` schema. Use this as a direct blueprint to draw the ER diagram.

---

## Entities & Attributes

For each entity the primary key is marked **PK**, foreign keys **FK**, and unique constraints **UQ**.

---

### 1. USERS
**Purpose:** Single authentication record for every person on the platform regardless of role.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `user_id` | NUMBER | **PK** | Auto-increment identity |
| `username` | VARCHAR2(50) | NOT NULL, **UQ** | Login handle |
| `password_hash` | VARCHAR2(256) | NOT NULL | bcrypt hash |
| `email` | VARCHAR2(100) | NOT NULL, **UQ** | |
| `user_role` | VARCHAR2(20) | NOT NULL | `CUSTOMER`, `PROVIDER`, or `ADMIN` |
| `is_active` | NUMBER(1,0) | DEFAULT 1 | 0 = deactivated |
| `last_login` | TIMESTAMP | nullable | Updated on login |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now | |

---

### 2. CUSTOMERS
**Purpose:** Extended profile for users who book services.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `customer_id` | NUMBER | **PK** | Auto-increment identity |
| `user_id` | NUMBER | NOT NULL, **UQ**, **FK→USERS** | CASCADE DELETE |
| `first_name` | VARCHAR2(50) | NOT NULL | |
| `last_name` | VARCHAR2(50) | NOT NULL | |
| `phone` | VARCHAR2(20) | nullable | |

**Key design:** 1-to-1 with USERS. Separating profile from auth means adding fields (e.g., loyalty points) never touches the auth table.

---

### 3. CUSTOMER_ADDRESSES
**Purpose:** One customer may save multiple delivery addresses.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `address_id` | NUMBER | **PK** | Auto-increment identity |
| `customer_id` | NUMBER | NOT NULL, **FK→CUSTOMERS** | CASCADE DELETE |
| `location_label` | VARCHAR2(50) | DEFAULT `'HOME'` | e.g. HOME, OFFICE |
| `house_no` | VARCHAR2(50) | NOT NULL | |
| `building_name` | VARCHAR2(150) | nullable | |
| `area_landmark` | VARCHAR2(255) | NOT NULL | |
| `city` | VARCHAR2(100) | NOT NULL | |
| `postal_code` | NUMBER(10) | NOT NULL | |

---

### 4. SERVICE_PROVIDERS
**Purpose:** Extended profile for users who offer services. Statistics are auto-maintained by a database trigger.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `provider_id` | NUMBER | **PK** | Auto-increment identity |
| `user_id` | NUMBER | NOT NULL, **UQ**, **FK→USERS** | CASCADE DELETE |
| `first_name` | VARCHAR2(50) | NOT NULL | |
| `last_name` | VARCHAR2(50) | NOT NULL | |
| `phone` | VARCHAR2(20) | nullable | |
| `experience_yrs` | NUMBER | DEFAULT 0 | |
| `background_chk` | VARCHAR2(20) | DEFAULT `'PENDING'` | `PENDING`, `APPROVED`, `REJECTED` |
| `rating_avg` | NUMBER(3,2) | DEFAULT 0.00 | Auto-updated by `trg_update_provider_rating` |
| `jobs_completed` | NUMBER | DEFAULT 0 | Auto-updated by `trg_update_provider_rating` |

---

### 5. SERVICE_AREAS
**Purpose:** Master list of cities the platform supports. Managed by admins.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `area_id` | NUMBER | **PK** | Auto-increment identity |
| `city_name` | VARCHAR2(100) | NOT NULL | |
| `region_code` | VARCHAR2(50) | NOT NULL | State code e.g. `MH`, `KA` |
| *(composite UQ)* | | **UQ(city_name, region_code)** | |

---

### 6. PROVIDER_AREAS
**Purpose:** Associates providers with the cities they serve. This is the **junction / associative entity** for the M:N relationship between SERVICE_PROVIDERS and SERVICE_AREAS.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `provider_area_id` | NUMBER | **PK** | Auto-increment identity |
| `provider_id` | NUMBER | NOT NULL, **FK→SERVICE_PROVIDERS** | CASCADE DELETE |
| `area_id` | NUMBER | NOT NULL, **FK→SERVICE_AREAS** | CASCADE DELETE |
| *(composite UQ)* | | **UQ(provider_id, area_id)** | Prevents duplicate assignments |

---

### 7. PROVIDER_AVAILABILITY
**Purpose:** Weekly recurring time slots a provider is available. Stored with a sentinel date (`2000-01-01`); only HH:MM matters at runtime.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `availability_id` | NUMBER | **PK** | Auto-increment identity |
| `provider_id` | NUMBER | NOT NULL, **FK→SERVICE_PROVIDERS** | CASCADE DELETE |
| `day_of_week` | VARCHAR2(15) | CHECK | `MONDAY`…`SUNDAY` |
| `slot_start` | DATE | NOT NULL | Time stored as `2000-01-01 HH:MI` |
| `slot_end` | DATE | NOT NULL | Must be > `slot_start` (CHECK constraint) |
| `is_available` | NUMBER(1,0) | DEFAULT 1 | 0 = blocked by active booking |

---

### 8. SERVICE_CATEGORIES
**Purpose:** Look-up table for service types. Normalised out to ensure consistent naming.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `category_id` | NUMBER | **PK** | Auto-increment identity |
| `category_name` | VARCHAR2(100) | NOT NULL, **UQ** | e.g. `PLUMBING`, `ELECTRICAL` |

---

### 9. SERVICES_OFFERED
**Purpose:** Each row is a specific service that a provider lists, with its own price.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `service_id` | NUMBER | **PK** | Auto-increment identity |
| `provider_id` | NUMBER | NOT NULL, **FK→SERVICE_PROVIDERS** | CASCADE DELETE |
| `category_id` | NUMBER | NOT NULL, **FK→SERVICE_CATEGORIES** | CASCADE DELETE |
| `service_name` | VARCHAR2(100) | NOT NULL | e.g. "Pipe Leak Fix" |
| `hourly_rate` | NUMBER(10,2) | NOT NULL, CHECK ≥ 0 | |
| `is_active` | NUMBER(1,0) | DEFAULT 1 | Soft delete |

---

### 10. PROMOTIONS
**Purpose:** Discount codes with usage limits, date bounds, and minimum order amounts.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `promo_id` | NUMBER | **PK** | Auto-increment identity |
| `promo_code` | VARCHAR2(20) | NOT NULL, **UQ** | Case-insensitive match |
| `discount_percentage` | NUMBER(3,0) | NOT NULL, CHECK 1–100 | |
| `max_discount_amt` | NUMBER(10,2) | NOT NULL | Cap on absolute discount |
| `min_order_amt` | NUMBER(10,2) | DEFAULT 0 | Minimum base amount required |
| `valid_from` | TIMESTAMP | DEFAULT now | |
| `valid_until` | TIMESTAMP | NOT NULL, CHECK > valid_from | |
| `max_uses` | NUMBER | DEFAULT 100 | Total redemptions |
| `current_uses` | NUMBER | DEFAULT 0 | Incremented on each use |
| `is_active` | NUMBER(1,0) | DEFAULT 1 | Toggle |

---

### 11. BOOKINGS
**Purpose:** The central transaction entity. Captures every service appointment made on the platform.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `booking_id` | NUMBER | **PK** | Auto-increment identity |
| `customer_id` | NUMBER | NOT NULL, **FK→CUSTOMERS** | CASCADE DELETE |
| `service_id` | NUMBER | NOT NULL, **FK→SERVICES_OFFERED** | CASCADE DELETE |
| `address_id` | NUMBER | NOT NULL, **FK→CUSTOMER_ADDRESSES** | CASCADE DELETE |
| `availability_id` | NUMBER | NOT NULL, **FK→PROVIDER_AVAILABILITY** | |
| `promo_id` | NUMBER | nullable, **FK→PROMOTIONS** | SET NULL on delete |
| `scheduled_date` | TIMESTAMP | NOT NULL | Exact start date-time |
| `duration_hours` | NUMBER(4,1) | DEFAULT 1.0 | |
| `status` | VARCHAR2(20) | DEFAULT `CONFIRMED` | `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now | |

---

### 12. INVOICES
**Purpose:** Financial summary generated for each completed booking. Exactly one invoice per booking.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `invoice_id` | NUMBER | **PK** | Auto-increment identity |
| `booking_id` | NUMBER | NOT NULL, **UQ**, **FK→BOOKINGS** | 1-to-1; CASCADE DELETE |
| `base_amount` | NUMBER(10,2) | NOT NULL | `hourly_rate × duration_hours` |
| `discount_amount` | NUMBER(10,2) | DEFAULT 0 | Capped promo discount |
| `platform_fee` | NUMBER(10,2) | DEFAULT 0 | 10% of post-discount amount |
| `tax_amount` | NUMBER(10,2) | DEFAULT 0 | 5% GST of post-discount amount |
| `net_total` | NUMBER(10,2) | NOT NULL | Final amount charged |
| `generated_at` | TIMESTAMP | NOT NULL, DEFAULT now | |

---

### 13. PAYMENTS
**Purpose:** Payment record for each invoice. Exactly one payment per invoice.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `payment_id` | NUMBER | **PK** | Auto-increment identity |
| `invoice_id` | NUMBER | NOT NULL, **UQ**, **FK→INVOICES** | 1-to-1; CASCADE DELETE |
| `amount_paid` | NUMBER(10,2) | NOT NULL | |
| `payment_method` | VARCHAR2(50) | DEFAULT `CASH` | `CASH`, `CREDIT_CARD`, `UPI`, `STRIPE` |
| `payment_status` | VARCHAR2(20) | DEFAULT `PENDING` | `PENDING`, `SUCCESS`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `transaction_id` | VARCHAR2(100) | nullable | `TXN_<epoch>` |
| `paid_at` | TIMESTAMP | NOT NULL, DEFAULT now | |

---

### 14. REVIEWS
**Purpose:** A customer's rating and comment for a completed booking. One review per booking enforced by UNIQUE.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `review_id` | NUMBER | **PK** | Auto-increment identity |
| `booking_id` | NUMBER | NOT NULL, **UQ**, **FK→BOOKINGS** | 1-to-1; CASCADE DELETE |
| `rating` | NUMBER(1,0) | NOT NULL, CHECK 1–5 | |
| `comments` | VARCHAR2(1000) | nullable | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now | |

> Inserting/updating/deleting a row here fires **`trg_update_provider_rating`**.

---

### 15. CANCELLATIONS
**Purpose:** Immutable audit log for every cancellation event.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `cancellation_id` | NUMBER | **PK** | Auto-increment identity |
| `booking_id` | NUMBER | NOT NULL, **UQ**, **FK→BOOKINGS** | 1-to-1; CASCADE DELETE |
| `cancelled_by` | VARCHAR2(10) | CHECK | `CUSTOMER`, `PROVIDER`, `SYSTEM` |
| `reason` | VARCHAR2(500) | nullable | |
| `cancelled_at` | TIMESTAMP | DEFAULT now | |

---

### 16. ERROR_LOGS
**Purpose:** Central audit table for all PL/SQL exceptions. Exists before all other tables so PL/SQL can always write to it.

| Attribute | Type | Constraint | Notes |
|-----------|------|-----------|-------|
| `log_id` | NUMBER | **PK** | Auto-increment identity |
| `severity` | VARCHAR2(10) | CHECK | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `procedure_name` | VARCHAR2(100) | nullable | Which PL/SQL object raised it |
| `error_message` | VARCHAR2(2000) | nullable | `SQLERRM` text |
| `logged_at` | TIMESTAMP | DEFAULT now | |

---

## Relationships

### R1 — USERS ↔ CUSTOMERS
- **Type:** One-to-One (1:1)
- **Participation:** Total on CUSTOMERS (every customer must have a user), partial on USERS (not all users are customers — some are providers or admins)
- **FK:** `CUSTOMERS.user_id` → `USERS.user_id`
- **On Delete:** CASCADE — deleting the user removes the customer profile
- **Diagram note:** Draw a single line with double line on the CUSTOMERS side (total participation) and single line on USERS side (partial participation)

---

### R2 — USERS ↔ SERVICE_PROVIDERS
- **Type:** One-to-One (1:1)
- **Participation:** Total on SERVICE_PROVIDERS (every provider must have a user), partial on USERS
- **FK:** `SERVICE_PROVIDERS.user_id` → `USERS.user_id`
- **On Delete:** CASCADE
- **Diagram note:** Symmetric to R1

---

### R3 — CUSTOMERS ↔ CUSTOMER_ADDRESSES
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on CUSTOMERS (a customer may have no saved addresses), total on CUSTOMER_ADDRESSES (every address must belong to a customer)
- **FK:** `CUSTOMER_ADDRESSES.customer_id` → `CUSTOMERS.customer_id`
- **On Delete:** CASCADE
- **Cardinality:** One customer → zero or more addresses; one address → exactly one customer

---

### R4 — SERVICE_PROVIDERS ↔ SERVICE_AREAS (via PROVIDER_AREAS)
- **Type:** Many-to-Many (M:N)
- **Junction / Associative Entity:** `PROVIDER_AREAS`
- **Participation:** Partial on both sides (a provider may serve zero areas; an area may have zero providers)
- **FKs in junction:**
  - `PROVIDER_AREAS.provider_id` → `SERVICE_PROVIDERS.provider_id` (CASCADE)
  - `PROVIDER_AREAS.area_id` → `SERVICE_AREAS.area_id` (CASCADE)
- **UNIQUE constraint on junction:** `(provider_id, area_id)` prevents a provider from being assigned the same area twice
- **Diagram note:** Draw PROVIDER_AREAS as a diamond (relationship) or a rectangle (associative entity) between SERVICE_PROVIDERS and SERVICE_AREAS

---

### R5 — SERVICE_PROVIDERS ↔ PROVIDER_AVAILABILITY
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on SERVICE_PROVIDERS, total on PROVIDER_AVAILABILITY
- **FK:** `PROVIDER_AVAILABILITY.provider_id` → `SERVICE_PROVIDERS.provider_id`
- **On Delete:** CASCADE
- **Cardinality:** One provider → zero or more weekly slots; one slot → exactly one provider

---

### R6 — SERVICE_PROVIDERS ↔ SERVICES_OFFERED
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on SERVICE_PROVIDERS, total on SERVICES_OFFERED
- **FK:** `SERVICES_OFFERED.provider_id` → `SERVICE_PROVIDERS.provider_id`
- **On Delete:** CASCADE
- **Cardinality:** One provider → zero or more services; one service listing → exactly one provider

---

### R7 — SERVICE_CATEGORIES ↔ SERVICES_OFFERED
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on SERVICE_CATEGORIES, total on SERVICES_OFFERED
- **FK:** `SERVICES_OFFERED.category_id` → `SERVICE_CATEGORIES.category_id`
- **On Delete:** CASCADE
- **Cardinality:** One category → zero or more service listings; one listing → exactly one category

---

### R8 — CUSTOMERS ↔ BOOKINGS
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on CUSTOMERS, total on BOOKINGS
- **FK:** `BOOKINGS.customer_id` → `CUSTOMERS.customer_id`
- **On Delete:** CASCADE
- **Cardinality:** One customer → zero or more bookings; one booking → exactly one customer

---

### R9 — SERVICES_OFFERED ↔ BOOKINGS
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on SERVICES_OFFERED, total on BOOKINGS
- **FK:** `BOOKINGS.service_id` → `SERVICES_OFFERED.service_id`
- **On Delete:** CASCADE
- **Cardinality:** One service offering → zero or more bookings; one booking → exactly one service offering

---

### R10 — CUSTOMER_ADDRESSES ↔ BOOKINGS
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on CUSTOMER_ADDRESSES, total on BOOKINGS
- **FK:** `BOOKINGS.address_id` → `CUSTOMER_ADDRESSES.address_id`
- **On Delete:** CASCADE
- **Cardinality:** One address → zero or more bookings; one booking → exactly one address

---

### R11 — PROVIDER_AVAILABILITY ↔ BOOKINGS
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on PROVIDER_AVAILABILITY, total on BOOKINGS
- **FK:** `BOOKINGS.availability_id` → `PROVIDER_AVAILABILITY.availability_id`
- **On Delete:** No action (intentional — availability slot data is kept after booking deletion)
- **Cardinality:** One availability slot → zero or more bookings; one booking → exactly one slot

---

### R12 — PROMOTIONS ↔ BOOKINGS
- **Type:** One-to-Many (1:N)
- **Participation:** Partial on both sides (a promo may be used on multiple bookings; a booking can have at most one promo — or none)
- **FK:** `BOOKINGS.promo_id` → `PROMOTIONS.promo_id`
- **On Delete:** SET NULL — deleting a promo does not delete the booking; `promo_id` becomes NULL
- **Cardinality:** One promo → zero or more bookings; one booking → zero or one promo

---

### R13 — BOOKINGS ↔ INVOICES
- **Type:** One-to-One (1:1)
- **Participation:** Partial on BOOKINGS (only completed bookings get an invoice), total on INVOICES (every invoice must be for a booking)
- **FK:** `INVOICES.booking_id` → `BOOKINGS.booking_id`
- **Enforced by:** UNIQUE constraint on `INVOICES.booking_id`
- **On Delete:** CASCADE

---

### R14 — INVOICES ↔ PAYMENTS
- **Type:** One-to-One (1:1)
- **Participation:** Partial on INVOICES, total on PAYMENTS
- **FK:** `PAYMENTS.invoice_id` → `INVOICES.invoice_id`
- **Enforced by:** UNIQUE constraint on `PAYMENTS.invoice_id`
- **On Delete:** CASCADE

---

### R15 — BOOKINGS ↔ REVIEWS
- **Type:** One-to-One (1:1)
- **Participation:** Partial on BOOKINGS (only completed bookings become eligible), total on REVIEWS
- **FK:** `REVIEWS.booking_id` → `BOOKINGS.booking_id`
- **Enforced by:** UNIQUE constraint on `REVIEWS.booking_id`
- **On Delete:** CASCADE
- **Business rule:** Inserting, updating, or deleting here fires the compound trigger `trg_update_provider_rating`

---

### R16 — BOOKINGS ↔ CANCELLATIONS
- **Type:** One-to-One (1:1)
- **Participation:** Partial on BOOKINGS (only cancelled bookings have a record), total on CANCELLATIONS
- **FK:** `CANCELLATIONS.booking_id` → `BOOKINGS.booking_id`
- **Enforced by:** UNIQUE constraint on `CANCELLATIONS.booking_id`
- **On Delete:** CASCADE

---

## Summary Cardinality Table

| Relationship | Entity A | Cardinality | Entity B | Junction Entity |
|---|---|---|---|---|
| R1 | USERS | 1 — 1 | CUSTOMERS | — |
| R2 | USERS | 1 — 1 | SERVICE_PROVIDERS | — |
| R3 | CUSTOMERS | 1 — N | CUSTOMER_ADDRESSES | — |
| R4 | SERVICE_PROVIDERS | M — N | SERVICE_AREAS | **PROVIDER_AREAS** |
| R5 | SERVICE_PROVIDERS | 1 — N | PROVIDER_AVAILABILITY | — |
| R6 | SERVICE_PROVIDERS | 1 — N | SERVICES_OFFERED | — |
| R7 | SERVICE_CATEGORIES | 1 — N | SERVICES_OFFERED | — |
| R8 | CUSTOMERS | 1 — N | BOOKINGS | — |
| R9 | SERVICES_OFFERED | 1 — N | BOOKINGS | — |
| R10 | CUSTOMER_ADDRESSES | 1 — N | BOOKINGS | — |
| R11 | PROVIDER_AVAILABILITY | 1 — N | BOOKINGS | — |
| R12 | PROMOTIONS | 1 — N (optional) | BOOKINGS | — |
| R13 | BOOKINGS | 1 — 1 (optional) | INVOICES | — |
| R14 | INVOICES | 1 — 1 (optional) | PAYMENTS | — |
| R15 | BOOKINGS | 1 — 1 (optional) | REVIEWS | — |
| R16 | BOOKINGS | 1 — 1 (optional) | CANCELLATIONS | — |

---

## Functional Dependencies & Normalisation Notes

### 3NF / BCNF Compliance

Every table has a single-column surrogate PK (auto-identity). All non-key attributes depend directly on the PK and on nothing else.

Selected justifications:

- **`USERS` → `CUSTOMERS` / `SERVICE_PROVIDERS` split:** `first_name`, `last_name`, `phone` are specific to role profiles, not to authentication. Keeping them separate avoids NULL-heavy columns and potential update anomalies.
- **`SERVICE_CATEGORIES` as lookup:** If category names were stored directly in `SERVICES_OFFERED`, renaming a category (e.g. "ELECTRIC" → "ELECTRICAL") would require updating thousands of rows. With a FK to `SERVICE_CATEGORIES`, it is a single-row update.
- **`SERVICE_AREAS` as master table:** Prevents city names from being stored as free-text strings in `PROVIDER_AREAS`, ensuring consistent naming across all queries.
- **`INVOICES` separated from `BOOKINGS`:** Financial data (fee breakdown, tax) has a different lifecycle and read pattern from scheduling data. Separation keeps each table focused and avoids wide rows with many nullable finance columns.
- **`PAYMENTS` separated from `INVOICES`:** An invoice can exist before payment; payment status can change (REFUNDED) independently of the invoice amount. The 1:1 split clearly models this temporal difference.
- **`CANCELLATIONS` separated from `BOOKINGS`:** The reason, canceller, and timestamp of a cancellation are only meaningful when a booking is cancelled. Storing them as NULLable columns on `BOOKINGS` would violate 1NF principles in spirit.

---

## Key Constraints Cheat Sheet

| Table | Constraint Type | Columns Involved | Rule |
|-------|----------------|-----------------|------|
| USERS | UNIQUE | `username` | No duplicate usernames |
| USERS | UNIQUE | `email` | No duplicate emails |
| USERS | CHECK | `user_role` | Must be CUSTOMER, PROVIDER, or ADMIN |
| USERS | CHECK | `is_active` | Must be 0 or 1 |
| CUSTOMERS | UNIQUE | `user_id` | One customer profile per user |
| SERVICE_PROVIDERS | UNIQUE | `user_id` | One provider profile per user |
| SERVICE_PROVIDERS | CHECK | `background_chk` | PENDING, APPROVED, or REJECTED |
| SERVICE_AREAS | UNIQUE (composite) | `(city_name, region_code)` | No duplicate city-region pairs |
| PROVIDER_AREAS | UNIQUE (composite) | `(provider_id, area_id)` | No duplicate provider-area assignments |
| PROVIDER_AVAILABILITY | CHECK | `slot_end > slot_start` | Time window must be positive |
| PROVIDER_AVAILABILITY | CHECK | `is_available` | 0 or 1 |
| SERVICE_CATEGORIES | UNIQUE | `category_name` | No duplicate category names |
| SERVICES_OFFERED | CHECK | `hourly_rate >= 0` | No negative rates |
| PROMOTIONS | UNIQUE | `promo_code` | No duplicate codes |
| PROMOTIONS | CHECK | `discount_percentage` | Between 1 and 100 |
| PROMOTIONS | CHECK | `valid_until > valid_from` | Validity window must be positive |
| BOOKINGS | CHECK | `status` | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED |
| INVOICES | UNIQUE | `booking_id` | One invoice per booking |
| PAYMENTS | UNIQUE | `invoice_id` | One payment per invoice |
| PAYMENTS | CHECK | `payment_method` | CASH, CREDIT_CARD, UPI, STRIPE |
| PAYMENTS | CHECK | `payment_status` | PENDING, SUCCESS, COMPLETED, FAILED, REFUNDED |
| REVIEWS | UNIQUE | `booking_id` | One review per booking |
| REVIEWS | CHECK | `rating` | Between 1 and 5 |
| CANCELLATIONS | UNIQUE | `booking_id` | One cancellation record per booking |
| ERROR_LOGS | CHECK | `severity` | LOW, MEDIUM, HIGH, CRITICAL |

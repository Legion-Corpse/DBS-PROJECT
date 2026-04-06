# ServeMart — Local Service Marketplace & Booking Management System

**ServeMart** is a full-stack web application that connects customers with verified local service providers (plumbers, electricians, cleaners, painters, and more). Built as a college Database Systems mini project, it scales a pure Oracle PL/SQL database into a complete React + Express web application with three distinct role-based dashboards.

> **App Name:** ServeMart  
> **Team:** Abhyuday Gupta · Shaurya Jain · Neelaksha Sisodiya (CSE-C, Batch 2024, University)  
> **Course:** Database Systems (DBS) Mini Project

---

## Team

| Name | Branch | Roll No | Enrollment No |
|------|--------|---------|---------------|
| Abhyuday Gupta | CSE C | 57 | 240905576 |
| Shaurya Jain | CSE C | 60 | 240905598 |
| Neelaksha Sisodiya | CSE C | 65 | 240905642 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (Vite), React Router v7, Axios, react-icons, Recharts, Leaflet.js / react-leaflet |
| **Styling** | Vanilla CSS (custom design tokens, glassmorphism, dark mode, animated orbs, shimmer loaders) |
| **Backend** | Node.js, Express.js 4 |
| **Database** | Oracle 21c XE running in Docker |
| **ORM / DB Driver** | `oracledb` v6 (connection pool, bind variables only) |
| **Auth** | JWT (`jsonwebtoken`), bcrypt password hashing |
| **Validation** | Zod schema validation |
| **Security** | `express-rate-limit` (general + strict auth limiter), CORS |
| **Environment** | `dotenv` |

---

## Project Status: **COMPLETE** ✅

| Module | Status |
|--------|--------|
| Oracle Database schema (18 tables) | ✅ Done |
| PL/SQL stored procedures & triggers | ✅ Done |
| Backend Express API (6 route groups) | ✅ Done |
| Frontend — Landing page | ✅ Done |
| Frontend — Auth (Login / Register) | ✅ Done |
| Frontend — Customer dashboard | ✅ Done |
| Frontend — Provider dashboard | ✅ Done |
| Frontend — Admin dashboard | ✅ Done |
| Invoice modal & PDF print | ✅ Done |
| Leaflet map (provider service areas) | ✅ Done |
| 30-second polling for booking updates | ✅ Done |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Oracle 21c XE in Docker (or native install)
- Docker Desktop (to start the Oracle container)

### 1 — Start Oracle Database

```bash
docker start oracleXE
```

Connect as the `marketplace` user (host: `localhost`, port: `1521`, SID: `xe`).

If the schema has not been set up yet, run in order:
```
schema.sql     → creates all 18 tables
init.sql       → compiles PL/SQL triggers, procedures, functions, views
data.sql       → seeds sample data
```

### 2 — Backend

```bash
cd backend
npm install
node server.js        # or: npx nodemon server.js
```

The API will start on **http://localhost:3000**.

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app will start on **http://localhost:5173** (Vite default).

### Environment Variables (`backend/.env`)

```env
PORT=3000
DB_USER=marketplace
DB_PASS=market123
DB_HOST=localhost
DB_PORT=1521
DB_SID=xe
JWT_SECRET=superSecretKey999
```

---

## Directory Structure

```
DBS PROJECT/
├── schema.sql          ← DDL: all 18 Oracle tables
├── init.sql            ← PL/SQL: triggers, procedures, functions, views
├── data.sql            ← Seed data for all tables
├── queries.sql         ← Sample analytic queries
│
├── backend/
│   ├── server.js       ← Express entry point, rate limiters, route mounting
│   ├── db.js           ← Oracle connection pool (oracledb)
│   ├── .env            ← DB credentials, JWT secret, port
│   ├── routes/
│   │   ├── auth.js     ← Register / Login
│   │   ├── providers.js← Provider listings, slots, services, recommendation
│   │   ├── bookings.js ← Create, list, complete, cancel bookings
│   │   ├── invoices.js ← Fetch invoice, mark payment
│   │   ├── reviews.js  ← Submit review for completed booking
│   │   └── admin.js    ← Revenue analytics, error logs, provider approval
│   ├── middleware/
│   │   ├── auth.js     ← JWT verification (requireAuth)
│   │   └── validate.js ← Zod validation factory
│   └── utils/
│       └── errorMapper.js ← Translates Oracle ORA- errors to user messages
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx          ← React root, AuthProvider wrapper
        ├── App.jsx           ← React Router: all routes & protected routes
        ├── api/
        │   ├── axios.js      ← Axios instance, JWT interceptor, 401 redirect
        │   ├── auth.js       ← login(), register()
        │   ├── bookings.js   ← createBooking(), getMyBookings(), completeBooking(), cancelBooking()
        │   ├── invoices.js   ← getInvoice()
        │   ├── providers.js  ← getProviders(), getProvider(), getCategories()
        │   └── admin.js      ← getRevenue(), getErrorLogs()
        ├── context/
        │   └── AuthContext.jsx ← JWT decode, login/logout, token persistence (localStorage)
        ├── components/
        │   ├── Navbar.jsx        ← Top nav with role-aware links, logout
        │   ├── ProtectedRoute.jsx← Role-based route guard
        │   ├── BookingCard.jsx   ← Booking list item with actions
        │   ├── ProviderCard.jsx  ← Provider listing card (rating, category, Book button)
        │   ├── InvoiceModal.jsx  ← Full invoice breakdown modal with print support
        │   ├── MapView.jsx       ← Leaflet map showing provider service areas
        │   ├── CategoryGrid.jsx  ← Service category grid component
        │   ├── StarRating.jsx    ← Visual star rating component
        │   ├── LoadingSpinner.jsx← Centered loading indicator
        │   └── ErrorModal.jsx    ← Reusable error / success modal
        ├── pages/
        │   ├── Landing.jsx       ← Public home page (ServeMart brand)
        │   ├── Login.jsx         ← Login form
        │   ├── Register.jsx      ← Multi-step registration (Customer or Provider type)
        │   ├── customer/
        │   │   ├── Dashboard.jsx   ← Stats, search, provider grid, quick categories
        │   │   ├── Browse.jsx      ← Filter/search all providers + Leaflet map
        │   │   ├── BookingForm.jsx ← 3-step wizard: Details → Payment → Success
        │   │   ├── MyBookings.jsx  ← Status-filtered booking list, cancel, view invoice
        │   │   └── ReviewForm.jsx  ← 1–5 star review submission for completed bookings
        │   ├── provider/
        │   │   ├── Dashboard.jsx   ← Tabbed booking list, Mark Complete, real-time poll
        │   │   ├── ManageSlots.jsx ← CRUD for weekly availability slots
        │   │   ├── ManageServices.jsx ← Add / delete services with hourly rates
        │   │   └── JobComplete.jsx ← Confirm job completion page
        │   └── admin/
        │       ├── Dashboard.jsx   ← Recharts bar chart + revenue table by category
        │       └── ErrorLogs.jsx   ← Database error log viewer with severity filters
        └── styles/
            ├── global.css        ← CSS custom properties, typography, utility classes,
            │                       animations (fade-up, float orbs, shimmer, spin)
            └── components.css    ← Navbar, cards, forms, badges, booking cards,
                                    modals, stat cards, search bar, map container
```

---

## Database Architecture

**18 tables** across 5 logical layers.

---

### Layer 1 — User Identity

| Table | Purpose | Key Attributes |
|---|---|---|
| `USERS` | Central auth record for all roles | `user_id` PK, `username`, `email`, `user_role` (CUSTOMER/PROVIDER/ADMIN), `is_active` |
| `CUSTOMERS` | Customer profile (1:1 with USERS) | `customer_id` PK, `user_id` FK, `first_name`, `last_name`, `phone` |
| `SERVICE_PROVIDERS` | Provider profile (1:1 with USERS) | `provider_id` PK, `user_id` FK, `rating_avg`, `jobs_completed`, `background_chk`, `experience_yrs` |

---

### Layer 2 — Service & Availability

| Table | Purpose | Key Attributes |
|---|---|---|
| `SERVICE_CATEGORIES` | Lookup table for service types | `category_id` PK, `category_name` |
| `SERVICES_OFFERED` | Services a provider lists | `service_id` PK, `provider_id` FK, `category_id` FK, `service_name`, `hourly_rate`, `is_active` |
| `PROVIDER_AVAILABILITY` | Provider's open time windows | `availability_id` PK, `provider_id` FK, `day_of_week`, `slot_start`, `slot_end`, `is_available` |
| `SERVICE_AREAS` | Geographic service zones | `area_id` PK, `city_name`, `region_code` |
| `PROVIDER_AREAS` | M:N junction — which providers serve which areas | `provider_area_id` PK, `provider_id` FK, `area_id` FK |

---

### Layer 3 — Bookings & Addresses

| Table | Purpose | Key Attributes |
|---|---|---|
| `CUSTOMER_ADDRESSES` | Saved delivery addresses per customer | `address_id` PK, `customer_id` FK, `house_no`, `area_landmark`, `city`, `postal_code` (NUMBER) |
| `PROMOTIONS` | Discount codes | `promo_id` PK, `promo_code`, `discount_percentage`, `max_discount_amt`, `min_order_amt`, `valid_from/until`, `max_uses` |
| `BOOKINGS` | Core transaction record | `booking_id` PK, `customer_id` FK, `service_id` FK, `address_id` FK, `availability_id` FK, `promo_id` FK (nullable), `scheduled_date`, `duration_hours`, `status` |

`BOOKINGS.status` lifecycle: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`

---

### Layer 4 — Financials

| Table | Purpose | Key Attributes |
|---|---|---|
| `INVOICES` | Generated when booking completes | `invoice_id` PK, `booking_id` FK (1:1), `base_amount`, `discount_amount`, `platform_fee`, `tax_amount`, `net_total` |
| `PAYMENTS` | Payment record per invoice | `payment_id` PK, `invoice_id` FK (1:1), `amount_paid`, `payment_method` (CASH/UPI/etc.), `payment_status`, `transaction_id` |

---

### Layer 5 — Post-Booking & System

| Table | Purpose | Key Attributes |
|---|---|---|
| `REVIEWS` | 1:1 with booking, rating 1–5 | `review_id` PK, `booking_id` FK, `rating`, `comments` |
| `CANCELLATIONS` | Records who cancelled and why | `cancellation_id` PK, `booking_id` FK, `cancelled_by` (CUSTOMER/PROVIDER/SYSTEM), `reason` |
| `SUPPORT_TICKETS` | User-raised issues, optionally linked to a booking | `ticket_id` PK, `user_id` FK, `booking_id` FK (nullable), `subject`, `status` |
| `PLATFORM_FEEDBACK` | General app feedback from any user | `feedback_id` PK, `user_id` FK, `rating`, `comments` |
| `ERROR_LOGS` | PL/SQL procedure error capture | `log_id` PK, `severity`, `procedure_name`, `error_message` |

---

### Key Design Decisions

- **Single `USERS` table** with `user_role` discriminator; `CUSTOMERS` and `SERVICE_PROVIDERS` are separate profile tables linked 1:1
- **`BOOKINGS` is the hub** — 6 foreign keys converge on it (customer, service, address, availability, promo) and it spawns invoice, review, and cancellation records
- **Payment is backend-automated** — created automatically when a provider marks a booking complete, not customer-initiated
- **`postal_code` is `NUMBER(10)`** — not VARCHAR; null is not accepted
- **All primary keys** use `NUMBER GENERATED ALWAYS AS IDENTITY` (no separate sequences)

---

## PL/SQL Objects

### Trigger
**`trg_update_provider_rating`** — Fires `AFTER INSERT OR UPDATE OR DELETE` on `REVIEWS`. Automatically recalculates `rating_avg` (AVG of all ratings) and `jobs_completed` (COUNT of linked completed bookings) on `SERVICE_PROVIDERS`. Ensures provider stats are always consistent.

### Functions
**`fn_recommend_providers(p_area_id)`** — Returns a `SYS_REFCURSOR` of providers in the given area, ranked by a composite score:
```
score = (rating_avg × 0.5) + (LEAST(jobs_completed, 100) / 100 × 0.3) + 0.2
```

### Stored Procedures
| Procedure | What it does |
|-----------|-------------|
| `sp_create_booking(cust_id, srvc_id, addr_id, avail_id, promo_code, date, dur)` | Locks the availability slot using `SELECT FOR UPDATE`, validates promo code, inserts booking |
| `sp_generate_invoice(booking_id)` | Calculates base amount, applies promo discount, adds 10% platform fee + 5% tax, inserts into `INVOICES` |
| `sp_cancel_booking(booking_id, cancelled_by, reason)` | Cancels the booking, restores the availability slot (`is_available = 1`), logs to `CANCELLATIONS`, handles payment refund/fail states |

### View
**`vw_provider_summary`** — Joins `SERVICE_PROVIDERS`, `USERS`, `SERVICES_OFFERED`, `SERVICE_CATEGORIES` to return `provider_id`, `username`, `full_name`, `category_name`, `rating_avg`, `jobs_completed` — the backbone of all provider listing queries.

---

## Backend API Reference

**Base URL:** `http://localhost:3000`

All responses follow this contract:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-friendly message" } }
```

### Auth Routes (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register as CUSTOMER or PROVIDER. Inserts into USERS + role table in one transaction. Bcrypt hashes password. |
| POST | `/api/auth/login` | Public | Validates credentials, checks `is_active`, returns 24h JWT containing `user_id`, `username`, `user_role`. Updates `last_login`. |

**Zod schemas enforced:**
- Register: `username` (min 3), `password` (min 6), `email`, `role` (CUSTOMER/PROVIDER), `firstName`, `lastName`, `phone?`
- Login: `username`, `password`

**Rate limiting:** Auth endpoints are protected by a separate, stricter limiter (20 req / 15 min) to prevent brute-force.

---

### Provider Routes (`/api/providers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/providers` | Public | All providers via `vw_provider_summary` |
| GET | `/api/providers/categories` | Public | All service categories |
| GET | `/api/providers/recommend/:area_id` | Public | Calls `fn_recommend_providers` — returns ranked providers for a given area |
| GET | `/api/providers/:id` | Public | Single provider: profile + availability + service areas + active services |
| GET | `/api/providers/my/slots` | PROVIDER | List the calling provider's availability slots |
| POST | `/api/providers/my/slots` | PROVIDER | Add a new weekly availability slot |
| DELETE | `/api/providers/my/slots/:slotId` | PROVIDER | Remove an availability slot |
| GET | `/api/providers/my/services` | PROVIDER | List the calling provider's offered services |
| POST | `/api/providers/my/services` | PROVIDER | Add a new service with category and hourly rate |
| DELETE | `/api/providers/my/services/:serviceId` | PROVIDER | Remove a service |

---

### Booking Routes (`/api/bookings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings/create` | CUSTOMER | Creates a booking via `sp_create_booking`. If no `addressId`, inserts a new address on the fly. Handles `ORA-20010` (slot occupied) and `ORA-20011` (out of range) errors gracefully. |
| GET | `/api/bookings/my` | CUSTOMER or PROVIDER | Returns bookings scoped to the caller's role. Joins BOOKINGS, SERVICES_OFFERED, SERVICE_PROVIDERS, CUSTOMERS, CUSTOMER_ADDRESSES, INVOICES, PAYMENTS. |
| GET | `/api/bookings/booked-slots/:providerId` | Public | Returns booked time ranges for a provider (used to disable slots in the booking wizard UI). |
| POST | `/api/bookings/complete/:id` | PROVIDER | Sets status to COMPLETED, then calls `sp_generate_invoice`. |
| POST | `/api/bookings/cancel/:id` | CUSTOMER or PROVIDER | Calls `sp_cancel_booking` with reason and caller role. |

---

### Invoice Routes (`/api/invoices`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/invoices/:booking_id` | Any (auth required) | Fetches invoice + payment details for a booking. |
| POST | `/api/invoices/:booking_id/pay` | Any (auth required) | Records payment as SUCCESS. Creates a new PAYMENTS row or updates existing one. Generates a `TXN_<timestamp>` transaction ID. |

---

### Reviews Routes (`/api/reviews`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews/:booking_id` | CUSTOMER | Submits a 1–5 star review + comment, only for COMPLETED bookings belonging to the caller. Unique constraint prevents double-reviews. `trg_update_provider_rating` fires on insert and updates provider stats automatically. |

---

### Admin Routes (`/api/admin`)
All endpoints require `ADMIN` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/revenue` | Revenue report: platform fee + gross value grouped by service category (completed bookings only) |
| GET | `/api/admin/error-logs` | All ERROR_LOGS entries ordered by timestamp descending |
| GET | `/api/admin/providers` | All providers with background check status |
| POST | `/api/admin/providers/:id/approve` | Sets `background_chk = 'APPROVED'` for a provider |

### Support Routes (`/api/support`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/support` | Customer/Provider | Submit a support ticket, optionally linked to a booking |
| GET | `/api/support/my` | Customer/Provider | List own tickets ordered by date |
| GET | `/api/support/admin` | Admin | All tickets ordered by status priority then date |
| PATCH | `/api/support/:id/status` | Admin | Advance ticket status: OPEN → IN_PROGRESS → RESOLVED → CLOSED |

### Feedback Routes (`/api/feedback`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/feedback` | Customer/Provider | Submit platform feedback with 1–5 star rating |
| GET | `/api/feedback/admin` | Admin | All feedback with aggregate stats (avg rating, response count, positive count) |

---

## Backend Middleware & Utilities

### `middleware/auth.js` — JWT Guard
Reads `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, attaches `req.user = { user_id, username, user_role }`. Returns 401 on missing/invalid token.

### `middleware/validate.js` — Zod Validation Factory
Higher-order function that wraps a Zod schema. On failure, returns 400 with an array of validation errors.

### `utils/errorMapper.js` — Oracle Error Translator
Maps raw `ORA-XXXXX` codes to user-friendly messages:
| Oracle Code | Meaning | Shown as |
|-------------|---------|---------|
| ORA-00001 | Unique constraint violated | "This information already exists (e.g., username or email)" |
| ORA-02291 | Foreign key not found | "Selection is invalid. Please ensure all related records exist." |
| ORA-02290 | Check constraint failed | "Information does not meet required format" |
| ORA-01722 | Invalid number | "Invalid numeric format. Please check your inputs." |
| ORA-01843/01861 | Invalid date | "Invalid date format. Please use the date picker." |
| ORA-00904 | Invalid column name | "Technical configuration issue. Contact support." |

### `db.js` — Connection Pool
Creates an `oracledb` connection pool on server startup (`poolMin=2`, `poolMax=10`, `poolIncrement=2`). Exposes `initializePool()` and `getConnection()`. All routes acquire a connection, use it, and always release it in a `finally` block.

---

## Frontend Architecture

### Authentication Flow (`AuthContext.jsx`)
- JWT stored in `localStorage` under key `marketplace_token`
- On app load, the token is decoded client-side (base64 `atob`) and expiry is checked
- `login(token)` — stores token, decodes payload, updates `user` state
- `logout()` — clears storage, nulls state
- `getToken()` — returns raw token for Axios interceptor

### Axios Instance (`api/axios.js`)
- Base URL: `http://localhost:3000`
- **Request interceptor**: attaches `Authorization: Bearer <token>` if token exists in localStorage
- **Response interceptor**: on 401, auto-clears token and redirects to `/login`

### Routing (`App.jsx`)
All routes go through `<ProtectedRoute allowedRoles={[...]}>` which redirects unauthenticated users to `/login` and wrong-role users to `/`.

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register/customer` | Register (CUSTOMER) | Public |
| `/register/provider` | Register (PROVIDER) | Public |
| `/customer/dashboard` | CustomerDashboard | CUSTOMER |
| `/customer/browse` | Browse | CUSTOMER |
| `/customer/book/:providerId` | BookingForm | CUSTOMER |
| `/customer/bookings` | MyBookings | CUSTOMER |
| `/customer/review/:bookingId` | ReviewForm | CUSTOMER |
| `/provider/dashboard` | ProviderDashboard | PROVIDER |
| `/provider/slots` | ManageSlots | PROVIDER |
| `/provider/services` | ManageServices | PROVIDER |
| `/provider/complete/:bookingId` | JobComplete | PROVIDER |
| `/admin/dashboard` | AdminDashboard | ADMIN |
| `/admin/errors` | ErrorLogs | ADMIN |

---

## Page & Component Reference

### Public Pages

**`Landing.jsx`** — ServeMart marketing page with:
- Animated hero with floating gradient orbs + CSS grid overlay
- Typewriter headline cycling through service types (Plumber, Electrician, Cleaner, Painter, Handyman)
- Service category pill grid (6 categories with hover glow effects)
- Live provider preview fetched from API (up to 6 cards) with shimmer loader
- "How it Works" 3-step section
- Provider recruitment CTA banner
- Footer with team attribution

**`Login.jsx`** — Username + password form. JWT stored on success, role-based redirect.

**`Register.jsx`** — Shared component for both roles. Fields adapt based on `type` prop (`CUSTOMER` or `PROVIDER`). Handles conflict (duplicate username/email) error display.

### Customer Pages

**`Dashboard.jsx`** — Personalized greeting, 3 stat cards (upcoming bookings, completed, available providers), quick category shortcuts, searchable provider grid.

**`Browse.jsx`** — Full provider directory with search + category filter, Leaflet map showing provider service areas.

**`BookingForm.jsx`** — 3-step booking wizard:
1. **Details**: Service selector, address entry, availability range picker, date picker (next 4 matching dates), 3-hour time slot grid (greyed-out booked slots fetched from `/api/bookings/booked-slots`)
2. **Payment**: CASH / UPI / CREDIT_CARD selection (simulated confirmation)
3. **Success**: Confirmation screen with redirect to My Bookings

**`MyBookings.jsx`** — Status-filtered booking list (ALL / PENDING / CONFIRMED / COMPLETED / CANCELLED). Per-booking actions: View Invoice (opens `InvoiceModal`), Cancel (modal with reason), Leave Review. Polling every 30 seconds.

**`ReviewForm.jsx`** — Star rating + comment form for completed bookings.

### Provider Pages

**`Dashboard.jsx`** — Booking list with tab filters, stat cards (Pending / Confirmed / Completed counts), "Mark Complete" button that calls `completeBooking()` → triggers `sp_generate_invoice`. Polling every 30 seconds.

**`ManageSlots.jsx`** — View weekly availability grid (card per slot with Available/Booked indicator). Form to add new slots (day of week + time range). Delete available slots.

**`ManageServices.jsx`** — List offered services. Add service (category, name, hourly rate). Delete services.

**`JobComplete.jsx`** — Confirmation page for completing a specific booking by ID.

### Admin Pages

**`Dashboard.jsx`** — 4 stat cards (Platform Revenue, Gross Value, Completed Bookings, Active Categories). Recharts `BarChart` with dual bars (Platform Fee + Gross Value) per category. Category breakdown table with average per booking.

**`ErrorLogs.jsx`** — Searchable error log list. Cards with left-border color-coded by severity (CRITICAL=purple, HIGH=red, MEDIUM=amber). Click to expand context info.

### Reusable Components

| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Responsive top bar with role-aware links, logout |
| `ProtectedRoute.jsx` | Redirects unauthenticated / wrong-role users |
| `BookingCard.jsx` | Booking list item with status badge, slot time, total, action buttons |
| `ProviderCard.jsx` | Provider card with rating stars, category badge, Book button |
| `InvoiceModal.jsx` | Full invoice breakdown: service fee, platform fee (10%), promo discount, tax (5%), net total. Payment status indicator. Browser print support. |
| `MapView.jsx` | Leaflet/OpenStreetMap map. Accepts `areas[]` (city names resolved to lat/lng) and optional `centerCity` for zoomed-in view with 8km radius circle. Covers 10 major Indian cities. |
| `StarRating.jsx` | Interactive 1–5 star selector |
| `CategoryGrid.jsx` | Reusable service category grid |
| `LoadingSpinner.jsx` | Centered spinner with optional label |
| `ErrorModal.jsx` | Reusable overlay modal for both errors and success messages |

---

## Design System

The frontend uses a custom CSS design system in `styles/global.css` and `styles/components.css`.

### CSS Custom Properties (Design Tokens)
```css
/* Colors */
--accent-violet: #7C3AED
--accent-mint: #00F5A0
--bg-primary: dark background
--bg-secondary: slightly lighter panel
--bg-card: glassmorphism card background
--border-subtle / --border-medium / --border-violet

/* Typography */
--font-primary: 'DM Sans'
--font-display: 'Syne'

/* Spacing / Radius */
--radius-md, --radius-lg, --radius-xl
```

### Animations
- `.animate-fade-up` — slide-in + fade entrance with `animation-delay` staggering
- `.shimmer` — skeleton loading pulse (for provider list skeletons)
- `float-a / float-b / float-c` — slow floating background orbs on hero sections
- `spin` — used on the Refresh button icon during loading

### Component Classes
`btn`, `btn-primary`, `btn-mint`, `btn-outline`, `btn-ghost`, `btn-danger`, `btn-success`, `btn-sm`, `btn-lg`, `card`, `stats-grid`, `stat-card`, `stat-icon`, `form-group`, `form-label`, `form-input`, `form-select`, `form-error`, `badge`, `badge-pending`, `badge-confirmed`, `badge-completed`, `badge-cancelled`, `booking-card`, `booking-card-header`, `booking-card-footer`, `modal-overlay`, `modal-box`, `search-bar`, `map-container`

---

## Security & Constraints for AI Agents

If you are an AI coding agent working on this project, adhere strictly to the following:

1. **Docker**: Oracle runs in Docker — if the container is stopped, run `docker start oracleXE`
2. **Oracle User**: Never run project SQL as the system user — always use `marketplace`. The command `ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE` was needed during initial setup due to CDB architecture.
3. **Bind Variables Only**: Never use string concatenation in SQL — always use numbered bind variables (`:1`, `:2`) or named binds in `oracledb`.
4. **Stored Procedures**: Must be called via `BEGIN sp_name(:p1, :p2); END;` syntax.
5. **Cursor Binds**: `fn_recommend_providers` returns a `SYS_REFCURSOR` — bind type must be `oracledb.CURSOR`.
6. **JWT Contents**: Tokens contain `{ user_id, username, user_role }` — use `req.user` (set by `middleware/auth.js`) for all authorization logic.
7. **Role Hierarchy**: `ADMIN > PROVIDER > CUSTOMER` — enforce role checks at route level, not just middleware.
8. **Connection Lifecycle**: Always acquire connection in `try`, release in `finally`. Never let connections leak.
9. **Rate Limits**: Auth endpoints are limited to 20 req/15min. General API is 500 req/15min (raised to handle dashboard polling).
10. **API Response Shape**: Always return `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`.

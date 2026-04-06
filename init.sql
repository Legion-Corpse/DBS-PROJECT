-- ============================================================================
-- ServeMart Marketplace -- Unified Database Initialization
-- Tables · Views · PL/SQL · Seed Data
-- ============================================================================
SET DEFINE OFF;

-- ─── 0. Clean slate ───────────────────────────────────────────────────────────
BEGIN
    FOR r IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'ERROR_LOGS','CANCELLATIONS','SUPPORT_TICKETS','REVIEWS','PAYMENTS',
        'INVOICES','BOOKINGS','PROMOTIONS','SERVICES_OFFERED','SERVICE_CATEGORIES',
        'PROVIDER_AVAILABILITY','PROVIDER_AREAS','SERVICE_AREAS','SERVICE_PROVIDERS',
        'CUSTOMER_ADDRESSES','CUSTOMERS','PLATFORM_FEEDBACK','USERS'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || r.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

BEGIN
    FOR r IN (SELECT object_name, object_type FROM user_objects
              WHERE object_type IN ('PROCEDURE','FUNCTION','TRIGGER','VIEW')
                AND object_name IN (
                    'SP_CREATE_BOOKING','SP_GENERATE_INVOICE','SP_CANCEL_BOOKING',
                    'FN_RECOMMEND_PROVIDERS','TRG_UPDATE_PROVIDER_RATING',
                    'VW_PROVIDER_SUMMARY'
                )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP ' || r.object_type || ' ' || r.object_name;
    END LOOP;
END;
/


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABLES  (created in FK dependency order)
-- ═══════════════════════════════════════════════════════════════════════════════

-- No dependencies -- created first so PL/SQL can always log errors
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

CREATE TABLE CUSTOMERS (
    customer_id NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     NUMBER        UNIQUE NOT NULL,
    first_name  VARCHAR2(50)  NOT NULL,
    last_name   VARCHAR2(50)  NOT NULL,
    phone       VARCHAR2(20),
    CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE CUSTOMER_ADDRESSES (
    address_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    NUMBER        NOT NULL,
    location_label VARCHAR2(50)  DEFAULT 'HOME',
    house_no       VARCHAR2(50)  NOT NULL,
    building_name  VARCHAR2(150),
    area_landmark  VARCHAR2(255) NOT NULL,
    city           VARCHAR2(100) NOT NULL,
    postal_code    NUMBER(10)    NOT NULL,
    CONSTRAINT fk_ca_cust FOREIGN KEY (customer_id)
        REFERENCES CUSTOMERS(customer_id) ON DELETE CASCADE
);

CREATE TABLE SERVICE_PROVIDERS (
    provider_id    NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        NUMBER       UNIQUE NOT NULL,
    first_name     VARCHAR2(50) NOT NULL,
    last_name      VARCHAR2(50) NOT NULL,
    phone          VARCHAR2(20),
    experience_yrs NUMBER       DEFAULT 0,
    background_chk VARCHAR2(20) DEFAULT 'PENDING'
                   CHECK (background_chk IN ('PENDING','APPROVED','REJECTED')),
    rating_avg     NUMBER(3,2)  DEFAULT 0.00,
    jobs_completed NUMBER       DEFAULT 0,
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE SERVICE_AREAS (
    area_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_name   VARCHAR2(100) NOT NULL,
    region_code VARCHAR2(50)  NOT NULL,
    CONSTRAINT uq_area UNIQUE (city_name, region_code)
);

CREATE TABLE PROVIDER_AREAS (
    provider_area_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id      NUMBER NOT NULL,
    area_id          NUMBER NOT NULL,
    CONSTRAINT fk_pa_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_area FOREIGN KEY (area_id)
        REFERENCES SERVICE_AREAS(area_id) ON DELETE CASCADE,
    CONSTRAINT uq_provider_area UNIQUE (provider_id, area_id)
);

CREATE TABLE PROVIDER_AVAILABILITY (
    availability_id NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id     NUMBER       NOT NULL,
    day_of_week     VARCHAR2(15) CHECK (day_of_week IN (
                        'MONDAY','TUESDAY','WEDNESDAY','THURSDAY',
                        'FRIDAY','SATURDAY','SUNDAY')),
    slot_start      DATE         NOT NULL,
    slot_end        DATE         NOT NULL,
    is_available    NUMBER(1,0)  DEFAULT 1 CHECK (is_available IN (0,1)),
    CONSTRAINT fk_pavail_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT chk_slot_order CHECK (slot_end > slot_start)
);

CREATE TABLE SERVICE_CATEGORIES (
    category_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR2(100) UNIQUE NOT NULL
);

CREATE TABLE SERVICES_OFFERED (
    service_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id  NUMBER        NOT NULL,
    category_id  NUMBER        NOT NULL,
    service_name VARCHAR2(100) NOT NULL,
    hourly_rate  NUMBER(10,2)  NOT NULL CHECK (hourly_rate >= 0),
    is_active    NUMBER(1,0)   DEFAULT 1 CHECK (is_active IN (0,1)),
    CONSTRAINT fk_so_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT fk_so_cat  FOREIGN KEY (category_id)
        REFERENCES SERVICE_CATEGORIES(category_id) ON DELETE CASCADE
);

CREATE TABLE PROMOTIONS (
    promo_id            NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    promo_code          VARCHAR2(20) UNIQUE NOT NULL,
    discount_percentage NUMBER(3,0)  NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    max_discount_amt    NUMBER(10,2) NOT NULL,
    min_order_amt       NUMBER(10,2) DEFAULT 0,
    valid_from          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valid_until         TIMESTAMP    NOT NULL,
    max_uses            NUMBER       DEFAULT 100,
    current_uses        NUMBER       DEFAULT 0,
    is_active           NUMBER(1,0)  DEFAULT 1 CHECK (is_active IN (0,1)),
    CONSTRAINT chk_promo_dates CHECK (valid_until > valid_from)
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
                    CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
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

CREATE TABLE INVOICES (
    invoice_id      NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id      NUMBER       UNIQUE NOT NULL,
    base_amount     NUMBER(10,2) NOT NULL,
    discount_amount NUMBER(10,2) DEFAULT 0,
    platform_fee    NUMBER(10,2) DEFAULT 0,
    tax_amount      NUMBER(10,2) DEFAULT 0,
    net_total       NUMBER(10,2) NOT NULL,
    generated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_inv_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE PAYMENTS (
    payment_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id     NUMBER        UNIQUE NOT NULL,
    amount_paid    NUMBER(10,2)  NOT NULL,
    payment_method VARCHAR2(50)  DEFAULT 'CASH'
                   CHECK (payment_method IN ('CASH','CREDIT_CARD','UPI','STRIPE')),
    payment_status VARCHAR2(20)  DEFAULT 'PENDING'
                   CHECK (payment_status IN ('PENDING','SUCCESS','COMPLETED','FAILED','REFUNDED')),
    transaction_id VARCHAR2(100),
    paid_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id)
        REFERENCES INVOICES(invoice_id) ON DELETE CASCADE
);

CREATE TABLE REVIEWS (
    review_id  NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id NUMBER       UNIQUE NOT NULL,
    rating     NUMBER(1,0)  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments   VARCHAR2(1000),
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_rev_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE CANCELLATIONS (
    cancellation_id NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id      NUMBER       UNIQUE NOT NULL,
    cancelled_by    VARCHAR2(10) CHECK (cancelled_by IN ('CUSTOMER','PROVIDER','SYSTEM')),
    reason          VARCHAR2(500),
    cancelled_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_can_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE SUPPORT_TICKETS (
    ticket_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id  NUMBER,
    user_id     NUMBER        NOT NULL,
    subject     VARCHAR2(200) NOT NULL,
    description VARCHAR2(2000),
    status      VARCHAR2(20)  DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tkt_bk   FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE SET NULL,
    CONSTRAINT fk_tkt_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE PLATFORM_FEEDBACK (
    feedback_id  NUMBER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      NUMBER      NOT NULL,
    rating       NUMBER(1,0) CHECK (rating BETWEEN 1 AND 5),
    comments     VARCHAR2(1000),
    submitted_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fb_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VIEW
-- ═══════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PL/SQL OBJECTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── sp_create_booking ────────────────────────────────────────────────────────
-- Creates a confirmed booking after validating the time window and checking for
-- overlapping bookings. Invalid/expired promo codes are silently ignored so the
-- booking can still proceed without a discount.

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

    -- 2. Validate requested time is within the provider's availability window
    SELECT TRUNC(p_date) + (TO_CHAR(slot_start, 'SSSSS') / 86400),
           TRUNC(p_date) + (TO_CHAR(slot_end,   'SSSSS') / 86400)
    INTO   v_range_start, v_range_end
    FROM   PROVIDER_AVAILABILITY
    WHERE  availability_id = p_avail_id;

    IF p_date < v_range_start OR (p_date + p_dur / 24) > v_range_end THEN
        RAISE_APPLICATION_ERROR(-20011,
            'Requested time is outside the provider''s available hours.');
    END IF;

    -- 3. Overlap check: reject if another active booking collides with this window
    SELECT COUNT(*) INTO v_overlap_count
    FROM   BOOKINGS b
    JOIN   SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE  so.provider_id = v_provider_id
      AND  b.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND  p_date                 < (b.scheduled_date + b.duration_hours / 24)
      AND  (p_date + p_dur / 24) >  b.scheduled_date;

    IF v_overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20010,
            'Time slot is already occupied by another booking.');
    END IF;

    -- 4. Validate and apply promo code (silently ignored if invalid or expired)
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


-- ─── sp_generate_invoice ──────────────────────────────────────────────────────
-- Called after a booking is marked COMPLETED.
-- Discount is capped at max_discount_amt from PROMOTIONS.
-- Platform fee = 10% of discounted amount. GST/tax = 5% of discounted amount.

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

    -- Apply promo discount if the booking used one, capped at max_discount_amt
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
    v_tax := ROUND((v_base - v_discount) * 0.05, 2);   -- 5%  GST
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


-- ─── sp_cancel_booking ────────────────────────────────────────────────────────
-- Cancels a booking, restores the availability slot, logs the reason, and
-- marks any SUCCESS/COMPLETED payment as REFUNDED.

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

    -- Mark payment as refunded if it was already paid
    BEGIN
        SELECT i.invoice_id, p.payment_status
        INTO   v_invoice_id, v_pay_status
        FROM   INVOICES  i
        JOIN   PAYMENTS  p ON p.invoice_id = i.invoice_id
        WHERE  i.booking_id = p_booking_id;

        IF v_pay_status IN ('SUCCESS', 'COMPLETED') THEN
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


-- ─── fn_recommend_providers ───────────────────────────────────────────────────
-- Returns a SYS_REFCURSOR of approved providers in a given service area,
-- ranked by composite score:
--   50% weight  -- rating_avg (0-5 scale)
--   30% weight  -- experience, capped at 100 jobs to level the field
--   20% baseline -- ensures new providers still appear in results

CREATE OR REPLACE FUNCTION fn_recommend_providers (
    p_area_id IN NUMBER
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT sp.provider_id,
               u.username,
               sp.first_name || ' ' || sp.last_name               AS full_name,
               sp.rating_avg,
               sp.jobs_completed,
               ROUND(
                   (sp.rating_avg * 0.5)
                   + (LEAST(sp.jobs_completed, 100) / 100.0 * 0.3)
                   + 0.2,
               2)                                                  AS score
        FROM   SERVICE_PROVIDERS sp
        JOIN   USERS          u  ON u.user_id     = sp.user_id
        JOIN   PROVIDER_AREAS pa ON pa.provider_id = sp.provider_id
        WHERE  pa.area_id         = p_area_id
          AND  sp.background_chk  = 'APPROVED'
          AND  u.is_active        = 1
        ORDER BY score DESC;

    RETURN v_cursor;
END fn_recommend_providers;
/


-- ─── trg_update_provider_rating ───────────────────────────────────────────────
-- COMPOUND trigger on REVIEWS.
-- AFTER EACH ROW   : collects affected provider IDs into a PL/SQL collection.
-- AFTER STATEMENT  : recalculates rating_avg (AVG of all review ratings) and
--                    jobs_completed (COUNT of COMPLETED bookings, not reviews)
--                    for every provider in the collection, then writes both back.

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════
-- All accounts use password: pass123
-- Hash: $2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u

INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('john_cust', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'john@gmail.com', 'CUSTOMER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('sara_cust', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'sara@gmail.com', 'CUSTOMER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('bob_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'bob@fixit.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('dave_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'dave@sparkworks.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('priya_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'priya@cleanpro.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('admin', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'admin@servemart.com', 'ADMIN');

INSERT INTO CUSTOMERS (user_id, first_name, last_name, phone) VALUES
    ((SELECT user_id FROM USERS WHERE username='john_cust'), 'John',  'Doe',   '9876543210');
INSERT INTO CUSTOMERS (user_id, first_name, last_name, phone) VALUES
    ((SELECT user_id FROM USERS WHERE username='sara_cust'), 'Sara',  'Mehta', '9123456780');

INSERT INTO CUSTOMER_ADDRESSES
    (customer_id, house_no, building_name, area_landmark, city, postal_code)
VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'),
    '12A', 'Greenview Apartments', 'Near City Mall', 'Mumbai', 400001
);
INSERT INTO CUSTOMER_ADDRESSES
    (customer_id, house_no, building_name, area_landmark, city, postal_code)
VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='sara_cust'),
    '7', 'Horizon Towers', 'Koramangala 5th Block', 'Bangalore', 560034
);

INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='bob_pro'),
        'Bob', 'Builder', 12, 'APPROVED', 4.50, 50);
INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='dave_pro'),
        'Dave', 'Spark', 8, 'APPROVED', 4.80, 37);
INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='priya_pro'),
        'Priya', 'Verma', 5, 'APPROVED', 4.90, 62);

INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Mumbai',    'MH');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Delhi',     'DL');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Bangalore', 'KA');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Hyderabad', 'TS');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Manipal',   'KA');

INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Mumbai'));
INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Bangalore'));
INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Bangalore'));

INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('PLUMBING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('ELECTRICAL');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('CLEANING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('PAINTING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('CARPENTRY');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('APPLIANCE REPAIR');

INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='PLUMBING'),
    'Pipe Leak Fix', 350.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='PLUMBING'),
    'Bathroom Fitting', 500.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='ELECTRICAL'),
    'Wiring & Rewiring', 400.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='ELECTRICAL'),
    'Ceiling Fan Installation', 250.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='CLEANING'),
    'Deep Home Cleaning', 300.00);

INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    'MONDAY',
    TO_DATE('2000-01-01 09:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 17:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    'WEDNESDAY',
    TO_DATE('2000-01-01 09:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 17:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    'TUESDAY',
    TO_DATE('2000-01-01 10:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 18:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    'THURSDAY',
    TO_DATE('2000-01-01 10:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 18:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    'SATURDAY',
    TO_DATE('2000-01-01 08:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 16:00','YYYY-MM-DD HH24:MI'));

INSERT INTO PROMOTIONS
    (promo_code, discount_percentage, max_discount_amt, min_order_amt, valid_until)
VALUES ('SAVE10', 10, 150.00, 200.00, SYSDATE + 365);
INSERT INTO PROMOTIONS
    (promo_code, discount_percentage, max_discount_amt, min_order_amt, valid_until)
VALUES ('WELCOME20', 20, 200.00, 300.00, SYSDATE + 365);

-- Demo: completed booking with invoice, payment, and review (full flow)
INSERT INTO BOOKINGS (
    customer_id, service_id, address_id, availability_id,
    scheduled_date, duration_hours, status
) VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'),
    (SELECT service_id FROM SERVICES_OFFERED
     WHERE service_name='Pipe Leak Fix' FETCH FIRST 1 ROW ONLY),
    (SELECT ca.address_id FROM CUSTOMER_ADDRESSES ca
     JOIN CUSTOMERS c ON ca.customer_id=c.customer_id
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'
     FETCH FIRST 1 ROW ONLY),
    (SELECT availability_id FROM PROVIDER_AVAILABILITY
     WHERE day_of_week='MONDAY' FETCH FIRST 1 ROW ONLY),
    CURRENT_TIMESTAMP - INTERVAL '3' DAY,
    2.0, 'COMPLETED'
);

INSERT INTO INVOICES
    (booking_id, base_amount, discount_amount, platform_fee, tax_amount, net_total)
VALUES
    ((SELECT MAX(booking_id) FROM BOOKINGS), 700.00, 0.00, 70.00, 35.00, 805.00);

INSERT INTO PAYMENTS
    (invoice_id, amount_paid, payment_method, payment_status, transaction_id)
VALUES
    ((SELECT MAX(invoice_id) FROM INVOICES), 805.00, 'UPI', 'SUCCESS', 'TXN_DEMO_001');

INSERT INTO REVIEWS (booking_id, rating, comments)
VALUES (
    (SELECT MAX(booking_id) FROM BOOKINGS),
    5, 'Excellent work, very professional and on time!'
);

COMMIT;
-- ============================================================================
-- ServeMart Marketplace -- Unified Database Initialization
-- Tables · Views · PL/SQL · Seed Data
-- ============================================================================
SET DEFINE OFF;

-- ─── 0. Clean slate ───────────────────────────────────────────────────────────
BEGIN
    FOR r IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'ERROR_LOGS','CANCELLATIONS','SUPPORT_TICKETS','REVIEWS','PAYMENTS',
        'INVOICES','BOOKINGS','PROMOTIONS','SERVICES_OFFERED','SERVICE_CATEGORIES',
        'PROVIDER_AVAILABILITY','PROVIDER_AREAS','SERVICE_AREAS','SERVICE_PROVIDERS',
        'CUSTOMER_ADDRESSES','CUSTOMERS','PLATFORM_FEEDBACK','USERS'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || r.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

BEGIN
    FOR r IN (SELECT object_name, object_type FROM user_objects
              WHERE object_type IN ('PROCEDURE','FUNCTION','TRIGGER','VIEW')
                AND object_name IN (
                    'SP_CREATE_BOOKING','SP_GENERATE_INVOICE','SP_CANCEL_BOOKING',
                    'FN_RECOMMEND_PROVIDERS','TRG_UPDATE_PROVIDER_RATING',
                    'VW_PROVIDER_SUMMARY'
                )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP ' || r.object_type || ' ' || r.object_name;
    END LOOP;
END;
/


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABLES  (created in FK dependency order)
-- ═══════════════════════════════════════════════════════════════════════════════

-- No dependencies -- created first so PL/SQL can always log errors
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

CREATE TABLE CUSTOMERS (
    customer_id NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     NUMBER        UNIQUE NOT NULL,
    first_name  VARCHAR2(50)  NOT NULL,
    last_name   VARCHAR2(50)  NOT NULL,
    phone       VARCHAR2(20),
    CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE CUSTOMER_ADDRESSES (
    address_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    NUMBER        NOT NULL,
    location_label VARCHAR2(50)  DEFAULT 'HOME',
    house_no       VARCHAR2(50)  NOT NULL,
    building_name  VARCHAR2(150),
    area_landmark  VARCHAR2(255) NOT NULL,
    city           VARCHAR2(100) NOT NULL,
    postal_code    NUMBER(10)    NOT NULL,
    CONSTRAINT fk_ca_cust FOREIGN KEY (customer_id)
        REFERENCES CUSTOMERS(customer_id) ON DELETE CASCADE
);

CREATE TABLE SERVICE_PROVIDERS (
    provider_id    NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        NUMBER       UNIQUE NOT NULL,
    first_name     VARCHAR2(50) NOT NULL,
    last_name      VARCHAR2(50) NOT NULL,
    phone          VARCHAR2(20),
    experience_yrs NUMBER       DEFAULT 0,
    background_chk VARCHAR2(20) DEFAULT 'PENDING'
                   CHECK (background_chk IN ('PENDING','APPROVED','REJECTED')),
    rating_avg     NUMBER(3,2)  DEFAULT 0.00,
    jobs_completed NUMBER       DEFAULT 0,
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE SERVICE_AREAS (
    area_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_name   VARCHAR2(100) NOT NULL,
    region_code VARCHAR2(50)  NOT NULL,
    CONSTRAINT uq_area UNIQUE (city_name, region_code)
);

CREATE TABLE PROVIDER_AREAS (
    provider_area_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id      NUMBER NOT NULL,
    area_id          NUMBER NOT NULL,
    CONSTRAINT fk_pa_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_area FOREIGN KEY (area_id)
        REFERENCES SERVICE_AREAS(area_id) ON DELETE CASCADE,
    CONSTRAINT uq_provider_area UNIQUE (provider_id, area_id)
);

CREATE TABLE PROVIDER_AVAILABILITY (
    availability_id NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id     NUMBER       NOT NULL,
    day_of_week     VARCHAR2(15) CHECK (day_of_week IN (
                        'MONDAY','TUESDAY','WEDNESDAY','THURSDAY',
                        'FRIDAY','SATURDAY','SUNDAY')),
    slot_start      DATE         NOT NULL,
    slot_end        DATE         NOT NULL,
    is_available    NUMBER(1,0)  DEFAULT 1 CHECK (is_available IN (0,1)),
    CONSTRAINT fk_pavail_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT chk_slot_order CHECK (slot_end > slot_start)
);

CREATE TABLE SERVICE_CATEGORIES (
    category_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR2(100) UNIQUE NOT NULL
);

CREATE TABLE SERVICES_OFFERED (
    service_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id  NUMBER        NOT NULL,
    category_id  NUMBER        NOT NULL,
    service_name VARCHAR2(100) NOT NULL,
    hourly_rate  NUMBER(10,2)  NOT NULL CHECK (hourly_rate >= 0),
    is_active    NUMBER(1,0)   DEFAULT 1 CHECK (is_active IN (0,1)),
    CONSTRAINT fk_so_prov FOREIGN KEY (provider_id)
        REFERENCES SERVICE_PROVIDERS(provider_id) ON DELETE CASCADE,
    CONSTRAINT fk_so_cat  FOREIGN KEY (category_id)
        REFERENCES SERVICE_CATEGORIES(category_id) ON DELETE CASCADE
);

CREATE TABLE PROMOTIONS (
    promo_id            NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    promo_code          VARCHAR2(20) UNIQUE NOT NULL,
    discount_percentage NUMBER(3,0)  NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    max_discount_amt    NUMBER(10,2) NOT NULL,
    min_order_amt       NUMBER(10,2) DEFAULT 0,
    valid_from          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valid_until         TIMESTAMP    NOT NULL,
    max_uses            NUMBER       DEFAULT 100,
    current_uses        NUMBER       DEFAULT 0,
    is_active           NUMBER(1,0)  DEFAULT 1 CHECK (is_active IN (0,1)),
    CONSTRAINT chk_promo_dates CHECK (valid_until > valid_from)
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
                    CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
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

CREATE TABLE INVOICES (
    invoice_id      NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id      NUMBER       UNIQUE NOT NULL,
    base_amount     NUMBER(10,2) NOT NULL,
    discount_amount NUMBER(10,2) DEFAULT 0,
    platform_fee    NUMBER(10,2) DEFAULT 0,
    tax_amount      NUMBER(10,2) DEFAULT 0,
    net_total       NUMBER(10,2) NOT NULL,
    generated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_inv_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE PAYMENTS (
    payment_id     NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id     NUMBER        UNIQUE NOT NULL,
    amount_paid    NUMBER(10,2)  NOT NULL,
    payment_method VARCHAR2(50)  DEFAULT 'CASH'
                   CHECK (payment_method IN ('CASH','CREDIT_CARD','UPI','STRIPE')),
    payment_status VARCHAR2(20)  DEFAULT 'PENDING'
                   CHECK (payment_status IN ('PENDING','SUCCESS','COMPLETED','FAILED','REFUNDED')),
    transaction_id VARCHAR2(100),
    paid_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id)
        REFERENCES INVOICES(invoice_id) ON DELETE CASCADE
);

CREATE TABLE REVIEWS (
    review_id  NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id NUMBER       UNIQUE NOT NULL,
    rating     NUMBER(1,0)  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments   VARCHAR2(1000),
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_rev_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE CANCELLATIONS (
    cancellation_id NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id      NUMBER       UNIQUE NOT NULL,
    cancelled_by    VARCHAR2(10) CHECK (cancelled_by IN ('CUSTOMER','PROVIDER','SYSTEM')),
    reason          VARCHAR2(500),
    cancelled_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_can_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);

CREATE TABLE SUPPORT_TICKETS (
    ticket_id   NUMBER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id  NUMBER,
    user_id     NUMBER        NOT NULL,
    subject     VARCHAR2(200) NOT NULL,
    description VARCHAR2(2000),
    status      VARCHAR2(20)  DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tkt_bk   FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE SET NULL,
    CONSTRAINT fk_tkt_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE PLATFORM_FEEDBACK (
    feedback_id  NUMBER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      NUMBER      NOT NULL,
    rating       NUMBER(1,0) CHECK (rating BETWEEN 1 AND 5),
    comments     VARCHAR2(1000),
    submitted_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fb_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VIEW
-- ═══════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PL/SQL OBJECTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── sp_create_booking ────────────────────────────────────────────────────────
-- Creates a confirmed booking after validating the time window and checking for
-- overlapping bookings. Invalid/expired promo codes are silently ignored so the
-- booking can still proceed without a discount.

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

    -- 2. Validate requested time is within the provider's availability window
    SELECT TRUNC(p_date) + (TO_CHAR(slot_start, 'SSSSS') / 86400),
           TRUNC(p_date) + (TO_CHAR(slot_end,   'SSSSS') / 86400)
    INTO   v_range_start, v_range_end
    FROM   PROVIDER_AVAILABILITY
    WHERE  availability_id = p_avail_id;

    IF p_date < v_range_start OR (p_date + p_dur / 24) > v_range_end THEN
        RAISE_APPLICATION_ERROR(-20011,
            'Requested time is outside the provider''s available hours.');
    END IF;

    -- 3. Overlap check: reject if another active booking collides with this window
    SELECT COUNT(*) INTO v_overlap_count
    FROM   BOOKINGS b
    JOIN   SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE  so.provider_id = v_provider_id
      AND  b.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND  p_date                 < (b.scheduled_date + b.duration_hours / 24)
      AND  (p_date + p_dur / 24) >  b.scheduled_date;

    IF v_overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20010,
            'Time slot is already occupied by another booking.');
    END IF;

    -- 4. Validate and apply promo code (silently ignored if invalid or expired)
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


-- ─── sp_generate_invoice ──────────────────────────────────────────────────────
-- Called after a booking is marked COMPLETED.
-- Discount is capped at max_discount_amt from PROMOTIONS.
-- Platform fee = 10% of discounted amount. GST/tax = 5% of discounted amount.

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

    -- Apply promo discount if the booking used one, capped at max_discount_amt
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
    v_tax := ROUND((v_base - v_discount) * 0.05, 2);   -- 5%  GST
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


-- ─── sp_cancel_booking ────────────────────────────────────────────────────────
-- Cancels a booking, restores the availability slot, logs the reason, and
-- marks any SUCCESS/COMPLETED payment as REFUNDED.

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

    -- Mark payment as refunded if it was already paid
    BEGIN
        SELECT i.invoice_id, p.payment_status
        INTO   v_invoice_id, v_pay_status
        FROM   INVOICES  i
        JOIN   PAYMENTS  p ON p.invoice_id = i.invoice_id
        WHERE  i.booking_id = p_booking_id;

        IF v_pay_status IN ('SUCCESS', 'COMPLETED') THEN
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


-- ─── fn_recommend_providers ───────────────────────────────────────────────────
-- Returns a SYS_REFCURSOR of approved providers in a given service area,
-- ranked by composite score:
--   50% weight  -- rating_avg (0-5 scale)
--   30% weight  -- experience, capped at 100 jobs to level the field
--   20% baseline -- ensures new providers still appear in results

CREATE OR REPLACE FUNCTION fn_recommend_providers (
    p_area_id IN NUMBER
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT sp.provider_id,
               u.username,
               sp.first_name || ' ' || sp.last_name               AS full_name,
               sp.rating_avg,
               sp.jobs_completed,
               ROUND(
                   (sp.rating_avg * 0.5)
                   + (LEAST(sp.jobs_completed, 100) / 100.0 * 0.3)
                   + 0.2,
               2)                                                  AS score
        FROM   SERVICE_PROVIDERS sp
        JOIN   USERS          u  ON u.user_id     = sp.user_id
        JOIN   PROVIDER_AREAS pa ON pa.provider_id = sp.provider_id
        WHERE  pa.area_id         = p_area_id
          AND  sp.background_chk  = 'APPROVED'
          AND  u.is_active        = 1
        ORDER BY score DESC;

    RETURN v_cursor;
END fn_recommend_providers;
/


-- ─── trg_update_provider_rating ───────────────────────────────────────────────
-- COMPOUND trigger on REVIEWS.
-- AFTER EACH ROW   : collects affected provider IDs into a PL/SQL collection.
-- AFTER STATEMENT  : recalculates rating_avg (AVG of all review ratings) and
--                    jobs_completed (COUNT of COMPLETED bookings, not reviews)
--                    for every provider in the collection, then writes both back.

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════
-- All accounts use password: pass123
-- Hash: $2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u

INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('john_cust', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'john@gmail.com', 'CUSTOMER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('sara_cust', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'sara@gmail.com', 'CUSTOMER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('bob_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'bob@fixit.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('dave_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'dave@sparkworks.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('priya_pro', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'priya@cleanpro.com', 'PROVIDER');
INSERT INTO USERS (username, password_hash, email, user_role) VALUES
    ('admin', '$2b$10$1NXJ.hgCPrNkkyOCVs23KuDurRMdk.3zsIZQX2qnYUmijplcS.t7u',
     'admin@servemart.com', 'ADMIN');

INSERT INTO CUSTOMERS (user_id, first_name, last_name, phone) VALUES
    ((SELECT user_id FROM USERS WHERE username='john_cust'), 'John',  'Doe',   '9876543210');
INSERT INTO CUSTOMERS (user_id, first_name, last_name, phone) VALUES
    ((SELECT user_id FROM USERS WHERE username='sara_cust'), 'Sara',  'Mehta', '9123456780');

INSERT INTO CUSTOMER_ADDRESSES
    (customer_id, house_no, building_name, area_landmark, city, postal_code)
VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'),
    '12A', 'Greenview Apartments', 'Near City Mall', 'Mumbai', 400001
);
INSERT INTO CUSTOMER_ADDRESSES
    (customer_id, house_no, building_name, area_landmark, city, postal_code)
VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='sara_cust'),
    '7', 'Horizon Towers', 'Koramangala 5th Block', 'Bangalore', 560034
);

INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='bob_pro'),
        'Bob', 'Builder', 12, 'APPROVED', 4.50, 50);
INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='dave_pro'),
        'Dave', 'Spark', 8, 'APPROVED', 4.80, 37);
INSERT INTO SERVICE_PROVIDERS
    (user_id, first_name, last_name, experience_yrs, background_chk, rating_avg, jobs_completed)
VALUES ((SELECT user_id FROM USERS WHERE username='priya_pro'),
        'Priya', 'Verma', 5, 'APPROVED', 4.90, 62);

INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Mumbai',    'MH');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Delhi',     'DL');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Bangalore', 'KA');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Hyderabad', 'TS');
INSERT INTO SERVICE_AREAS (city_name, region_code) VALUES ('Manipal',   'KA');

INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Mumbai'));
INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Bangalore'));
INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp
     JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    (SELECT area_id FROM SERVICE_AREAS WHERE city_name='Bangalore'));

INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('PLUMBING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('ELECTRICAL');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('CLEANING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('PAINTING');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('CARPENTRY');
INSERT INTO SERVICE_CATEGORIES (category_name) VALUES ('APPLIANCE REPAIR');

INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='PLUMBING'),
    'Pipe Leak Fix', 350.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='PLUMBING'),
    'Bathroom Fitting', 500.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='ELECTRICAL'),
    'Wiring & Rewiring', 400.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='ELECTRICAL'),
    'Ceiling Fan Installation', 250.00);
INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    (SELECT category_id FROM SERVICE_CATEGORIES WHERE category_name='CLEANING'),
    'Deep Home Cleaning', 300.00);

INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    'MONDAY',
    TO_DATE('2000-01-01 09:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 17:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='bob_pro'),
    'WEDNESDAY',
    TO_DATE('2000-01-01 09:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 17:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    'TUESDAY',
    TO_DATE('2000-01-01 10:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 18:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='dave_pro'),
    'THURSDAY',
    TO_DATE('2000-01-01 10:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 18:00','YYYY-MM-DD HH24:MI'));
INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end) VALUES (
    (SELECT sp.provider_id FROM SERVICE_PROVIDERS sp JOIN USERS u ON sp.user_id=u.user_id WHERE u.username='priya_pro'),
    'SATURDAY',
    TO_DATE('2000-01-01 08:00','YYYY-MM-DD HH24:MI'),
    TO_DATE('2000-01-01 16:00','YYYY-MM-DD HH24:MI'));

INSERT INTO PROMOTIONS
    (promo_code, discount_percentage, max_discount_amt, min_order_amt, valid_until)
VALUES ('SAVE10', 10, 150.00, 200.00, SYSDATE + 365);
INSERT INTO PROMOTIONS
    (promo_code, discount_percentage, max_discount_amt, min_order_amt, valid_until)
VALUES ('WELCOME20', 20, 200.00, 300.00, SYSDATE + 365);

-- Demo: completed booking with invoice, payment, and review (full flow)
INSERT INTO BOOKINGS (
    customer_id, service_id, address_id, availability_id,
    scheduled_date, duration_hours, status
) VALUES (
    (SELECT c.customer_id FROM CUSTOMERS c
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'),
    (SELECT service_id FROM SERVICES_OFFERED
     WHERE service_name='Pipe Leak Fix' FETCH FIRST 1 ROW ONLY),
    (SELECT ca.address_id FROM CUSTOMER_ADDRESSES ca
     JOIN CUSTOMERS c ON ca.customer_id=c.customer_id
     JOIN USERS u ON c.user_id=u.user_id WHERE u.username='john_cust'
     FETCH FIRST 1 ROW ONLY),
    (SELECT availability_id FROM PROVIDER_AVAILABILITY
     WHERE day_of_week='MONDAY' FETCH FIRST 1 ROW ONLY),
    CURRENT_TIMESTAMP - INTERVAL '3' DAY,
    2.0, 'COMPLETED'
);

INSERT INTO INVOICES
    (booking_id, base_amount, discount_amount, platform_fee, tax_amount, net_total)
VALUES
    ((SELECT MAX(booking_id) FROM BOOKINGS), 700.00, 0.00, 70.00, 35.00, 805.00);

INSERT INTO PAYMENTS
    (invoice_id, amount_paid, payment_method, payment_status, transaction_id)
VALUES
    ((SELECT MAX(invoice_id) FROM INVOICES), 805.00, 'UPI', 'SUCCESS', 'TXN_DEMO_001');

INSERT INTO REVIEWS (booking_id, rating, comments)
VALUES (
    (SELECT MAX(booking_id) FROM BOOKINGS),
    5, 'Excellent work, very professional and on time!'
);

COMMIT;

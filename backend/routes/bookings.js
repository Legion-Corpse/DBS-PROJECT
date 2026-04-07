const express = require('express');
const oracledb = require('oracledb');
const { z } = require('zod');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const db = require('../db');
const { mapDatabaseError } = require('../utils/errorMapper');

const router = express.Router();

const createBookingSchema = z.object({
    serviceId: z.number().int().positive(),
    addressId: z.number().int().positive().optional(),
    houseNo: z.string().optional(),
    buildingName: z.string().optional(),
    areaLandmark: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.number().int().positive(),
    availabilityId: z.number().int().positive(),
    promoCode: z.string().optional().nullable(),
    scheduledDate: z.string().datetime(), // ISO 8601 string
    durationHours: z.number().positive()
}).refine(data => data.addressId || (data.houseNo && data.areaLandmark && data.city && data.postalCode), {
    message: "Either addressId or (houseNo, areaLandmark, city and postalCode) must be provided."
});

router.post('/create', requireAuth, validate(createBookingSchema), async (req, res) => {
    if (req.user.user_role !== 'CUSTOMER') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only customers can create bookings' } });
    }
    
    let connection;
    try {
        const { serviceId, availabilityId, promoCode, scheduledDate, durationHours, houseNo, buildingName, areaLandmark, city, postalCode } = req.body;
        let addressId = req.body.addressId;
        
        connection = await db.getConnection();
        
        const custResult = await connection.execute(
            `SELECT customer_id FROM CUSTOMERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        
        if (custResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer record not found for user' } });
        }
        let customerId = custResult.rows[0][0];

        if (!addressId) {
            const addrRes = await connection.execute(
                `INSERT INTO CUSTOMER_ADDRESSES (customer_id, location_label, house_no, building_name, area_landmark, city, postal_code)
                 VALUES (:1, 'Home', :2, :3, :4, :5, :6) RETURNING address_id INTO :7`,
                [customerId, houseNo, buildingName || null, areaLandmark, city, postalCode || null, { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }]
            );
            addressId = addrRes.outBinds[0][0];
        }

        const sDate = new Date(scheduledDate);

        await connection.execute(
            `BEGIN
                sp_create_booking(:p_cust_id, :p_srvc_id, :p_addr_id, :p_avail_id, :p_promo_code, :p_date, :p_dur);
             END;`,
            {
                p_cust_id: customerId,
                p_srvc_id: serviceId,
                p_addr_id: addressId,
                p_avail_id: availabilityId,
                p_promo_code: promoCode || null,
                p_date: sDate,
                p_dur: durationHours
            },
            { autoCommit: true }
        );

        res.json({ success: true, data: { message: 'Booking created successfully' } });
    } catch (err) {
        console.error(err);
        const isOccupied = err.message && err.message.includes('ORA-20010');
        const isOutOfRange = err.message && err.message.includes('ORA-20011');
        if (isOccupied) {
            return res.status(409).json({ success: false, error: { code: 'SLOT_OCCUPIED', message: 'This time slot is already taken. Please choose a different time.' } });
        }
        if (isOutOfRange) {
            return res.status(400).json({ success: false, error: { code: 'OUT_OF_RANGE', message: 'The selected time is outside the provider\'s available hours.' } });
        }
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// Validates a promo code and returns discount info
router.get('/validate-promo', requireAuth, async (req, res) => {
    const code = (req.query.code || '').trim();
    if (!code) {
        return res.status(400).json({ success: false, error: { message: 'code is required' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT discount_percentage, max_discount_amt, min_order_amt
             FROM PROMOTIONS
             WHERE UPPER(promo_code) = UPPER(:1)
               AND is_active = 1
               AND valid_until > CURRENT_TIMESTAMP
               AND current_uses < max_uses`,
            [code],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invalid or expired promo code' } });
        }
        const p = result.rows[0];
        res.json({ success: true, data: {
            discountPercentage: p.DISCOUNT_PERCENTAGE,
            maxDiscountAmt: p.MAX_DISCOUNT_AMT,
            minOrderAmt: p.MIN_ORDER_AMT
        }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// Returns booked time ranges for a provider so the UI can disable occupied slots
router.get('/booked-slots/:providerId', async (req, res) => {
    let connection;
    try {
        const providerId = Number(req.params.providerId);
        if (isNaN(providerId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid provider ID' } });
        }
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT 
                TO_CHAR(b.scheduled_date, 'YYYY-MM-DD') AS booking_date,
                TO_NUMBER(TO_CHAR(b.scheduled_date, 'HH24')) AS start_hour,
                TO_NUMBER(TO_CHAR(b.scheduled_date + b.duration_hours/24, 'HH24')) AS end_hour
             FROM BOOKINGS b
             JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
             WHERE so.provider_id = :1
               AND b.status IN ('PENDING', 'CONFIRMED')
               AND b.scheduled_date >= TRUNC(SYSDATE)
             ORDER BY b.scheduled_date`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// Returns the city from the customer's most recently used booking address
// Used by the customer dashboard to auto-detect location for recommendations
router.get('/my-city', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'CUSTOMER') {
        return res.status(403).json({ success: false, error: { message: 'Customers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ca.city
             FROM CUSTOMER_ADDRESSES ca
             JOIN BOOKINGS b ON b.address_id = ca.address_id
             JOIN CUSTOMERS c ON b.customer_id = c.customer_id
             WHERE c.user_id = :1
             ORDER BY b.created_at DESC
             FETCH FIRST 1 ROW ONLY`,
            [req.user.user_id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const city = result.rows.length > 0 ? result.rows[0].CITY : null;
        res.json({ success: true, data: { city } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.get('/my', requireAuth, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        let query = `
            SELECT
                b.booking_id,
                so.service_name,
                sp.first_name || ' ' || sp.last_name AS provider,
                cu.first_name || ' ' || cu.last_name AS customer_name,
                ca.house_no || NVL2(ca.building_name, ', ' || ca.building_name, '') || ', ' || ca.area_landmark || ', ' || ca.city AS location,
                b.scheduled_date,
                TO_CHAR(b.scheduled_date, 'HH24:MI') AS slot_start,
                TO_CHAR(b.scheduled_date + b.duration_hours/24, 'HH24:MI') AS slot_end,
                b.status,
                i.net_total,
                py.payment_status,
                cn.reason AS cancellation_reason
            FROM BOOKINGS b
            JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
            JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
            JOIN CUSTOMERS cu ON b.customer_id = cu.customer_id
            JOIN CUSTOMER_ADDRESSES ca ON b.address_id = ca.address_id
            LEFT JOIN INVOICES i ON b.booking_id = i.booking_id
            LEFT JOIN PAYMENTS py ON i.invoice_id = py.invoice_id
            LEFT JOIN CANCELLATIONS cn ON b.booking_id = cn.booking_id
        `;
        
        let whereClause = "";
        let binds = [req.user.user_id];
        
        if (req.user.user_role === 'CUSTOMER') {
            whereClause = "WHERE cu.user_id = :1";
        } else if (req.user.user_role === 'PROVIDER') {
            whereClause = "WHERE sp.user_id = :1";
        } else {
            return res.status(403).json({ success: false, error: { message: 'Unauthorized role' } });
        }
        
        const result = await connection.execute(
            query + whereClause + " ORDER BY b.scheduled_date DESC",
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

router.post('/complete/:id', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only providers can complete bookings' } });
    }

    let connection;
    try {
        const bookingId = req.params.id;
        connection = await db.getConnection();

        // Verify this booking belongs to the requesting provider
        const ownerCheck = await connection.execute(
            `SELECT b.booking_id FROM BOOKINGS b
             JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
             JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
             WHERE b.booking_id = :1 AND sp.user_id = :2`,
            [bookingId, req.user.user_id]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Booking not found or does not belong to you' } });
        }

        // Update status and generate invoice (sp_generate_invoice commits internally)
        await connection.execute(
            `UPDATE BOOKINGS SET status = 'COMPLETED' WHERE booking_id = :1`,
            [bookingId],
            { autoCommit: false }
        );

        await connection.execute(
            `BEGIN sp_generate_invoice(:p_booking_id); END;`,
            { p_booking_id: bookingId },
            { autoCommit: false }
        );
        // sp_generate_invoice issues an internal COMMIT, so both the UPDATE and
        // the invoice INSERT are already persisted at this point.

        // Auto-create a payment record so the customer doesn't need to pay via invoice
        const invRow = await connection.execute(
            `SELECT invoice_id, net_total FROM INVOICES WHERE booking_id = :1`,
            [bookingId]
        );
        if (invRow.rows.length > 0) {
            const [invoiceId, netTotal] = invRow.rows[0];
            const validMethods = ['CASH', 'UPI', 'CREDIT_CARD'];
            const method = validMethods.includes(req.body.paymentMethod) ? req.body.paymentMethod : 'CASH';
            await connection.execute(
                `INSERT INTO PAYMENTS (invoice_id, amount_paid, payment_method, payment_status, transaction_id)
                 VALUES (:1, :2, :3, 'SUCCESS', :4)`,
                [invoiceId, netTotal, method, `TXN_${Date.now()}`],
                { autoCommit: true }
            );
        }

        res.json({ success: true, data: { message: 'Booking completed and invoice generated' } });
    } catch (err) {
        if (connection) { try { await connection.rollback(); } catch (e) {} }
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

const cancelSchema = z.object({
    reason: z.string().min(1)
});

router.post('/cancel/:id', requireAuth, validate(cancelSchema), async (req, res) => {
    let connection;
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;
        const role = req.user.user_role;

        if (role !== 'CUSTOMER' && role !== 'PROVIDER') {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only customers or providers can cancel bookings' } });
        }

        connection = await db.getConnection();

        // Verify the booking belongs to the requesting user
        let ownerQuery, ownerBinds;
        if (role === 'CUSTOMER') {
            ownerQuery = `SELECT b.booking_id FROM BOOKINGS b
                          JOIN CUSTOMERS c ON b.customer_id = c.customer_id
                          WHERE b.booking_id = :1 AND c.user_id = :2`;
            ownerBinds = [bookingId, req.user.user_id];
        } else {
            ownerQuery = `SELECT b.booking_id FROM BOOKINGS b
                          JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
                          JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
                          WHERE b.booking_id = :1 AND sp.user_id = :2`;
            ownerBinds = [bookingId, req.user.user_id];
        }

        const ownerCheck = await connection.execute(ownerQuery, ownerBinds);
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Booking not found or does not belong to you' } });
        }

        await connection.execute(
            `BEGIN sp_cancel_booking(:p_booking_id, :p_cancelled_by, :p_reason); END;`,
            {
                p_booking_id: bookingId,
                p_cancelled_by: role,
                p_reason: reason
            },
            { autoCommit: true }
        );

        res.json({ success: true, data: { message: 'Booking cancelled successfully' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;

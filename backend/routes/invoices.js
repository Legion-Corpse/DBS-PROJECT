const express = require('express');
const oracledb = require('oracledb');
const requireAuth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.get('/:booking_id', requireAuth, async (req, res) => {
    let connection;
    try {
        const bookingId = req.params.booking_id;
        connection = await db.getConnection();

        // Verify caller owns this booking
        let ownerQuery;
        if (req.user.user_role === 'CUSTOMER') {
            ownerQuery = await connection.execute(
                `SELECT b.booking_id FROM BOOKINGS b
                 JOIN CUSTOMERS c ON b.customer_id = c.customer_id
                 WHERE b.booking_id = :1 AND c.user_id = :2`,
                [bookingId, req.user.user_id]
            );
        } else if (req.user.user_role === 'PROVIDER') {
            ownerQuery = await connection.execute(
                `SELECT b.booking_id FROM BOOKINGS b
                 JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
                 JOIN SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
                 WHERE b.booking_id = :1 AND sp.user_id = :2`,
                [bookingId, req.user.user_id]
            );
        } else if (req.user.user_role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }
        if (req.user.user_role !== 'ADMIN' && ownerQuery.rows.length === 0) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invoice not found or access denied' } });
        }

        const result = await connection.execute(
            `SELECT i.*, p.payment_id, p.transaction_id, p.amount_paid, p.payment_method, p.payment_status
             FROM INVOICES i
             LEFT JOIN PAYMENTS p ON i.invoice_id = p.invoice_id
             WHERE i.booking_id = :1`,
            [bookingId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found for this booking' } });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

router.post('/:booking_id/pay', requireAuth, async (req, res) => {
    let connection;
    try {
        const bookingId = req.params.booking_id;
        connection = await db.getConnection();
        
        const invRes = await connection.execute(
            `SELECT invoice_id, net_total FROM INVOICES WHERE booking_id = :1`,
            [bookingId]
        );
        
        if (invRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });
        }
        
        const invoiceId = invRes.rows[0][0];
        const netTotal = invRes.rows[0][1];

        const payRes = await connection.execute('SELECT payment_id FROM PAYMENTS WHERE invoice_id = :1', [invoiceId]);
        
        if (payRes.rows.length > 0) {
            await connection.execute(
                `UPDATE PAYMENTS SET payment_status = 'SUCCESS', amount_paid = :1 WHERE invoice_id = :2`,
                [netTotal, invoiceId],
                { autoCommit: true }
            );
        } else {
            const method = req.body.paymentMethod || 'CREDIT_CARD';
            await connection.execute(
                `INSERT INTO PAYMENTS (invoice_id, amount_paid, payment_method, payment_status, transaction_id)
                 VALUES (:1, :2, :3, 'SUCCESS', :4)`,
                [invoiceId, netTotal, method, `TXN_${Date.now()}`],
                { autoCommit: true }
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

module.exports = router;

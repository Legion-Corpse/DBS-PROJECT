const express = require('express');
const oracledb = require('oracledb');
const requireAuth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.get('/revenue', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Admins only' } });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const result = await connection.execute(
            `SELECT 
                sc.category_name,
                COUNT(b.booking_id) as total_bookings,
                SUM(i.platform_fee) as total_platform_revenue,
                SUM(i.net_total) as total_gross_value
             FROM BOOKINGS b
             JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
             JOIN SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
             JOIN INVOICES i ON b.booking_id = i.booking_id
             WHERE b.status = 'COMPLETED'
             GROUP BY sc.category_name
             ORDER BY total_platform_revenue DESC`,
            [],
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

router.get('/error-logs', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Admins only' } });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT log_id, severity, procedure_name as error_source, error_message, logged_at 
             FROM ERROR_LOGS 
             ORDER BY logged_at DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

router.get('/providers', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Admins only' } });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.provider_id, p.first_name, p.last_name, p.background_chk, u.username, u.email
             FROM SERVICE_PROVIDERS p
             JOIN USERS u ON p.user_id = u.user_id
             ORDER BY p.background_chk DESC, p.provider_id ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

router.post('/providers/:id/approve', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Admins only' } });
    }

    let connection;
    try {
        const providerId = req.params.id;
        connection = await db.getConnection();
        await connection.execute(
            `UPDATE SERVICE_PROVIDERS SET background_chk = 'APPROVED' WHERE provider_id = :1`,
            [providerId],
            { autoCommit: true }
        );
        res.json({ success: true, data: { message: 'Provider approved successfully' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

module.exports = router;

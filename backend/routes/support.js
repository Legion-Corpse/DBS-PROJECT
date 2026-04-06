const express = require('express');
const oracledb = require('oracledb');
const { z } = require('zod');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const db = require('../db');

const router = express.Router();

const createTicketSchema = z.object({
    subject: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    bookingId: z.number().int().positive().optional()
});

const updateStatusSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
});

// POST /api/support — create a ticket (any authenticated user)
router.post('/', requireAuth, validate(createTicketSchema), async (req, res) => {
    let connection;
    try {
        const { subject, description, bookingId } = req.body;
        connection = await db.getConnection();

        await connection.execute(
            `INSERT INTO SUPPORT_TICKETS (user_id, booking_id, subject, description, status)
             VALUES (:1, :2, :3, :4, 'OPEN')`,
            [req.user.user_id, bookingId || null, subject, description || null],
            { autoCommit: true }
        );

        res.json({ success: true, data: { message: 'Support ticket submitted successfully' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// GET /api/support/my — list own tickets
router.get('/my', requireAuth, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                t.ticket_id,
                t.subject,
                t.description,
                t.status,
                t.created_at,
                t.booking_id,
                so.service_name
             FROM SUPPORT_TICKETS t
             LEFT JOIN BOOKINGS b ON t.booking_id = b.booking_id
             LEFT JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
             WHERE t.user_id = :1
             ORDER BY t.created_at DESC`,
            [req.user.user_id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// GET /api/support/admin — admin: all tickets
router.get('/admin', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                t.ticket_id,
                t.subject,
                t.description,
                t.status,
                t.created_at,
                t.booking_id,
                u.username,
                u.user_role
             FROM SUPPORT_TICKETS t
             JOIN USERS u ON t.user_id = u.user_id
             ORDER BY
                CASE t.status WHEN 'OPEN' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'RESOLVED' THEN 3 ELSE 4 END,
                t.created_at DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// PATCH /api/support/:id/status — admin: update ticket status
router.patch('/:id/status', requireAuth, validate(updateStatusSchema), async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
    }
    let connection;
    try {
        const { status } = req.body;
        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE SUPPORT_TICKETS SET status = :1 WHERE ticket_id = :2`,
            [status, req.params.id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
        }
        res.json({ success: true, data: { message: 'Ticket status updated' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

module.exports = router;

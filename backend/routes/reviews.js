const express = require('express');
const oracledb = require('oracledb');
const requireAuth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.post('/:booking_id', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'CUSTOMER') {
        return res.status(403).json({ success: false, error: { message: 'Only customers can leave reviews' } });
    }

    let connection;
    try {
        const bookingId = req.params.booking_id;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: { message: 'Invalid rating. Must be between 1 and 5' } });
        }

        connection = await db.getConnection();

        // Check if booking belongs to customer and is COMPLETED
        const bookingCheck = await connection.execute(
            `SELECT b.service_id, b.customer_id, so.provider_id 
             FROM BOOKINGS b
             JOIN SERVICES_OFFERED so ON b.service_id = so.service_id
             JOIN CUSTOMERS c ON b.customer_id = c.customer_id
             WHERE b.booking_id = :1 AND c.user_id = :2 AND b.status = 'COMPLETED'`,
            [bookingId, req.user.user_id]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(403).json({ success: false, error: { message: 'Booking not found or not eligible for review' } });
        }

        // Insert review
        await connection.execute(
            `INSERT INTO REVIEWS (booking_id, rating, comments)
             VALUES (:1, :2, :3)`,
            [bookingId, rating, comment],
            { autoCommit: true }
        );

        res.json({ success: true, data: { message: 'Review submitted successfully' } });
    } catch (err) {
        if (err.message && err.message.includes('ORA-00001')) {
            return res.status(400).json({ success: false, error: { message: 'You have already reviewed this booking' } });
        }
        console.error(err);
        res.status(500).json({ success: false, error: { message: err.message } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

module.exports = router;

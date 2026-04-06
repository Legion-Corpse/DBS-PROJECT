const express = require('express');
const oracledb = require('oracledb');
const { z } = require('zod');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const db = require('../db');

const router = express.Router();

const feedbackSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comments: z.string().max(1000).optional()
});

// POST /api/feedback — any authenticated user submits platform feedback
router.post('/', requireAuth, validate(feedbackSchema), async (req, res) => {
    let connection;
    try {
        const { rating, comments } = req.body;
        connection = await db.getConnection();
        await connection.execute(
            `INSERT INTO PLATFORM_FEEDBACK (user_id, rating, comments)
             VALUES (:1, :2, :3)`,
            [req.user.user_id, rating, comments || null],
            { autoCommit: true }
        );
        res.json({ success: true, data: { message: 'Thank you for your feedback!' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// GET /api/feedback/admin — admin: view all feedback with aggregate stats
router.get('/admin', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const [feedbackResult, statsResult] = await Promise.all([
            connection.execute(
                `SELECT
                    f.feedback_id,
                    u.username,
                    u.user_role,
                    f.rating,
                    f.comments,
                    f.submitted_at
                 FROM PLATFORM_FEEDBACK f
                 JOIN USERS u ON f.user_id = u.user_id
                 ORDER BY f.submitted_at DESC`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            ),
            connection.execute(
                `SELECT
                    ROUND(AVG(rating), 2) AS avg_rating,
                    COUNT(*) AS total_responses,
                    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive_count
                 FROM PLATFORM_FEEDBACK`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
        ]);
        res.json({
            success: true,
            data: {
                stats: statsResult.rows[0],
                feedback: feedbackResult.rows
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

module.exports = router;

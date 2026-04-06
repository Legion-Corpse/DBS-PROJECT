const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const validate = require('../middleware/validate');
const db = require('../db');
const { mapDatabaseError } = require('../utils/errorMapper');

const router = express.Router();

const registerSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    email: z.string().email(),
    role: z.enum(['CUSTOMER', 'PROVIDER']),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional()
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});

router.post('/register', validate(registerSchema), async (req, res) => {
    let connection;
    try {
        const { username, password, email, role, firstName, lastName, phone } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        connection = await db.getConnection();
        
        const userResult = await connection.execute(
            `INSERT INTO USERS (username, password_hash, email, user_role) 
             VALUES (:1, :2, :3, :4) RETURNING user_id INTO :5`,
            [username, passwordHash, email, role, { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }],
            { autoCommit: false }
        );

        const userId = userResult.outBinds[0][0];

        if (role === 'CUSTOMER') {
            await connection.execute(
                `INSERT INTO CUSTOMERS (user_id, first_name, last_name, phone) VALUES (:1, :2, :3, :4)`,
                [userId, firstName, lastName, phone],
                { autoCommit: false }
            );
        } else if (role === 'PROVIDER') {
            await connection.execute(
                `INSERT INTO SERVICE_PROVIDERS (user_id, first_name, last_name, rating_avg, jobs_completed, background_chk) 
                 VALUES (:1, :2, :3, 0, 0, 'PENDING')`,
                [userId, firstName, lastName],
                { autoCommit: false }
            );
        }

        await connection.commit();

        res.json({ success: true, data: { userId, username, role } });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { console.error(e); }
        }
        console.error(err);
        const userFriendlyMsg = mapDatabaseError(err);
        const status = err.message?.includes('ORA-00001') ? 409 : 500;
        res.status(status).json({ success: false, error: { code: status === 409 ? 'CONFLICT' : 'DATABASE_ERROR', message: userFriendlyMsg } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

router.post('/login', validate(loginSchema), async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        connection = await db.getConnection();

        const result = await connection.execute(
            `SELECT user_id, username, password_hash, user_role, is_active FROM USERS WHERE username = :1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
        }

        const user = result.rows[0];
        const [user_id, db_username, db_password_hash, db_user_role, db_is_active] = user;

        if (db_is_active === 0) {
            return res.status(403).json({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Account is deactivated' } });
        }

        const isMatch = await bcrypt.compare(password, db_password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
        }

        try {
            await connection.execute(
                `UPDATE USERS SET last_login = SYSDATE WHERE user_id = :1`,
                [user_id],
                { autoCommit: true }
            );
        } catch (e) {
            console.warn('Last login update failed (schema mismatch), continuing anyway:', e.message);
        }

        const token = jwt.sign(
            { user_id, username: db_username, user_role: db_user_role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, data: { token, user: { user_id, username: db_username, role: db_user_role } } });
    } catch (err) {
        console.error(err);
        const userFriendlyMsg = mapDatabaseError(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: userFriendlyMsg } });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;

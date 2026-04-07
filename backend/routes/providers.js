const express = require('express');
const oracledb = require('oracledb');
const { z } = require('zod');
const db = require('../db');
const { mapDatabaseError } = require('../utils/errorMapper');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const addSlotSchema = z.object({
    day_of_week: z.number().int().min(0).max(6),
    slot_start:  z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
    slot_end:    z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
}).refine(data => data.slot_start < data.slot_end, {
    message: 'Start time must be before end time',
    path: ['slot_end'],
});

const addServiceSchema = z.object({
    category_id:  z.number().int().positive(),
    service_name: z.string().min(2).max(100),
    hourly_rate:  z.number().positive(),
});

const router = express.Router();

// ─── Public: list all providers (includes cities via LISTAGG) ────────────────
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                sp.provider_id,
                u.username,
                sp.first_name || ' ' || sp.last_name AS full_name,
                (SELECT MAX(sc.category_name)
                 FROM SERVICE_CATEGORIES sc
                 JOIN SERVICES_OFFERED so ON sc.category_id = so.category_id
                 WHERE so.provider_id = sp.provider_id AND so.is_active = 1) AS category_name,
                sp.rating_avg,
                sp.jobs_completed,
                LISTAGG(sa.city_name, ',') WITHIN GROUP (ORDER BY sa.city_name) AS cities
             FROM SERVICE_PROVIDERS sp
             JOIN USERS u ON sp.user_id = u.user_id
             LEFT JOIN PROVIDER_AREAS pa ON sp.provider_id = pa.provider_id
             LEFT JOIN SERVICE_AREAS sa ON pa.area_id = sa.area_id
             WHERE u.is_active = 1
             GROUP BY sp.provider_id, u.username, sp.first_name, sp.last_name, sp.rating_avg, sp.jobs_completed
             ORDER BY sp.rating_avg DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Public: list categories ───────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT category_id, category_name FROM SERVICE_CATEGORIES ORDER BY category_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Public: list all service areas ───────────────────────────────────────────
router.get('/areas', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT area_id, city_name, region_code FROM SERVICE_AREAS ORDER BY city_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Provider: manage service areas ───────────────────────────────────────────
router.get('/my/areas', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`, [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];
        const result = await connection.execute(
            `SELECT pa.provider_area_id, sa.area_id, sa.city_name, sa.region_code
             FROM PROVIDER_AREAS pa
             JOIN SERVICE_AREAS sa ON pa.area_id = sa.area_id
             WHERE pa.provider_id = :1
             ORDER BY sa.city_name`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.post('/my/areas', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    const areaId = Number(req.body.areaId);
    if (!areaId || isNaN(areaId)) {
        return res.status(400).json({ success: false, error: { message: 'areaId is required' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`, [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];
        await connection.execute(
            `INSERT INTO PROVIDER_AREAS (provider_id, area_id) VALUES (:1, :2)`,
            [providerId, areaId],
            { autoCommit: true }
        );
        res.json({ success: true, data: { message: 'Area added' } });
    } catch (err) {
        if (err.message && err.message.includes('ORA-00001')) {
            return res.status(409).json({ success: false, error: { message: 'You already serve this area' } });
        }
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.delete('/my/areas/:areaId', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`, [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];
        const result = await connection.execute(
            `DELETE FROM PROVIDER_AREAS WHERE provider_id = :1 AND area_id = :2`,
            [providerId, Number(req.params.areaId)],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, error: { message: 'Area not found in your list' } });
        }
        res.json({ success: true, data: { message: 'Area removed' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Public: recommend providers by area ──────────────────────────────────────
router.get('/recommend/:area_id', async (req, res) => {
    let connection;
    try {
        const areaId = req.params.area_id;
        connection = await db.getConnection();

        const result = await connection.execute(
            `BEGIN :cursor := fn_recommend_providers(:areaId); END;`,
            {
                areaId: areaId,
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const resultSet = result.outBinds.cursor;
        let formattedRows = [];
        try {
            const rows = await resultSet.getRows();
            if (rows.length > 0) {
                const meta = resultSet.metaData;
                rows.forEach(r => {
                    let obj = {};
                    meta.forEach((m, idx) => { obj[m.name] = r[idx]; });
                    formattedRows.push(obj);
                });
            }
        } finally {
            await resultSet.close();
        }

        res.json({ success: true, data: formattedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Provider: manage availability slots ──────────────────────────────────────
router.get('/my/slots', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        const result = await connection.execute(
            `SELECT availability_id, day_of_week,
                    TO_CHAR(slot_start, 'HH24:MI') as slot_start,
                    TO_CHAR(slot_end, 'HH24:MI') as slot_end,
                    is_available
             FROM PROVIDER_AVAILABILITY
             WHERE provider_id = :1
             ORDER BY day_of_week, slot_start`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.post('/my/slots', requireAuth, validate(addSlotSchema), async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        const { day_of_week, slot_start, slot_end } = req.body;
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayString = days[Number(day_of_week)];

        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        await connection.execute(
            `INSERT INTO PROVIDER_AVAILABILITY (provider_id, day_of_week, slot_start, slot_end, is_available)
             VALUES (:1, :2, TO_DATE('2000-01-01 ' || :3, 'YYYY-MM-DD HH24:MI'), TO_DATE('2000-01-01 ' || :4, 'YYYY-MM-DD HH24:MI'), 1)`,
            [providerId, dayString, slot_start, slot_end],
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.delete('/my/slots/:slotId', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        const result = await connection.execute(
            `DELETE FROM PROVIDER_AVAILABILITY WHERE availability_id = :1 AND provider_id = :2`,
            [req.params.slotId, providerId],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Slot not found or does not belong to you' } });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Provider: manage offered services ────────────────────────────────────────
router.get('/my/services', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        const result = await connection.execute(
            `SELECT so.service_id, so.service_name, so.hourly_rate, sc.category_name, so.is_active
             FROM SERVICES_OFFERED so
             JOIN SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
             WHERE so.provider_id = :1
             ORDER BY so.service_id DESC`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.post('/my/services', requireAuth, validate(addServiceSchema), async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    const { category_id, service_name, hourly_rate } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        await connection.execute(
            `INSERT INTO SERVICES_OFFERED (provider_id, category_id, service_name, hourly_rate, is_active)
             VALUES (:1, :2, :3, :4, 1)`,
            [providerId, category_id, service_name, hourly_rate],
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

router.delete('/my/services/:serviceId', requireAuth, async (req, res) => {
    if (req.user.user_role !== 'PROVIDER') {
        return res.status(403).json({ success: false, error: { message: 'Providers only' } });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const provRes = await connection.execute(
            `SELECT provider_id FROM SERVICE_PROVIDERS WHERE user_id = :1`,
            [req.user.user_id]
        );
        if (provRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });
        }
        const providerId = provRes.rows[0][0];

        const result = await connection.execute(
            `DELETE FROM SERVICES_OFFERED WHERE service_id = :1 AND provider_id = :2`,
            [req.params.serviceId, providerId],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found or does not belong to you' } });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

// ─── Public: get single provider detail — MUST be last among GET routes ───────
router.get('/:id', async (req, res) => {
    let connection;
    try {
        const idParam = req.params.id;
        const providerId = Number(idParam);

        if (isNaN(providerId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid provider ID' } });
        }

        connection = await db.getConnection();

        const providerResult = await connection.execute(
            `SELECT * FROM vw_provider_summary WHERE provider_id = TO_NUMBER(:1)`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (providerResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } });
        }

        const availResult = await connection.execute(
            `SELECT availability_id, day_of_week,
                    TO_CHAR(slot_start, 'HH24:MI') as slot_start,
                    TO_CHAR(slot_end, 'HH24:MI') as slot_end,
                    is_available
             FROM PROVIDER_AVAILABILITY
             WHERE provider_id = TO_NUMBER(:1) AND is_available = 1
             ORDER BY day_of_week, slot_start`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const areaResult = await connection.execute(
            `SELECT sa.area_id, sa.city_name, sa.region_code
             FROM PROVIDER_AREAS pa
             JOIN SERVICE_AREAS sa ON pa.area_id = sa.area_id
             WHERE pa.provider_id = TO_NUMBER(:1)`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const serviceResult = await connection.execute(
            `SELECT service_id, service_name, hourly_rate, is_active
             FROM SERVICES_OFFERED
             WHERE provider_id = TO_NUMBER(:1) AND is_active = 1`,
            [providerId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: {
                provider: providerResult.rows[0],
                availability: availResult.rows,
                areas: areaResult.rows,
                services: serviceResult.rows
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: mapDatabaseError(err) } });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Raised from 100 — dashboard polling can hit 100 quickly
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});

// Stricter limiter for auth endpoints to block brute-force attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please wait before trying again.' } }
});

app.use('/api', apiLimiter);

const authRoutes = require('./routes/auth');
const providersRoutes = require('./routes/providers');
const bookingsRoutes = require('./routes/bookings');
const invoicesRoutes = require('./routes/invoices');
const adminRoutes = require('./routes/admin');
const reviewsRoutes = require('./routes/reviews');
const supportRoutes = require('./routes/support');
const feedbackRoutes = require('./routes/feedback');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    await db.initializePool();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

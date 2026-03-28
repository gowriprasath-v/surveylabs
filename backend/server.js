require('dotenv').config();

const express = require('express');
const cors = require('cors');

// database must load first (creates tables + seeds admin)
require('./database');

// migrations run after tables exist
const { runMigrations } = require('./migrations');
runMigrations();

const authRoutes     = require('./src/routes/authRoutes');
const surveyRoutes   = require('./src/routes/surveyRoutes');
const responseRoutes = require('./src/routes/responseRoutes');
const errorHandler   = require('./src/middleware/errorHandler');
const { swaggerSpec, swaggerServe, swaggerSetup, swaggerHtml } = require('./swagger');

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS — allow Vite dev server and any VITE_CORS_ORIGIN env override
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', surveyRoutes);
app.use('/api', responseRoutes);

// Swagger UI — serve HTML directly on /api/docs to avoid 301 redirect
app.get('/api/docs', (_req, res) => res.send(swaggerHtml));
app.use('/api/docs', swaggerServe, swaggerSetup);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// errorHandler MUST be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

module.exports = app;

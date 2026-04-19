require('dotenv').config();

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'PORT'];
REQUIRED_ENV.forEach(key => {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing env var: ${key}. Halting startup.`);
    process.exit(1);
  }
});

const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const cors = require('cors');

// database must load first (creates tables + seeds admin)
require('./database');

// migrations run after tables exist
const { runMigrations } = require('./migrations');
runMigrations();

const authRoutes     = require('./src/routes/authRoutes');
const surveyRoutes   = require('./src/routes/surveyRoutes');
const responseRoutes = require('./src/routes/responseRoutes');
const analyticsRoutes= require('./src/routes/analyticsRoutes');
const errorHandler   = require('./src/middleware/errorHandler');
const { swaggerSpec, swaggerServe, swaggerSetup, swaggerHtml } = require('./swagger');
const { WebSocketServer } = require('ws');
const db = require('./database');

const app  = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // vite preview
  process.env.FRONTEND_URL,
].filter(Boolean);

// In production, also allow all *.vercel.app and *.onrender.com subdomains
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // server-to-server or curl
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === 'production') {
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl && req.originalUrl.includes('/api/admin/analytics/global')
});
app.use('/api', limiter);
app.use(helmet({ crossOriginResourcePolicy: false }));

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'connected', uptime: process.uptime() }));
app.use('/api/auth', authRoutes);
app.use('/api', surveyRoutes);
app.use('/api', responseRoutes);
app.use('/api', analyticsRoutes);

// Swagger UI
app.get('/api/docs', (_req, res) => res.send(swaggerHtml));
app.use('/api/docs', swaggerServe, swaggerSetup);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// errorHandler MUST be last
app.use(errorHandler);

// HTTP Server + WebSocket Setup
const server = require('http').createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);

      // Update in-memory live session store for conversational surveys
      if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        pruneSessions();

        if (parsed.type === 'survey:start' && parsed.sessionId && parsed.surveyId) {
          const meta = getSurveyOwner(parsed.surveyId);
          if (meta && meta.mode === 'conversational') {
            conversationSessions.set(parsed.sessionId, {
              sessionId: String(parsed.sessionId),
              surveyId: String(parsed.surveyId),
              ownerId: meta.created_by,
              surveyTitle: parsed.surveyTitle || meta.title || 'Conversational Survey',
              respondent: parsed.respondent || 'Live Active User',
              startedAt: new Date(parsed.time || Date.now()).toISOString(),
              lastMessageAt: new Date(parsed.time || Date.now()).toISOString(),
              duration: '0s',
              progress: 0,
              status: 'in-progress',
              quality_label: 'good',
              messages: [],
            });
          }
        }

        if (parsed.type === 'survey:progress' && parsed.sessionId) {
          const existing = conversationSessions.get(parsed.sessionId);
          if (existing) {
            const nowIso = new Date(parsed.time || Date.now()).toISOString();
            const messages = Array.isArray(existing.messages) ? [...existing.messages] : [];
            if (parsed.question) messages.push({ from: 'bot', text: String(parsed.question) });
            if (parsed.answer !== undefined) messages.push({ from: 'user', text: String(parsed.answer) });

            const started = new Date(existing.startedAt || nowIso).getTime();
            const now = new Date(nowIso).getTime();
            const secs = Math.max(0, Math.round((now - started) / 1000));
            const duration = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;

            conversationSessions.set(parsed.sessionId, {
              ...existing,
              lastMessageAt: nowIso,
              progress: Number.isFinite(Number(parsed.percent)) ? Math.max(0, Math.min(100, Number(parsed.percent))) : existing.progress,
              duration,
              status: existing.status === 'completed' ? 'completed' : 'in-progress',
              messages,
            });
          }
        }

        if (parsed.type === 'survey:complete' && parsed.sessionId) {
          const existing = conversationSessions.get(parsed.sessionId);
          if (existing) {
            const nowIso = new Date(parsed.time || Date.now()).toISOString();
            const started = new Date(existing.startedAt || nowIso).getTime();
            const now = new Date(nowIso).getTime();
            const secs = Math.max(0, Math.round((now - started) / 1000));
            const duration = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
            conversationSessions.set(parsed.sessionId, {
              ...existing,
              lastMessageAt: nowIso,
              duration,
              progress: 100,
              status: 'completed',
            });
          }
        }
      }

      // Blindly broadcast valid JSON commands to all OTHER clients
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === 1) { // 1 = OPEN
          client.send(JSON.stringify(parsed));
        }
      });
    } catch (err) {
      console.error('[WS] Invalid message payload', err);
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// Attach broadcast helper to app
app.set('wss', wss);

// In-memory live session store for conversational surveys (used by /admin/analytics/conversations)
// Map<sessionId, { sessionId, surveyId, ownerId, surveyTitle, respondent, startedAt, lastMessageAt, progress, status, quality_label, messages[] }>
const conversationSessions = new Map();
app.set('conversationSessions', conversationSessions);

function pruneSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const [sid, s] of conversationSessions.entries()) {
    const t = new Date(s?.lastMessageAt || s?.startedAt || 0).getTime();
    if (!t || now - t > maxAgeMs) conversationSessions.delete(sid);
  }
}

function getSurveyOwner(surveyId) {
  try {
    const row = db.prepare('SELECT created_by, title, mode FROM surveys WHERE id = ?').get(surveyId);
    return row || null;
  } catch {
    return null;
  }
}

server.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

module.exports = { app, server };

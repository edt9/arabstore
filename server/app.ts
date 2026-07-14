import express from 'express';
import cors from 'cors';
import { getConfigStatus } from './controllers/config.controller';
import gamesRoutes  from './routes/games.routes';
import authRoutes   from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get('/api/config-status',         getConfigStatus);
app.use('/api/games',                 gamesRoutes);
app.use('/api/admin',                 authRoutes);
app.use('/api/upload',                uploadRoutes);

// Legacy route aliases (keep for backward compat)
app.get('/api/admin/config-status',   getConfigStatus);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;

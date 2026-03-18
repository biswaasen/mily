import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/error.middleware.js';
import health from './routes/health.js';
import api from './routes/api.js';

const app = new Hono();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.onError(errorHandler);

app.route('/', health);
app.route('/api/v1', api);

export default app;

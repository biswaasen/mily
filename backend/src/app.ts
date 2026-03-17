import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/error.middleware.js';
import health from './routes/health.js';
import api from './routes/api.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.onError(errorHandler);

app.route('/', health);
app.route('/api/v1', api);

export default app;

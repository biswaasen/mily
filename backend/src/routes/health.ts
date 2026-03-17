import { Hono } from 'hono';
import { ensureConnection } from '../config/database.js';
import { logger } from '../utils/logger.js';

const health = new Hono();

health.get('/health', async (c) => {
  try {
    const dbHealthy = await ensureConnection();
    return c.json({ 
      status: dbHealthy ? 'healthy' : 'degraded',
      database: dbHealthy,
      timestamp: new Date().toISOString()
    }, dbHealthy ? 200 : 503);
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    return c.json({ status: 'unhealthy', error: 'Health check failed' }, 503);
  }
});

health.get('/debug-sentry', () => {
  throw new Error('Sentry test error');
});

export default health;

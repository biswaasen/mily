import 'dotenv/config';
import { serve } from '@hono/node-server';
import { sequelize } from './schema/index.schema.js';
import { safeSync } from './config/database.js';
import { logger } from './utils/logger.js';
import { initSentry, Sentry } from './utils/sentry.js';
import app from './app.js';
import './config/firebase.js';

initSentry();

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    if (!process.env.DATABASE_URL || !process.env.GROQ_API_KEY || !process.env.JWT_SECRET || !process.env.FIREBASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables');
    }

    await sequelize.authenticate();
    await safeSync({ alter: true });
    logger.info('Database connected and synced successfully');

    serve({
      fetch: app.fetch,
      port: Number(PORT)
    }, () => {
      logger.info({ port: Number(PORT) }, `Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Startup failed');
    Sentry.captureException(error);
    await Sentry.close(2000);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  Sentry.captureException(error);
  Sentry.close(2000).then(() => {
    process.exit(1);
  });
});

start();

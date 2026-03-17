import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN || 'https://869dcbff2ba363c1eaad64b48b09c4db@o4510758458032128.ingest.de.sentry.io/4510758459932752';
  const isProd = process.env.NODE_ENV === 'production';
  const environment = isProd ? 'production' : 'development';

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      tracesSampleRate: isProd ? 0.1 : 1.0,
      sendDefaultPii: true,
      beforeSend(event) {
        if (!event.tags) event.tags = {};
        event.tags.service = 'mily-backend';
        event.tags.service_type = 'hono';
        return event;
      },
    });

    logger.info({ environment }, 'Sentry initialized');
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to initialize Sentry');
  }
}

export { Sentry };

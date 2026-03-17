import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createLogger } from '../utils/logger.js';
import { Sentry } from '../utils/sentry.js';

const log = createLogger('ErrorHandler');

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof AppError) {
    log.warn({ statusCode: err.statusCode, message: err.message }, 'Application error');
    return c.json({ error: err.message }, err.statusCode as any);
  }

  log.error({ err, path: c.req.path, method: c.req.method }, 'Unexpected error');
  Sentry.captureException(err);

  return c.json({ error: 'Internal server error' }, 500);
};

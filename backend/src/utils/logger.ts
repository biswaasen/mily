import pino from 'pino';
import pinoPretty from 'pino-pretty';

const stream = pinoPretty({
  colorize: true,
  translateTime: 'HH:MM:ss',
  ignore: 'pid,hostname',
  singleLine: false,
  messageFormat: (log: Record<string, unknown>, messageKey: string) => {
    const msg = String(log[messageKey] ?? '');
    const module = log.module ? `[${log.module}] ` : '';
    return `${module}${msg}`;
  },
  customPrettifiers: {
    err: (err: unknown) => {
      if (err instanceof Error) {
        return err.stack ?? err.message;
      }
      if (typeof err === 'object' && err !== null) {
        return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
      }
      return String(err);
    },
    response: (v: unknown) => {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return s.length > 120 ? s.slice(0, 120) + '…' : s;
    },
  },
});

export const logger = pino(
  { 
    level: process.env.LOG_LEVEL ?? 'info',
    serializers: {
      err: pino.stdSerializers.err,
    },
  },
  stream
);

export function createLogger(module: string) {
  return logger.child({ module });
}

import pino from 'pino';
import type { Env } from './env.js';

/** Pino-логгер: pretty в dev, redact секретов */
export function createLogger(env: Env) {
  return pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash'],
  });
}

export type Logger = ReturnType<typeof createLogger>;

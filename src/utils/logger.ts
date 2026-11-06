import pino from 'pino';

// Mask sensitive information such as BOT_TOKEN or passwords
function redactSensitive(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/\/bot[0-9]+:[a-zA-Z0-9_-]+/g, '/bot[REDACTED]')
      .replace(/postgres:\/\/[^@]+@/g, 'postgres://[REDACTED]@');
  }
  return obj;
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    log(obj) {
      return redactSensitive(obj) as Record<string, unknown>;
    },
  },
  redact: {
    paths: ['token', 'botToken', 'password', 'databaseUrl', 'req.headers.authorization', 'req.headers["x-telegram-bot-api-secret-token"]'],
    censor: '[REDACTED]',
  },
});

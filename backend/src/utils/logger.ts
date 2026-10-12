/**
 * Structured Logger for CodeSentinel AI
 * Enforces structured output and strict redaction of sensitive tokens and passwords.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'passwordHash', 'token', 'jwt', 'apiKey', 'secret', 'authorization'];
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'info' as LogLevel,
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    }));
  },

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(JSON.stringify({
      level: 'warn' as LogLevel,
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    }));
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { raw: String(error) };

    console.error(JSON.stringify({
      level: 'error' as LogLevel,
      timestamp: new Date().toISOString(),
      message,
      error: sanitize(errorDetails),
      ...(meta ? { meta: sanitize(meta) } : {}),
    }));
  },

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({
        level: 'debug' as LogLevel,
        timestamp: new Date().toISOString(),
        message,
        ...(meta ? { meta: sanitize(meta) } : {}),
      }));
    }
  }
};

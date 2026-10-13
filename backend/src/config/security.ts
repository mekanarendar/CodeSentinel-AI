import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

import { env } from './env.ts';

/**
 * CORS Configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an origin
    if (!origin) return callback(null, true);

    // Allow local development and approved preview environments
    if (
      env.NODE_ENV === 'development' ||
      origin.includes('localhost') ||
      origin.includes('run.app')
    ) {
      return callback(null, true);
    }

    // Allow the configured frontend URL
    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }

    callback(new Error('Blocked by CORS policy'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
  ],
};

/**
 * Strict Security Headers Middleware
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
}
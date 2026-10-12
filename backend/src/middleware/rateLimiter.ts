import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication endpoints (login/register)
 * Prevents credential stuffing and brute force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiter for AI Code Review and Project Analysis endpoints
 * Protects compute resources and external API quotas.
 */
export const aiAnalysisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 reviews per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Analysis rate limit reached. Please wait before submitting more code for review.',
  },
});

/**
 * General API Limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

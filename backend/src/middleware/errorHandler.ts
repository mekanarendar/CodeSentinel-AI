import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';
import { sendError } from '../utils/apiResponse.ts';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Unhandled error during ${req.method} ${req.url}`, err, {
    method: req.method,
    url: req.url,
    statusCode,
  });

  return sendError(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    statusCode
  );
}

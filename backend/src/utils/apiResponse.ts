import type { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    requestId?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  extraMeta?: Record<string, unknown>
) {
  const payload: ApiResponsePayload<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    meta: {
      requestId: (res.req as { id?: string }).id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...extraMeta,
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  errorMessage: string,
  statusCode = 400,
  extraMeta?: Record<string, unknown>
) {
  const payload: ApiResponsePayload = {
    success: false,
    error: errorMessage,
    meta: {
      requestId: (res.req as { id?: string }).id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...extraMeta,
    },
  };
  return res.status(statusCode).json(payload);
}

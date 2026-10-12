import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.ts';
import { DataStore } from '../models/dataStore.ts';
import { sendError } from '../utils/apiResponse.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Missing Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing.', 401);
    }

    // Verify access token
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token expired. Please refresh your session.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    if (!decoded || !decoded.userId) {
      return sendError(res, 'Malformed authentication token payload.', 401);
    }

    // Retrieve user and ensure active
    const user = await DataStore.findUserById(decoded.userId);
    if (!user || user.isActive === false) {
      return sendError(res, 'User account not found or suspended.', 401);
    }

    req.user = {
      id: user._id?.toString() || user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    return sendError(res, 'Internal authentication error.', 500);
  }
}

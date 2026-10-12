import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { DataStore } from '../models/dataStore.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  return { accessToken, refreshToken, tokenHash };
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      // Check for existing user
      const existing = await DataStore.findUserByEmail(email);
      if (existing) {
        return sendError(res, 'An account with this email address already exists.', 409);
      }

      // Hash password with 12 salt rounds
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await DataStore.createUser({
        name,
        email,
        passwordHash,
        role: 'user',
        isActive: true,
      });

      const userId = (user._id || user.id).toString();
      const { accessToken, refreshToken, tokenHash } = generateTokens(userId);

      // Store revocable session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await DataStore.createSession({
        userId,
        tokenHash,
        userAgent: req.headers['user-agent'] as string,
        ipAddress: req.ip,
        expiresAt,
      });

      await DataStore.logAuditEvent({
        userId,
        action: 'auth_register',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      logger.info('User successfully registered', { userId, email });

      return sendSuccess(
        res,
        {
          user: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        'Account created successfully',
        201
      );
    } catch (error) {
      logger.error('Registration failed', error);
      return sendError(res, 'Failed to complete registration.', 500);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await DataStore.findUserByEmail(email, true);
      if (!user) {
        return sendError(res, 'Invalid email or password credentials.', 401);
      }

      if (user.isActive === false) {
        return sendError(res, 'Your account has been deactivated.', 403);
      }

      // Verify bcrypt password hash
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        await DataStore.logAuditEvent({
          action: 'auth_failed',
          ipAddress: req.ip,
          details: { email },
        });
        return sendError(res, 'Invalid email or password credentials.', 401);
      }

      const userId = (user._id || user.id).toString();
      const { accessToken, refreshToken, tokenHash } = generateTokens(userId);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await DataStore.createSession({
        userId,
        tokenHash,
        userAgent: req.headers['user-agent'] as string,
        ipAddress: req.ip,
        expiresAt,
      });

      await DataStore.logAuditEvent({
        userId,
        action: 'auth_login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      logger.info('User logged in successfully', { userId });

      return sendSuccess(
        res,
        {
          user: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        'Login successful'
      );
    } catch (error) {
      logger.error('Login error', error);
      return sendError(res, 'An error occurred during authentication.', 500);
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return sendError(res, 'Refresh token required.', 400);
      }

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await DataStore.findSession(tokenHash);

      if (!session) {
        return sendError(res, 'Session invalid or has expired. Please log in again.', 401);
      }

      const userId = session.userId.toString();
      const user = await DataStore.findUserById(userId);
      if (!user || user.isActive === false) {
        return sendError(res, 'User account no longer active.', 401);
      }

      // Rotate tokens: revoke previous and issue new pair
      await DataStore.revokeSession(tokenHash);
      const newTokens = generateTokens(userId);

      await DataStore.createSession({
        userId,
        tokenHash: newTokens.tokenHash,
        userAgent: req.headers['user-agent'] as string,
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return sendSuccess(res, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    } catch (error) {
      logger.error('Session refresh error', error);
      return sendError(res, 'Failed to refresh authentication session.', 500);
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await DataStore.revokeSession(tokenHash);
      }

      if (req.user) {
        await DataStore.logAuditEvent({
          userId: req.user.id,
          action: 'auth_logout',
          ipAddress: req.ip,
        });
      }

      return sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
    } catch (error) {
      logger.error('Logout error', error);
      return sendError(res, 'Logout failed.', 500);
    }
  },

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const user = await DataStore.findUserById(req.user.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, {
        id: (user._id || user.id).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch profile', 500);
    }
  },

  async updatePreferences(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { preferences } = req.body;

      const updated = await DataStore.updateUser(req.user.id, { preferences });
      return sendSuccess(res, updated, 'Preferences updated successfully');
    } catch (error) {
      return sendError(res, 'Failed to update preferences', 500);
    }
  },
};

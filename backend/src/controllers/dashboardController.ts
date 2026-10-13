import type { Request, Response } from 'express';
import { DataStore } from '../models/dataStore.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';

export const DashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const stats = await DataStore.getDashboardStats(req.user.id);
      return sendSuccess(res, stats);
    } catch (error) {
      logger.error('Failed to get dashboard statistics', error);
      return sendError(res, 'Failed to fetch dashboard statistics', 500);
    }
  },
};

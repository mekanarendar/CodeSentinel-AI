import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.ts';
import { sendSuccess } from '../utils/apiResponse.ts';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();

  return sendSuccess(res, {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbStatus.isConnected,
      mode: dbStatus.mode,
      host: dbStatus.host || 'local-active',
      database: dbStatus.name || 'codesentinel',
    },
    version: '1.0.0',
    capabilities: {
      jwtAuth: true,
      secretRedaction: true,
      archiveExtraction: true,
      deterministicScoring: true,
      aiProvider: process.env.GEMINI_API_KEY ? 'gemini-active' : 'deterministic-heuristic',
    },
  });
});

export default router;

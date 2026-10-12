import express from 'express';
import cors from 'cors';
import { corsOptions, securityHeadersMiddleware } from './config/security.ts';
import { generalApiLimiter } from './middleware/rateLimiter.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { sendError } from './utils/apiResponse.ts';

// Route handlers
import healthRoutes from './routes/healthRoutes.ts';
import authRoutes from './routes/authRoutes.ts';
import projectRoutes from './routes/projectRoutes.ts';
import reviewRoutes from './routes/reviewRoutes.ts';
import dashboardRoutes from './routes/dashboardRoutes.ts';

export function createApp() {
  const app = express();

  // Request ID and performance timestamping
  app.use((req, res, next) => {
    (req as any).id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    res.setHeader('X-Request-Id', (req as any).id);
    next();
  });

  // Security Middleware
  app.use(securityHeadersMiddleware);
  app.use(cors(corsOptions));
  app.use(generalApiLimiter);

  // Body Parsing with safe size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API v1 Routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/reviews', reviewRoutes);
  app.use('/api/v1/analysis', reviewRoutes); // Analysis actions alias
  app.use('/api/v1/dashboard', dashboardRoutes);

  // Catch-all 404 for undefined /api routes
  app.all('/api/*', (req, res) => {
    return sendError(res, `API route not found: ${req.method} ${req.url}`, 404);
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

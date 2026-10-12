import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './src/app.ts';
import { connectDatabase } from './src/config/database.ts';
import { env } from './src/config/env.ts';
import { logger } from './src/utils/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();

  // Initialize Database Connection
  await connectDatabase();

  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || Number(env.PORT) || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    logger.info(`CodeSentinel AI server running at http://0.0.0.0:${port}`, {
      port,
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

startServer().catch((err) => {
  logger.error('Fatal server startup error', err);
  process.exit(1);
});

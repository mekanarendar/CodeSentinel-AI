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
  try {
    const app = createApp();

    // Connect to MongoDB before accepting requests
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
      // Assumes the frontend is built into frontend/dist
      const distPath = path.resolve(__dirname, '../frontend/dist');

      app.use(express.static(distPath));

      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(port, '0.0.0.0', () => {
      logger.info(`CodeSentinel AI server running on port ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
      });
    });
  } catch (err) {
    logger.error('Fatal server startup error', err);
    process.exit(1);
  }
}

startServer();
import express from 'express';
import type { Express } from 'express';
import { initDb, checkDbHealth, shutdownDb } from '@repo/db';
import { requestIdMiddleware, errorHandler } from './middlewares/index.ts';

console.log('API module loaded, starting initialization...');


export function createApp(): Express {
  const app = express();

  // Essential Middleware
  
  // 1. JSON body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Request ID generation
  app.use(requestIdMiddleware);

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    const db = await checkDbHealth();

    if (!db.ok) {
      return res.status(503).json({ status: 'degraded', db });
    }

    return res.status(200).json({ status: 'ok', db });
  });

  // 3. Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}

const isMainModule = process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js');

if (isMainModule) {
  const start = async () => {
    try {
      await initDb();
    } catch (error) {
      console.error('Failed to initialize database connection', error);
      process.exit(1);
    }

    const app = createApp();
    const port = process.env.PORT || 3001;

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await shutdownDb().catch(() => {});
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  };

  void start();
}

import express from 'express';
import type { Express } from 'express';
import { requestIdMiddleware, errorHandler } from './middlewares/index.ts';

/**
 * Creates and configures the Express application
 */
export function createApp(): Express {
  const app = express();

  // Essential Middleware
  
  // 1. JSON body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Request ID generation
  app.use(requestIdMiddleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // TODO: Add routes here
  // app.use('/api/users', userRoutes);
  // app.use('/api/trades', tradeRoutes);



  // 3. Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server if this file is run directly
 */
const isMainModule = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMainModule) {
  const app = createApp();
  const port = process.env.PORT || 3000;
  
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => process.exit(0));
  });
}

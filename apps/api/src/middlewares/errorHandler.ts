import type { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler middleware
 * Catches all errors passed via next(error)
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
    console.error({
    requestId: (req as any).id,
    message: error.message,
    stack: error.stack,
  });

  // Send error response
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Internal Server Error',
      requestId: (req as any).id,
    },
  });
}

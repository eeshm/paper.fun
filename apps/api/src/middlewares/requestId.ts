import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique request ID and attaches it to the request object
 * Used for request tracking and logging across the application
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Attach to request object
  (req as any).id = requestId;
  
  // Add to response header
  res.setHeader('x-request-id', requestId);
  
  next();
}

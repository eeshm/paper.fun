/**
 * Rate Limiting Middleware
 *
 * Uses Redis sliding window counter to limit requests.
 * Different limits for different endpoint types.
 */

import { Request, Response, NextFunction } from "express";
import { client as redis } from "@repo/redis";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redix key prefix
  keyGenerator: (req: Request) => string; // Generate unique key per client
  message?: string; // Custom error message
}

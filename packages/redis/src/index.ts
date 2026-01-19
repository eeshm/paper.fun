import client from "./client.js";
import { subscriber } from "./client.js";

/**
 * Initialize both the main Redis client and subscriber client
 */
export async function initRedis(): Promise<void> {
  await client.connect();
  await subscriber.connect();
}

export { default as client } from "./client.js";
export { subscriber } from "./client.js";
export { isRedisHealthy } from "./health.js";
export { redisKeys } from "./keys.js";

/*
  Redis Key Management for Trading Application
  - Centralized key definitions for consistency
  - Organized by domain (price, websocket, ratelimit, trading, cache, session)
  - Follows naming convention: <app>:<domain>:<entity>:<id>
*/

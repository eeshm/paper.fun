/**
 * WebSocket Server Entry Point
 * 
 * Main startup file: initialize Redis, create server, start publishers.
 */

import { initRedis, isRedisHealthy } from "@repo/redis";
import { createWebSocketServer, startPublishers } from "./server.js";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);

/**
 * Main startup function
 * 
 * TODO:
 * 1. Log startup message
 * 2. Call initRedis() and check isRedisHealthy()
 *    - If fails: log error and exit(1)
 *    - If success: log Redis connected
 * 3. Create WebSocket server with createWebSocketServer(WS_PORT)
 * 4. Log listening message
 * 5. Start publishers with startPublishers(wss)
 * 6. Log ready message
 * 7. Set up SIGINT handler: close wss gracefully
 * 8. Set up SIGTERM handler: close wss gracefully
 * 9. Catch fatal errors and exit
 */
async function main() {
  // TODO: Implement
  console.log("[WS] Main function called (not implemented)");
}

// Start worker
main().catch((error) => {
  console.error("[WS] Fatal error:", error);
  process.exit(1);
});

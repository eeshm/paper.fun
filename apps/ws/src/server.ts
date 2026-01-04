/**
 * WebSocket Server Setup
 * 
 * Creates the server and configures heartbeat for dead connection detection.
 */

import { WebSocketServer } from "ws";
import type { AuthenticatedWebSocket } from "./types.js";
import { handleConnection } from "./handlers/index.js";
import { startPricePublisher, startOrderPublisher } from "./publishers/index.js";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Create and configure WebSocket server
 * 
 * TODO:
 * 1. Create WebSocketServer on specified port
 * 2. Set up "connection" event handler -> call handleConnection
 * 3. Set up heartbeat interval:
 *    - Iterate wss.clients
 *    - If !ws.isAlive: terminate connection
 *    - Else: set isAlive = false, call ws.ping()
 * 4. Set up "close" event to clearInterval on server shutdown
 * 5. Return wss
 * 
 * @param port Port to listen on
 * @returns WebSocketServer instance
 */
export function createWebSocketServer(port: number): WebSocketServer {
  // TODO: Implement
  console.log("[WS] Create server called (not implemented)");
  throw new Error("Not implemented");
}

/**
 * Start all Redis subscribers (publishers)
 * 
 * TODO:
 * 1. Call startPricePublisher(wss)
 * 2. Call startOrderPublisher(wss)
 * 3. Use Promise.all to run concurrently
 * 
 * @param wss WebSocketServer instance
 */
export async function startPublishers(wss: WebSocketServer): Promise<void> {
  // TODO: Implement
  console.log("[WS] Start publishers called (not implemented)");
}

import { Decimal } from "decimal.js";
import { setPrice } from "@repo/pricing";
import { publishPriceUpdate } from "@repo/events";

/**
 * Update SOL price in Redis cache AND broadcast to WebSocket clients
 *
 * This writes to:
 * - Key: trading:price:SOL (the price)
 * - Key: trading:price:SOL:ts (the server timestamp)
 *
 * Uses setPrice() from @repo/pricing which handles:
 * - Atomic Redis writes
 * - Server-side timestamp (never client time)
 * - JSON serialization
 * 
 * @param price Current SOL/USD price as Decimal
 */
export async function updateSolPrice(price: Decimal): Promise<void> {
  try {
    // Update Redis cache
    await setPrice("SOL", price);

    // Publish event for WebSocket broadcast
    await publishPriceUpdate("SOL", price.toString());

    console.log(
      `Updated SOL price in Redis: $${price.toString()} at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Error updating SOL price in Redis:", error);
    throw error;
  }
}

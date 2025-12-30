/**
 * Price Storage
 * Write prices to Redis with server timestamp
 */

import { Decimal } from "decimal.js";
import { client as redis, redisKeys } from "@repo/redis";

/**
 * Set price for a symbol (called by price ingestion worker)
 *
 * @param symbol Token symbol (e.g., 'SOL')
 * @param price Current price as Decimal
 * @param timestamp Server timestamp (defaults to now)
 */

export async function setPrice(
  symbol: string,
  price: Decimal,
  timestamp: Date = new Date()
): Promise<void> {
  const upperSymbol = symbol.toUpperCase();
  const priceKey = redisKeys.PRICE.tokenPrice(upperSymbol);
  const timestampKey = `${priceKey}:ts`;

  if (price.lte(0)) {
    throw new Error(`Invalid price for ${upperSymbol}: ${price}. Must be > 0`);
  }

  if (!price.isFinite()) {
    throw new Error(`Invalid price for ${upperSymbol}: ${price}. Must be finite`);
  }

  await redis
  .multi()
  .set(priceKey,price.toString())
  .set(timestampKey,timestamp.toISOString())
  .exec()
}


/**
 * Set multiple prices atomically (for batch updates)
 * 
 * @param prices Map of symbol → price
 * @param timestamp Server timestamp (same for all)
 */


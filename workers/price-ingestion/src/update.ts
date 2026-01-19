import { Decimal } from "decimal.js";
import { setPrice, processPriceTick } from "@repo/pricing";
import { publishPriceUpdate, publishCandleUpdate } from "@repo/events";

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
 * Also processes the price tick for candle aggregation:
 * - Updates current 1m candle in Redis
 * - Persists closed candles to PostgreSQL
 * - Broadcasts candle updates via pub/sub
 * 
 * @param price Current SOL/USD price as Decimal
 */
export async function updateSolPrice(price: Decimal): Promise<void> {
  const timestamp = new Date();
  
  try {
    // 1. Update Redis cache (for trading - this is the source of truth for execution)
    await setPrice("SOL", price, timestamp);

    // 2. Publish price event for WebSocket broadcast
    await publishPriceUpdate("SOL", price.toString());

    // 3. Process price tick for candle aggregation (does NOT affect trading)
    const candleResult = await processPriceTick("SOL", price, timestamp, "1m");
    
    // 4. Broadcast candle update for live charting
    await publishCandleUpdate({
      asset: candleResult.currentCandle.asset,
      timeframe: candleResult.currentCandle.timeframe,
      bucketStart: candleResult.currentCandle.bucketStart,
      open: candleResult.currentCandle.open,
      high: candleResult.currentCandle.high,
      low: candleResult.currentCandle.low,
      close: candleResult.currentCandle.close,
      volume: candleResult.currentCandle.volume,
      isComplete: false, // Current candle is always in-progress
    });
    
    // 5. If a candle was closed, also broadcast it as complete
    if (candleResult.candleClosed && candleResult.closedCandle) {
      await publishCandleUpdate({
        asset: candleResult.closedCandle.asset,
        timeframe: candleResult.closedCandle.timeframe,
        bucketStart: candleResult.closedCandle.bucketStart,
        open: candleResult.closedCandle.open,
        high: candleResult.closedCandle.high,
        low: candleResult.closedCandle.low,
        close: candleResult.closedCandle.close,
        volume: candleResult.closedCandle.volume,
        isComplete: true, // Closed candle
      });
    }

    console.log(
      `Updated SOL price in Redis: $${price.toString()} at ${timestamp.toISOString()}`
    );
  } catch (error) {
    console.error("Error updating SOL price in Redis:", error);
    throw error;
  }
}

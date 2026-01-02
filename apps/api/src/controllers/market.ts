import type { Request, Response } from "express";
import { getPriceWithMetadata, SUPPORTED_SYMBOLS } from "@repo/pricing";

/**
 * GET /market/price/:symbol
 * Fetch current market price for a symbol
 *
 * Response (on success):
 * {
 *   success: true,
 *   symbol: 'SOL',
 *   price: '230.50',
 *   timestamp: '2026-01-02T14:35:42.123Z',
 *   ageMs: 1234
 * }
 *
 * Response (on failure - stale or missing):
 * {
 *   success: false,
 *   error: "Price unavailable or stale",
 *   code: "PRICE_UNAVAILABLE"
 * }
 */
export async function getPriceHandler(req: Request, res: Response) {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      res.status(400).json({
        success: false,
        error: "Missing symbol parameter",
        code: "MISSING_SYMBOL",
      });
      return;
    }

    const upperSymbol = symbol.toUpperCase();

    // Validate supported symbol
    if (!SUPPORTED_SYMBOLS.includes(upperSymbol as any)) {
      res.status(400).json({
        success: false,
        error: `Unsupported symbol: ${upperSymbol}. Supported: ${SUPPORTED_SYMBOLS.join(", ")}`,
        code: "UNSUPPORTED_SYMBOL",
      });
      return;
    }

    const metadata = await getPriceWithMetadata(upperSymbol);

    if (!metadata) {
      res.status(503).json({
        success: false,
        error: `Price unavailable or stale for ${upperSymbol}. Try again shortly.`,
        code: "PRICE_UNAVAILABLE",
      });
      return;
    }

    res.status(200).json({
      success: true,
      symbol: upperSymbol,
      price: metadata.price.toString(),
      timestamp: metadata.timestamp.toISOString(),
      ageMs: metadata.ageMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    });
  }
}

/**
 * GET /market/prices
 * Fetch current prices for all supported symbols
 *
 * Response:
 * {
 *   success: true,
 *   prices: {
 *     SOL: { price: '230.50', timestamp: '...', ageMs: 1234, available: true }
 *   }
 * }
 */
export async function getAllPricesHandler(req: Request, res: Response) {
  try {
    const prices: Record<string, {
      price: string | null;
      timestamp: string | null;
      ageMs: number;
      available: boolean;
    }> = {};

    await Promise.all(
      SUPPORTED_SYMBOLS.map(async (symbol) => {
        try {
          const metadata = await getPriceWithMetadata(symbol);
          if (metadata) {
            prices[symbol] = {
              price: metadata.price.toString(),
              timestamp: metadata.timestamp.toISOString(),
              ageMs: metadata.ageMs,
              available: true,
            };
          } else {
            prices[symbol] = {
              price: null,
              timestamp: null,
              ageMs: -1,
              available: false,
            };
          }
        } catch {
          prices[symbol] = {
            price: null,
            timestamp: null,
            ageMs: -1,
            available: false,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      prices,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    });
  }
}

/**
 * GET /market/status
 * Fetch market data availability status for all symbols
 *
 * Response:
 * {
 *   success: true,
 *   healthy: true,
 *   markets: [
 *     { symbol: 'SOL', available: true, ageMs: 1234 }
 *   ]
 * }
 */
export async function getMarketStatusHandler(req: Request, res: Response) {
  try {
    const markets = await Promise.all(
      SUPPORTED_SYMBOLS.map(async (symbol) => {
        try {
          const metadata = await getPriceWithMetadata(symbol);
          return {
            symbol,
            available: !!metadata,
            ageMs: metadata?.ageMs ?? -1,
          };
        } catch {
          return {
            symbol,
            available: false,
            ageMs: -1,
          };
        }
      })
    );

    // Overall health: all markets must be available
    const healthy = markets.every((m) => m.available);

    res.status(200).json({
      success: true,
      healthy,
      markets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    });
  }
}

import type{ Request, Response } from "express";
import { getPortfolio } from "@repo/trading";

/**
 * GET /portfolio
 * Retrieve authenticated user's complete portfolio
 *
 * Response:
 * {
 *   success: true,
 *   portfolio: {
 *     userId: 1,
 *     balances: [
 *       { asset: 'USD', available: '8849.88', locked: '0' },
 *       { asset: 'SOL', available: '5', locked: '0' }
 *     ],
 *     positions: [
 *       { asset: 'SOL', size: '5', avgEntryPrice: '240' }
 *     ],
 *     openOrders: [
 *       { id: 1, side: 'buy', status: 'pending', ... }
 *     ]
 *   }
 * }
 */

export async function getPortfolioHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).userId; // From auth middleware

    const portfolio = await getPortfolio(userId);

    if (!portfolio) {
      res.status(404).json({
        success: false,
        message: "No portfolio found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

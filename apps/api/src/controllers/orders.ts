import type { Request, Response } from "express";
import { Decimal } from "decimal.js";
import { placeOrder, getOrder, getUserOrders, getPortfolio } from "@repo/trading";
import { getPrice } from "@repo/pricing";
import { publishOrderFilled, publishPortfolioUpdate } from "@repo/events";

/**
 * POST /orders
 * Place and execute a market order immediately
 *
 * Request body:
 * {
 *   side: 'buy' | 'sell',
 *   baseAsset: 'SOL',
 *   quoteAsset: 'USD',
 *   requestedSize: '10'        // Decimal string
 * }
 *
 * Response (on success):
 * {
 *   success: true,
 *   orderId: 123,
 *   executedSize: '10',
 *   executedPrice: '230.50',
 *   feesApplied: '0.2305',
 *   status: 'filled'
 * }
 *
 * Response (on failure):
 * {
 *   success: false,
 *   error: "Error message",
 *   code?: "PRICE_UNAVAILABLE" | "INSUFFICIENT_BALANCE" | ...
 * }
 */
export async function placeOrderHandler(req: Request, res: Response) {
  try {
    const { side, baseAsset, quoteAsset, requestedSize } = req.body;
    const userId = (req as any).userId; // Set by auth middleware
    
    // Validate required fields
    if (!side || !baseAsset || !quoteAsset || !requestedSize) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: side, baseAsset, quoteAsset, requestedSize",
      });
      return;
    }

    const size = new Decimal(requestedSize);

    // Fetch current price from Redis (server-side only, never from client)
    const price = await getPrice(baseAsset);

    // Place and execute market order immediately
    const result = await placeOrder(
      userId,
      side,
      baseAsset,
      quoteAsset,
      size,
      price  // Execution price (market price at this moment)
    );

    // Publish order filled event for WebSocket broadcast
    await publishOrderFilled({
      userId,
      orderId: result.orderId,
      side,
      baseAsset,
      quoteAsset,
      executedSize: result.executedSize,
      executedPrice: result.executedPrice,
      fee: result.feesApplied,
    });

    // Publish portfolio update for WebSocket broadcast
    const portfolio = await getPortfolio(userId);
    await publishPortfolioUpdate({
      userId,
      balances: portfolio.balances.map((b) => ({
        asset: b.asset,
        available: b.available,
        locked: b.locked,
      })),
      positions: portfolio.positions.map((p) => ({
        asset: p.asset,
        size: p.size,
        avgEntryPrice: p.avgEntryPrice,
      })),
    });

    res.status(201).json({
      success: true,
      orderId: result.orderId,
      executedSize: result.executedSize,
      executedPrice: result.executedPrice,
      feesApplied: result.feesApplied,
      status: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Specific error for price issues
    if (message.includes("Price not available") || message.includes("stale")) {
      res.status(503).json({
        success: false,
        error: message,
        code: "PRICE_UNAVAILABLE",
      });
      return;
    }

    // Insufficient balance
    if (message.includes("Insufficient")) {
      res.status(400).json({
        success: false,
        error: message,
        code: "INSUFFICIENT_BALANCE",
      });
      return;
    }

    res.status(400).json({ success: false, error: message });
  }
}

/**
 * GET /orders/:orderId
 * Retrieve a single order by ID
 */
export async function getOrderHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderId } = req.params;
    const order = await getOrder(parseInt(orderId as string, 10));
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: message });
  }
}

/**
 * GET /orders
 * List all orders for authenticated user
 *
 * Response:
 * {
 *   success: true,
 *   orders: [
 *     { id: 1, side: 'buy', status: 'pending', ... },
 *     { id: 2, side: 'sell', status: 'filled', ... }
 *   ]
 * }
 */

export async function getUserOrdersHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).userId; // Assume user ID is set in req.user by auth middleware
    const orders = await getUserOrders(userId);
    if (!orders) {
      res
        .status(404)
        .json({ success: false, error: "No orders found for user" });
      return;
    }
    // Transform database orders to match frontend Order type (id -> orderId, add executedPrice/Size)
    const transformedOrders = orders.map((order) => ({
      orderId: order.id,
      side: order.side,
      status: order.status,
      baseAsset: order.baseAsset,
      quoteAsset: order.quoteAsset,
      requestedSize: order.requestedSize.toString(),
      executedPrice: order.priceAtOrderTime.toString(),
      executedSize: order.requestedSize.toString(), // For market orders, executed = requested
      feesApplied: order.feesApplied.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));
    res.status(200).json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: message });
  }
}

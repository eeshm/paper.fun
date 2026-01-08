/**
 * Order Management
 * Order placement, retrieval, status tracking
 */

import { Decimal } from "decimal.js";
import type { Decimal as DecimalInstance } from "decimal.js";
import { getDb } from "@repo/db";
import { validateOrderInput } from "./validation.js";
import { calculateFee } from "./fees.js";
import { ORDER_STATUS } from "./constants.js";

interface PlaceOrderResult {
  orderId: number;
  executedSize: string;
  executedPrice: string;
  feesApplied: string;
  status: string;
}

/**
 * Place and execute a market order immediately
 * 
 * Market orders execute instantly at market price. No pending state.
 * 
 * Flow:
 * 1. Validate input
 * 2. Lock balance for order cost
 * 3. Create order (status: FILLED)
 * 4. Execute trade (create trade record, update balances + positions)
 * 5. Return execution details
 * 
 * CRITICAL: Entire flow is atomic via Prisma transaction.
 * Prevents race conditions and ensures ledger consistency.
 */

export async function placeOrder(
  userId: number,
  side: string,
  baseAsset: string,
  quoteAsset: string,
  requestedSize: DecimalInstance,
  executionPrice: DecimalInstance
): Promise<PlaceOrderResult> {
  validateOrderInput(side, "market", baseAsset, quoteAsset, requestedSize);

  const size = new Decimal(requestedSize);
  const price = new Decimal(executionPrice);

  // Validate price > 0
  if (price.lte(0)) {
    throw new Error("Price must be > 0");
  }

  const cost = size.times(price);
  const fee = calculateFee(price, size);

  const db = getDb();

  // ATOMIC TRANSACTION: Create order + execute trade all at once
  // Use row-level locking (FOR UPDATE) to prevent double-spend
  const result = await db.$transaction(async (tx) => {
    // Lock BOTH balance rows upfront to ensure consistent ordering and prevent deadlocks
    // For BUY: need to check USDC (quote), update both USDC and SOL (base)
    // For SELL: need to check SOL (base), update both SOL and USDC
    
    // Lock quote asset (USDC) balance
    const quoteBalanceRows = await tx.$queryRaw<Array<{ id: number; available: string; locked: string }>>`
      SELECT id, available::text, locked::text 
      FROM balances 
      WHERE "userId" = ${userId} AND asset = ${quoteAsset}
      FOR UPDATE
    `;

    if (!quoteBalanceRows || quoteBalanceRows.length === 0) {
      throw new Error(`No ${quoteAsset} balance found for user ${userId}`);
    }

    const quoteBalance = quoteBalanceRows[0]!;
    const quoteAvailable = new Decimal(quoteBalance.available);
    const quoteLocked = new Decimal(quoteBalance.locked);

    // Lock base asset (SOL) balance
    const baseBalanceRows = await tx.$queryRaw<Array<{ id: number; available: string; locked: string }>>`
      SELECT id, available::text, locked::text 
      FROM balances 
      WHERE "userId" = ${userId} AND asset = ${baseAsset}
      FOR UPDATE
    `;

    let baseAvailable: Decimal;
    let baseLocked: Decimal;

    if (baseBalanceRows.length === 0) {
      // Initialize base asset balance if not exists (needed for first buy)
      await tx.balances.create({
        data: {
          userId,
          asset: baseAsset,
          available: "0",
          locked: "0",
        },
      });
      baseAvailable = new Decimal(0);
      baseLocked = new Decimal(0);
    } else {
      baseAvailable = new Decimal(baseBalanceRows[0]?.available!);
      baseLocked = new Decimal(baseBalanceRows[0]?.locked!);
    }

    // Validate balance BEFORE any updates
    if (side === "buy") {
      // BUY: Check USDC balance for cost + fee
      const totalNeeded = cost.plus(fee);
      if (quoteAvailable.lt(totalNeeded)) {
        throw new Error(
          `Insufficient balance. Need ${totalNeeded.toString()} ${quoteAsset} ` +
            `(cost: ${cost.toString()} + fee: ${fee.toString()}), ` +
            `but have ${quoteAvailable.toString()}`
        );
      }
    } else {
      // SELL: Check SOL balance for sell amount
      if (baseAvailable.lt(size)) {
        throw new Error(
          `Insufficient ${baseAsset} to sell. Have ${baseAvailable.toString()}, need ${size.toString()}`
        );
      }
    }

    // 1. Create order with FILLED status (market orders execute immediately)
    const order = await tx.orders.create({
      data: {
        userId,
        side,
        type: "market",
        baseAsset,
        quoteAsset,
        requestedSize: size.toString(),
        priceAtOrderTime: price.toString(),
        status: ORDER_STATUS.FILLED,  // Market orders filled immediately
        feesApplied: fee.toString(),
      },
    });

    // 2. Create trade record
    await tx.trades.create({
      data: {
        orderId: order.id,
        userId,
        side,
        executedPrice: price.toString(),
        executedSize: size.toString(),
        fee: fee.toString(),
      },
    });

    // 3. Update balances
    if (side === "buy") {
      // BUY: Deduct cost + fee from USDC, add SOL
      const newQuoteAvailable = quoteAvailable.minus(cost).minus(fee);
      await tx.balances.update({
        where: {
          userId_asset: { userId, asset: quoteAsset },
        },
        data: {
          available: newQuoteAvailable.toString(),
          locked: quoteLocked.toString(),
        },
      });
      
      const newBaseAvailable = baseAvailable.plus(size);
      await tx.balances.update({
        where: {
          userId_asset: { userId, asset: baseAsset },
        },
        data: {
          available: newBaseAvailable.toString(),
          locked: baseLocked.toString(),
        },
      });
    } else {
      // SELL: Deduct SOL, add proceeds (price * size - fee) to USDC
      const newBaseAvailable = baseAvailable.minus(size);
      await tx.balances.update({
        where: {
          userId_asset: { userId, asset: baseAsset },
        },
        data: {
          available: newBaseAvailable.toString(),
          locked: baseLocked.toString(),
        },
      });
      
      const proceeds = price.times(size).minus(fee);
      const newQuoteAvailable = quoteAvailable.plus(proceeds);
      await tx.balances.update({
        where: {
          userId_asset: { userId, asset: quoteAsset },
        },
        data: {
          available: newQuoteAvailable.toString(),
          locked: quoteLocked.toString(),
        },
      });
    }

    // 5. Update position
    let position = await tx.positions.findUnique({
      where: {
        userId_asset: { userId, asset: baseAsset },
      },
    });

    if (!position) {
      // Initialize position
      position = await tx.positions.create({
        data: {
          userId,
          asset: baseAsset,
          size: "0",
          avgEntryPrice: "0",
        },
      });
    }

    const posSize = new Decimal(position.size);
    const posAvg = new Decimal(position.avgEntryPrice);

    let newSize: DecimalInstance;
    let newAvg: DecimalInstance;

    if (side === "buy") {
      newSize = posSize.plus(size);
      // Update average entry price
      newAvg = posSize.isZero()
        ? price
        : posSize.times(posAvg).plus(price.times(size)).dividedBy(newSize);
    } else {
      newSize = posSize.minus(size);
      // Reset avg entry price if position closed
      newAvg = newSize.isZero() ? new Decimal(0) : posAvg;
    }

    await tx.positions.update({
      where: {
        userId_asset: { userId, asset: baseAsset },
      },
      data: {
        size: newSize.toString(),
        avgEntryPrice: newAvg.toString(),
      },
    });

    return {
      orderId: order.id,
      executedSize: size.toString(),
      executedPrice: price.toString(),
      feesApplied: fee.toString(),
      status: ORDER_STATUS.FILLED,
    };
  });

  return result;
}

/**
 * Get single order by ID
 */
export async function getOrder(orderId: number) {
  const db = getDb();
  return await db.orders.findUnique({
    where: {
      id: orderId,
    },
  });
}

/**
 * Get all orders for a user, sorted by newest first
 */
export async function getUserOrders(userId: number) {
  const db = getDb();
  return await db.orders.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

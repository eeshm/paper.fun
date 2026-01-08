import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getApiClient, shutdownApiClient } from "../setup/testServer.ts";
import { createTestWallet, signMessage, type TestWallet } from "../helpers/wallet.ts";
import { setTestPrice } from "../helpers/price.ts";
import type { SuperTest, Test } from "supertest";
import { Decimal } from "decimal.js";

/**
 * P&L and Position Tests (E2E)
 *
 * Tests:
 * 1. Average entry price calculation across multiple buys at different prices
 * 2. Unrealized P&L calculation (current price vs avg entry)
 * 3. Realized P&L when selling
 * 4. Position building and partial selling
 * 5. Edge cases: closing full position, re-entering
 */

describe("P&L and Position Calculations (E2E)", () => {
  let api: SuperTest<Test>;

  // Helper to authenticate
  const authenticate = async (testWallet: TestWallet): Promise<string> => {
    const nonceRes = await api
      .post("/auth/nonce")
      .query({ walletAddress: testWallet.publicKey })
      .send({ walletAddress: testWallet.publicKey });

    const { nonce } = nonceRes.body;
    const message = `Sign this nonce: ${nonce}`;
    const signature = signMessage(testWallet, message);

    const loginRes = await api.post("/auth/login").send({
      walletAddress: testWallet.publicKey,
      signature,
      nonce,
    });

    return loginRes.body.token;
  };

  // Helper to get portfolio
  const getPortfolio = async (token: string) => {
    const res = await api
      .get("/portfolio")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    return res.body.portfolio;
  };

  // Helper to place order
  const placeOrder = async (
    token: string,
    side: "buy" | "sell",
    size: string
  ) => {
    const res = await api
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        side,
        baseAsset: "SOL",
        quoteAsset: "USDC",
        requestedSize: size,
      });
    return res;
  };

  beforeAll(async () => {
    api = await getApiClient();
  });

  afterAll(async () => {
    await shutdownApiClient();
  });

  describe("Average Entry Price Calculations", () => {
    test("first buy sets avgEntryPrice to execution price", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);
      await setTestPrice("SOL", "100");

      // Buy 2 SOL at $100
      const buyRes = await placeOrder(token, "buy", "2");
      expect(buyRes.status).toBe(201);

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      expect(solPosition.size).toBe("2");
      expect(solPosition.avgEntryPrice).toBe("100");
    });

    test("second buy at different price updates avgEntryPrice correctly", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 2 SOL at $100
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "2");

      // Buy 3 SOL at $150
      await setTestPrice("SOL", "150");
      await placeOrder(token, "buy", "3");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // avgEntryPrice = (2 * 100 + 3 * 150) / 5 = (200 + 450) / 5 = 130
      expect(solPosition.size).toBe("5");
      expect(solPosition.avgEntryPrice).toBe("130");
    });

    test("multiple buys at various prices calculates weighted average", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Build position across 4 buys
      // Buy 1: 1 SOL @ $80
      await setTestPrice("SOL", "80");
      await placeOrder(token, "buy", "1");

      // Buy 2: 2 SOL @ $100
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "2");

      // Buy 3: 1 SOL @ $120
      await setTestPrice("SOL", "120");
      await placeOrder(token, "buy", "1");

      // Buy 4: 1 SOL @ $90
      await setTestPrice("SOL", "90");
      await placeOrder(token, "buy", "1");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Total: 5 SOL
      // Total cost: 1*80 + 2*100 + 1*120 + 1*90 = 80 + 200 + 120 + 90 = 490
      // avgEntryPrice = 490 / 5 = 98
      expect(solPosition.size).toBe("5");
      expect(solPosition.avgEntryPrice).toBe("98");
    });

    test("partial sell does not change avgEntryPrice", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 4 SOL at $100
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "4");

      // Sell 1 SOL (price doesn't affect avgEntry for sells)
      await setTestPrice("SOL", "150");
      await placeOrder(token, "sell", "1");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // avgEntryPrice should remain $100 (unchanged by sells)
      expect(solPosition.size).toBe("3");
      expect(solPosition.avgEntryPrice).toBe("100");
    });

    test("closing full position resets avgEntryPrice to 0", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 2 SOL at $100
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "2");

      // Sell all 2 SOL
      await placeOrder(token, "sell", "2");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Position closed, avgEntryPrice reset
      expect(solPosition.size).toBe("0");
      expect(solPosition.avgEntryPrice).toBe("0");
    });

    test("re-entering after closing starts fresh avgEntryPrice", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 2 SOL at $100
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "2");

      // Sell all 2 SOL
      await placeOrder(token, "sell", "2");

      // Re-enter: Buy 3 SOL at $200
      await setTestPrice("SOL", "200");
      await placeOrder(token, "buy", "3");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // New avgEntryPrice should be fresh $200, not influenced by old position
      expect(solPosition.size).toBe("3");
      expect(solPosition.avgEntryPrice).toBe("200");
    });
  });

  describe("P&L Calculations", () => {
    test("calculates unrealized P&L (profit) when price increases", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 5 SOL at $100 (cost = $500 + $0.50 fee)
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "5");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Current price for unrealized P&L: $150
      await setTestPrice("SOL", "150");

      // Unrealized P&L = (currentPrice - avgEntryPrice) * size
      // = (150 - 100) * 5 = $250 profit
      const currentPrice = new Decimal("150");
      const avgEntry = new Decimal(solPosition.avgEntryPrice);
      const size = new Decimal(solPosition.size);
      const unrealizedPnL = currentPrice.minus(avgEntry).times(size);

      expect(unrealizedPnL.toString()).toBe("250");
    });

    test("calculates unrealized P&L (loss) when price decreases", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 4 SOL at $100 (cost = $400 + $0.40 fee)
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "4");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Current price dropped to $80
      await setTestPrice("SOL", "80");

      // Unrealized P&L = (80 - 100) * 4 = -$80 loss
      const currentPrice = new Decimal("80");
      const avgEntry = new Decimal(solPosition.avgEntryPrice);
      const size = new Decimal(solPosition.size);
      const unrealizedPnL = currentPrice.minus(avgEntry).times(size);

      expect(unrealizedPnL.toString()).toBe("-80");
    });

    test("calculates realized P&L on profitable sell", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 3 SOL at $100 (cost = $300 + $0.30 fee = $300.30)
      await setTestPrice("SOL", "100");
      const buyRes = await placeOrder(token, "buy", "3");
      const buyFee = new Decimal(buyRes.body.feesApplied);

      // Get starting USDC after buy
      let portfolio = await getPortfolio(token);
      const usdcAfterBuy = new Decimal(
        portfolio.balances.find((b: any) => b.asset === "USDC").available
      );

      // Sell 3 SOL at $150 (proceeds = $450 - $0.45 fee = $449.55)
      await setTestPrice("SOL", "150");
      const sellRes = await placeOrder(token, "sell", "3");
      expect(sellRes.status).toBe(201);
      const sellFee = new Decimal(sellRes.body.feesApplied);

      portfolio = await getPortfolio(token);
      const usdcAfterSell = new Decimal(
        portfolio.balances.find((b: any) => b.asset === "USDC").available
      );

      // Realized P&L = (sellPrice - avgEntryPrice) * size - totalFees
      // = (150 - 100) * 3 - (0.30 + 0.45) = 150 - 0.75 = $149.25
      // Or: USDC gained from round trip = usdcAfterSell - 1000 (initial)
      // = 1000 - 300.30 (after buy) + 449.55 (after sell) = 1149.25 - 1000 = $149.25
      const totalFees = buyFee.plus(sellFee);
      const grossProfit = new Decimal("50").times("3"); // (150-100) * 3
      const realizedPnL = grossProfit.minus(totalFees);

      expect(realizedPnL.toString()).toBe("149.25");

      // Verify USDC balance matches
      const expectedUsdc = new Decimal("1000")
        .minus(new Decimal("300").plus(buyFee)) // after buy
        .plus(new Decimal("450").minus(sellFee)); // after sell
      expect(usdcAfterSell.toString()).toBe(expectedUsdc.toString());
    });

    test("calculates realized P&L on losing sell", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 2 SOL at $120
      await setTestPrice("SOL", "120");
      const buyRes = await placeOrder(token, "buy", "2");
      const buyFee = new Decimal(buyRes.body.feesApplied);

      // Sell 2 SOL at $80 (loss)
      await setTestPrice("SOL", "80");
      const sellRes = await placeOrder(token, "sell", "2");
      const sellFee = new Decimal(sellRes.body.feesApplied);

      // Realized P&L = (80 - 120) * 2 - fees = -80 - 0.40 = -$80.40
      const totalFees = buyFee.plus(sellFee);
      const grossLoss = new Decimal("-40").times("2"); // (80-120) * 2
      const realizedPnL = grossLoss.minus(totalFees);

      // buyFee = 0.1% * 240 = 0.24
      // sellFee = 0.1% * 160 = 0.16
      // totalFees = 0.40
      expect(totalFees.toString()).toBe("0.4");
      expect(realizedPnL.toString()).toBe("-80.4");
    });

    test("partial sell realizes partial P&L", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy 5 SOL at $100 (cost = 500 + 0.5 fee = 500.5, within 1000 budget)
      await setTestPrice("SOL", "100");
      const buyRes = await placeOrder(token, "buy", "5");
      expect(buyRes.status).toBe(201);

      let portfolio = await getPortfolio(token);

      // Sell 2 SOL at $125 (partial)
      await setTestPrice("SOL", "125");
      const sellRes = await placeOrder(token, "sell", "2");
      expect(sellRes.status).toBe(201);
      const sellFee = new Decimal(sellRes.body.feesApplied);

      portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Remaining position
      expect(solPosition.size).toBe("3");
      expect(solPosition.avgEntryPrice).toBe("100"); // unchanged

      // Realized on this sell: (125 - 100) * 2 = $50 gross profit
      // sellFee = 0.1% * 250 = 0.25
      expect(sellFee.toString()).toBe("0.25");
    });
  });

  describe("Complex Position Scenarios", () => {
    test("dollar-cost averaging over multiple price levels", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // DCA: Buy equal amounts at different prices
      // Buy 1 SOL at $80, $90, $100, $110, $120
      const prices = ["80", "90", "100", "110", "120"];

      for (const price of prices) {
        await setTestPrice("SOL", price);
        const res = await placeOrder(token, "buy", "1");
        expect(res.status).toBe(201);
      }

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // 5 SOL total
      // avgEntryPrice = (80 + 90 + 100 + 110 + 120) / 5 = 500 / 5 = 100
      expect(solPosition.size).toBe("5");
      expect(solPosition.avgEntryPrice).toBe("100");
    });

    test("scaling into position then scaling out", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Scale in: increasing position size as price drops
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "1"); // 1 @ 100

      await setTestPrice("SOL", "90");
      await placeOrder(token, "buy", "2"); // 2 @ 90

      await setTestPrice("SOL", "80");
      await placeOrder(token, "buy", "3"); // 3 @ 80

      // avgEntry = (1*100 + 2*90 + 3*80) / 6 = (100 + 180 + 240) / 6 = 520/6 = 86.666...
      let portfolio = await getPortfolio(token);
      let solPosition = portfolio.positions.find((p: any) => p.asset === "SOL");

      expect(solPosition.size).toBe("6");
      const avgEntry = new Decimal(solPosition.avgEntryPrice);
      // 520/6 = 86.66666666...
      expect(avgEntry.toFixed(8)).toBe("86.66666667");

      // Scale out: sell half at profit
      await setTestPrice("SOL", "95");
      await placeOrder(token, "sell", "3");

      portfolio = await getPortfolio(token);
      solPosition = portfolio.positions.find((p: any) => p.asset === "SOL");

      // avgEntry unchanged after sell
      expect(solPosition.size).toBe("3");
      expect(new Decimal(solPosition.avgEntryPrice).toFixed(8)).toBe(
        "86.66666667"
      );
    });

    test("full round trip: buy, hold, sell all", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Initial USDC
      let portfolio = await getPortfolio(token);
      const initialUsdc = new Decimal(
        portfolio.balances.find((b: any) => b.asset === "USDC").available
      );
      expect(initialUsdc.toString()).toBe("1000");

      // Buy 5 SOL at $100
      await setTestPrice("SOL", "100");
      const buyRes = await placeOrder(token, "buy", "5");
      const buyFee = new Decimal(buyRes.body.feesApplied);

      // Sell all 5 SOL at $100 (break-even before fees)
      const sellRes = await placeOrder(token, "sell", "5");
      const sellFee = new Decimal(sellRes.body.feesApplied);

      portfolio = await getPortfolio(token);
      const finalUsdc = new Decimal(
        portfolio.balances.find((b: any) => b.asset === "USDC").available
      );

      // Should have lost only fees
      const totalFees = buyFee.plus(sellFee);
      const expectedUsdc = initialUsdc.minus(totalFees);
      expect(finalUsdc.toString()).toBe(expectedUsdc.toString());

      // Position should be closed
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );
      expect(solPosition.size).toBe("0");
      expect(solPosition.avgEntryPrice).toBe("0");
    });

    test("accumulate-distribute pattern", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Accumulate: 3 buys at increasing prices
      await setTestPrice("SOL", "95");
      await placeOrder(token, "buy", "2");

      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "2");

      await setTestPrice("SOL", "105");
      await placeOrder(token, "buy", "2");

      // avgEntry = (2*95 + 2*100 + 2*105) / 6 = 600/6 = 100
      let portfolio = await getPortfolio(token);
      let solPosition = portfolio.positions.find((p: any) => p.asset === "SOL");
      expect(solPosition.avgEntryPrice).toBe("100");

      // Distribute: 3 sells at higher prices
      await setTestPrice("SOL", "110");
      await placeOrder(token, "sell", "2");

      await setTestPrice("SOL", "115");
      await placeOrder(token, "sell", "2");

      await setTestPrice("SOL", "120");
      await placeOrder(token, "sell", "2");

      portfolio = await getPortfolio(token);
      solPosition = portfolio.positions.find((p: any) => p.asset === "SOL");

      // Position closed
      expect(solPosition.size).toBe("0");
      expect(solPosition.avgEntryPrice).toBe("0");

      // Verify profit was made
      const finalUsdc = new Decimal(
        portfolio.balances.find((b: any) => b.asset === "USDC").available
      );
      // Gross profit = (110-100)*2 + (115-100)*2 + (120-100)*2 = 20 + 30 + 40 = 90
      // Minus fees (~1.2 total)
      expect(finalUsdc.gt(new Decimal("1088"))).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("handles minimum position size (0.01)", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // MIN_POSITION_SIZE = 0.01 per env config
      await setTestPrice("SOL", "100");
      const res = await placeOrder(token, "buy", "0.01");
      expect(res.status).toBe(201);

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      expect(solPosition.size).toBe("0.01");
      expect(solPosition.avgEntryPrice).toBe("100");
    });

    test("rejects order below minimum size", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      await setTestPrice("SOL", "100");
      const res = await placeOrder(token, "buy", "0.001");
      // Should be rejected due to MIN_POSITION_SIZE
      expect(res.status).toBe(400);
    });

    test("handles high precision average prices", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Buy at prices that create repeating decimal average
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "1");

      await setTestPrice("SOL", "101");
      await placeOrder(token, "buy", "1");

      await setTestPrice("SOL", "99");
      await placeOrder(token, "buy", "1");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // avgEntry = (100 + 101 + 99) / 3 = 300 / 3 = 100
      expect(solPosition.size).toBe("3");
      expect(solPosition.avgEntryPrice).toBe("100");
    });

    test("avgEntryPrice uses 2 decimal precision (matching price feed)", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Price is normalized to 2 decimals by the price helper
      // This matches real trading where prices typically have limited precision
      await setTestPrice("SOL", "99.12345678");
      const res = await placeOrder(token, "buy", "1");
      expect(res.status).toBe(201);

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Price is truncated to 2 decimals by setTestPrice helper
      expect(solPosition.avgEntryPrice).toBe("99.12");
    });

    test("accumulates from zero after full sell multiple times", async () => {
      const wallet = createTestWallet();
      const token = await authenticate(wallet);

      // Round trip 1
      await setTestPrice("SOL", "100");
      await placeOrder(token, "buy", "1");
      await placeOrder(token, "sell", "1");

      // Round trip 2
      await setTestPrice("SOL", "150");
      await placeOrder(token, "buy", "2");
      await placeOrder(token, "sell", "2");

      // Round trip 3 - keep position
      await setTestPrice("SOL", "80");
      await placeOrder(token, "buy", "3");

      const portfolio = await getPortfolio(token);
      const solPosition = portfolio.positions.find(
        (p: any) => p.asset === "SOL"
      );

      // Fresh entry at $80
      expect(solPosition.size).toBe("3");
      expect(solPosition.avgEntryPrice).toBe("80");
    });
  });
});

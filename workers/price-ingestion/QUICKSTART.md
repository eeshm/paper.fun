# Price Worker Quick Start

## TL;DR

```bash
# Start the worker
cd workers/price-ingestion && bun run dev

# Verify it's working
redis-cli
> GET trading:price:SOL
> GET trading:price:SOL:ts

# Use price in your app
import { getPrice } from '@repo/pricing';
const price = await getPrice('SOL');
```

---

## What It Does

1. **Every 10 seconds**: Fetches SOL/USD from Pyth Network
2. **Stores in Redis**:
   - `trading:price:SOL` → price (e.g., "230.50")
   - `trading:price:SOL:ts` → timestamp (e.g., "2026-01-02T14:35:42.123Z")
3. **API reads it**: When placing orders, price is fetched from Redis

---

## Data Flow

```
Pyth API → fetchSolPriceFromPyth() → Redis → getPrice() → Order Execution
```

---

## Commands

| Task | Command |
|------|---------|
| **Start worker** | `cd workers/price-ingestion && bun run dev` |
| **Build** | `bun run build` |
| **Type check** | `bun run check-types` |
| **Check current price** | `redis-cli GET trading:price:SOL` |
| **Check freshness** | `redis-cli GET trading:price:SOL:ts` |
| **Delete stale price** | `redis-cli DEL trading:price:SOL trading:price:SOL:ts` |
| **View all prices** | `redis-cli KEYS trading:price:*` |

---

## How to Use in Your Code

### Get latest price
```typescript
import { getPrice } from '@repo/pricing';

const solPrice = await getPrice('SOL');  // Throws if stale or missing
console.log(`$${solPrice.toString()}`);  // "230.50"
```

### Get price with age info
```typescript
import { getPriceWithMetadata } from '@repo/pricing';

const data = await getPriceWithMetadata('SOL');
if (data) {
  console.log(`Price: $${data.price}`);
  console.log(`Age: ${data.ageMs}ms`);
}
```

### Check if price is available
```typescript
import { hasPriceAvailable } from '@repo/pricing';

if (await hasPriceAvailable('SOL')) {
  // Safe to use getPrice()
}
```

---

## Config

### Change Update Frequency

Edit `workers/price-ingestion/src/index.ts`:
```typescript
const PRICE_UPDATE_INTERVAL_MS = 10 * 1000;  // Change this (in milliseconds)
```

### Change Stale Timeout

Edit `packages/pricing/src/constants.ts`:
```typescript
export const PRICE_STALE_THRESHOLD_MS = 30 * 1000;  // 30 seconds
```

---

## Logging

```
[2026-01-02T14:35:42.123Z] [WORKER] [Iteration 1] Updated SOL price: $230.50
[2026-01-02T14:35:52.456Z] [WORKER] [Iteration 2] Updated SOL price: $230.51
[2026-01-02T14:36:42.789Z] [WORKER] [Iteration 6] SOL price unchanged at $230.51
```

- **Shows price changes** (useful for debugging)
- **Status every 60s** if unchanged (health check)
- **Errors logged** but worker continues

---

## Redis Keys Reference

| Key | Example Value | Used By |
|-----|---|---|
| `trading:price:SOL` | `"230.50"` | Order placement, P&L calculations |
| `trading:price:SOL:ts` | `"2026-01-02T14:35:42.123Z"` | Staleness validation |

---

## Troubleshooting

```bash
# Is Redis running?
redis-cli ping
# Should respond: PONG

# Is worker running?
# Check console for logs, should see updates every 10 seconds

# Is price stale?
redis-cli GET trading:price:SOL:ts
# If missing or >30 seconds old, worker may be down

# Can't connect to Pyth?
curl "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
# Should return JSON with price data
```

---

## Next: Add More Tokens

1. Find price feed ID from [Pyth docs](https://docs.pyth.network/price-feeds/price-feeds)
2. Add to `src/pyth.ts` (create `fetchEthPriceFromPyth()`)
3. Call both in `src/index.ts`'s `loop()`
4. Use `await getPrice('ETH')` in your app

Done! 🚀

# Solana Paper Trading Platform — Copilot Guidance

## Quick Reference

**This is a production-grade paper trading platform.** Architectural discipline is non-negotiable.

### Key Principle
- **Wallet = Identity only** (not funds, not balance)
- All funds/balances are virtual, stored in Postgres
- Signing used for auth, never for spending

---

## Project Structure

```
paper-trading/
├── apps/
│   ├── api/                 # Express REST API (port 3000)
│   ├── ws/                  # WebSocket server (port 3001)
│   └── web/                 # Next.js frontend (port 3002) [TODO]
├── packages/
│   ├── db/                  # Prisma + PostgreSQL (singleton)
│   ├── redis/               # Redis client + keys + pub/sub
│   ├── auth/                # Wallet signing, sessions, nonces
│   ├── trading/             # Orders, positions, portfolio
│   ├── pricing/             # Price cache (get/set from Redis)
│   ├── events/              # Redis pub/sub event publishing
│   ├── env/                 # Zod-validated environment config
│   ├── ui/                  # Shared UI components [TODO]
│   └── typescript-config/   # Shared TS configs
├── workers/
│   └── price-ingestion/     # Pyth network price feed worker
├── tests/
│   └── e2e/                 # 89 E2E tests (Vitest + Supertest)
└── prisma/
    └── schema.prisma        # Database schema
```

---

## Development Workflow

### Build & Run
```bash
bun install               # Install dependencies
bun run build             # Build all packages (turbo)
bun run dev               # Start all dev servers
bun run dev:api           # Start API only
bun run dev:ws            # Start WebSocket only
bun run dev:price         # Start price worker only
bun run check-types       # Type check all
bun run lint              # Lint all
```

### Testing
```bash
bun run test              # Run all tests
bun run test:e2e          # Run E2E tests only (89 tests)
npx vitest run tests/e2e/flows/  # Run specific test folder
```

### Database Workflow
```bash
bun run migrate:dev       # Create/apply migrations
bun run migrate:deploy    # Deploy migrations (production)
bunx prisma studio        # Visual database explorer
```

### Infrastructure (Docker)
```bash
# Development
docker run -d --name postgres-dev -p 5432:5432 -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=paper_trading postgres:16
docker run -d --name redis-dev -p 6379:6379 redis:7

# Testing (separate DB)
docker run -d --name postgres-test -p 5433:5432 -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=paper_trading_test postgres:16
```

### Ports
```
API:              localhost:3000
WebSocket:        localhost:3001
Frontend:         localhost:3002 [TODO]
PostgreSQL:       localhost:5432
PostgreSQL Test:  localhost:5433
Redis:            localhost:6379
```

---

## Architecture (Enforce These)

### Package Ownership Rules
| Layer | Owner | Rule |
|-------|-------|------|
| **Transport** | `apps/api`, `apps/ws` | HTTP/WS only, no business logic |
| **Business Logic** | `packages/*` | Pure functions, no Express imports |
| **Database** | `@repo/db` only | Singleton PrismaClient |
| **Caching/Pub/Sub** | `@repo/redis` only | All Redis access here |
| **Auth** | `@repo/auth` | Wallet signing, sessions, nonces |
| **Trading** | `@repo/trading` | Orders, positions, portfolio |
| **Pricing** | `@repo/pricing` | Price get/set from Redis |
| **Events** | `@repo/events` | Pub/sub event publishing |

**NEVER violate these boundaries.** No app may instantiate its own DB or Redis client.

### Pattern: Infrastructure Layer

All infrastructure packages follow the **singleton + health check** pattern:

```typescript
// @repo/db example (FOLLOW THIS PATTERN)
let prisma: PrismaClient | null = null;

export const initDb = async () => {
  prisma = new PrismaClient({...});
  await prisma.$queryRaw`SELECT 1`; // Fail fast
};

export const getDb = () => {
  if (!prisma) throw new Error('Not initialized');
  return prisma;
};

export const checkDbHealth = async () => { /* ... */ };
export const shutdownDb = async () => { /* ... */ };
```

Apply the same to `@repo/redis`: `initRedis()`, `getRedis()`, `isRedisHealthy()`.

### API Layer Structure (apps/api)

```
apps/api/src/
├── index.ts              # App creation, server startup
├── middlewares/          # Auth, rate limiting, validation, errors
├── routes/               # Route definitions only
├── controllers/          # Request → delegate → respond
├── schemas/              # Zod validation schemas
└── services/             # Business logic (import from @repo/*)
```

**Rule**: Routes call Controllers, Controllers call Domain Services.  
Controllers never touch DB—they call functions exported from `@repo/*`.

### Data Flow: Place Order
```
POST /orders
  ↓ rateLimit middleware (Redis-based)
  ↓ authMiddleware (validate session)
  ↓ validate middleware (Zod schema)
  ↓ placeOrderHandler (controller)
  ↓ placeOrder() from @repo/trading
    ↓ Lock rows with SELECT FOR UPDATE
    ↓ Validate balance (USDC for buy, SOL for sell)
    ↓ Create order + trade + update balances (atomic)
    ↓ Update position with weighted avg price
  ↓ publishOrderFilled() from @repo/events
  ↓ publishPortfolioUpdate() from @repo/events
  ↓ Return response
```

### WebSocket Flow
```
Client connects to WS server (port 3001)
  ↓ Send { type: "auth", token: "..." }
  ↓ Server validates session via @repo/auth
  ↓ Send { type: "subscribe", channel: "prices" }
  ↓ Server adds client to channel
  
Price worker publishes to Redis
  ↓ WS server receives via Redis subscription
  ↓ Broadcasts to all subscribed clients
```

---

## Implementation Status

### ✅ Complete
- **@repo/db**: Prisma + PostgreSQL, migrations, singleton client
- **@repo/redis**: Client, health checks, keys, pub/sub channels
- **@repo/auth**: Wallet signature verification, sessions, nonces
- **@repo/trading**: Orders, positions, portfolio, row-level locking
- **@repo/pricing**: Price get/set/seed from Redis, OHLC candle aggregation
- **@repo/events**: Pub/sub publishing (price, order, portfolio, candle)
- **@repo/env**: Zod-validated environment config
- **apps/api**: REST API with all endpoints, rate limiting, validation
- **apps/ws**: WebSocket server with real-time updates
- **workers/price-ingestion**: Pyth network price feed + candle aggregation
- **Security**: Rate limiting, input validation (Zod), Helmet, CORS
- **Graceful shutdown**: Handle SIGTERM, drain connections
- **Tests**: 89 E2E tests (auth, trading, concurrency, P&L, WebSocket)

### 🚧 TODO
- **apps/web**: Next.js frontend
- **@repo/ui**: Shared UI components
- **Audit triggers**: Postgres triggers for immutable trade logs
- **Row-level security**: Users access only their data
- **Metrics**: Prometheus endpoints

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/nonce` | No | Get signing nonce |
| POST | `/auth/login` | No | Login with signature |
| POST | `/auth/logout` | Yes | Logout, invalidate session |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Yes | Place market order |
| GET | `/orders` | Yes | List user's orders |
| GET | `/orders/:orderId` | Yes | Get single order |

### Portfolio
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/portfolio` | Yes | Get balances + positions |

### Market
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/market/price/:symbol` | No | Get current price |
| GET | `/market/status` | No | Get market status |
| GET | `/market/candles` | No | Get historical OHLC candles |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | DB + Redis health |

---

## WebSocket Messages

### Client → Server
```typescript
{ type: "auth", token: string }
{ type: "subscribe", channel: "prices" | "orders" | "portfolio" }
{ type: "unsubscribe", channel: string }
{ type: "ping" }
```

### Server → Client
```typescript
{ type: "auth", success: boolean, userId?: number }
{ type: "subscribed", channel: string }
{ type: "unsubscribed", channel: string }
{ type: "pong" }
{ type: "price", symbol: string, price: string, timestamp: string }
{ type: "order_filled", orderId: number, executedPrice: string, executedSize: string, fee: string }
{ type: "portfolio", balances: [], positions: [] }
```

---

## Trading Rules

### Supported Assets
- **SOL** - Solana token (tradeable)
- **USDC** - Virtual USD stablecoin (quote currency)

### Order Types
- **Market orders only** - Instant execution at current price

### Fees
- **0.1%** of trade value (executedPrice × executedSize)

### Initial Balance
- **$1,000 USDC** for new users (paper trading)

### Position Rules
- **Long only** - No short selling
- **Minimum size**: 0.01 SOL
- **avgEntryPrice**: Weighted average, resets to 0 when fully closed

---

## Common Patterns

### Accessing Infrastructure
```typescript
// ✅ CORRECT: Inside a domain package
import { getDb } from '@repo/db';
import { client as redis } from '@repo/redis';

export const getUserBalance = async (userId: number) => {
  const db = getDb();
  return await db.balances.findMany({ where: { userId } });
};

// ❌ WRONG: Creating your own client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // VIOLATION
```

### Health Checks (for /health endpoint)
```typescript
import { checkDbHealth } from '@repo/db';
import { isRedisHealthy } from '@repo/redis';

const [db, redis] = await Promise.all([
  checkDbHealth(),
  isRedisHealthy(),
]);
if (!db.ok || !redis.ok) return res.status(503).json({...});
```

### Fail-Fast Startup
```typescript
// apps/api/src/index.ts - MUST follow this
await initDb();     // Throws if Postgres down
await initRedis();  // Throws if Redis down
// Only then listen for traffic
app.listen(port, () => console.log(`Listening on ${port}`));
```

---

## Concurrency Safety (CRITICAL)

### Row-Level Locking
All balance updates use `SELECT ... FOR UPDATE`:
```typescript
// Lock BOTH quote and base asset rows upfront
const quoteBalanceRows = await tx.$queryRaw<Array<{...}>>`
  SELECT id, available::text, locked::text 
  FROM balances 
  WHERE "userId" = ${userId} AND asset = ${quoteAsset}
  FOR UPDATE
`;

const baseBalanceRows = await tx.$queryRaw<Array<{...}>>`
  SELECT id, available::text, locked::text 
  FROM balances 
  WHERE "userId" = ${userId} AND asset = ${baseAsset}
  FOR UPDATE
`;
```

### Portfolio Initialization
Uses advisory locks to prevent race conditions:
```typescript
await tx.$queryRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)::text`;
```

### Why This Matters
- Two concurrent BUY orders can't double-spend the same USDC
- Two concurrent SELL orders can't sell more SOL than available
- Portfolio init during concurrent logins won't create duplicates

---

## Testing

### Test Structure (89 E2E tests)
```
tests/e2e/
├── flows/
│   ├── auth.test.ts        # 9 tests - login, logout, nonce
│   ├── trading.test.ts     # 13 tests - buy, sell, fees
│   ├── realtime.test.ts    # 16 tests - WebSocket, subscriptions
│   ├── failure.test.ts     # 24 tests - error handling
│   ├── concurrency.test.ts # 7 tests - double-spend, race conditions
│   └── pnl.test.ts         # 20 tests - P&L, avg entry price
├── helpers/
│   ├── wallet.ts           # Ed25519 test wallet creation
│   ├── price.ts            # Price injection
│   └── auth.ts             # Auth helpers
└── setup/
    ├── testServer.ts       # API test server
    └── testWsServer.ts     # WS test server
```

### Running Tests
```bash
# Ensure test DB is running
docker run -d --name postgres-test -p 5433:5432 -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=paper_trading_test postgres:16

# Run all tests
bun run test

# Run specific suite
npx vitest run tests/e2e/flows/trading.test.ts
```

---

## Debugging

### Check Infrastructure Health
```bash
# Postgres
bunx prisma studio   # Visual DB explorer

# Redis
redis-cli
> PING
> KEYS *              # See all keys
> GET trading:price:SOL  # Check price
```

### Turbo Graph
```bash
turbo run build --graph   # Visualize dependency graph
```

---

## When Adding New Features

**Checklist:**
1. Does it touch infrastructure (DB/Redis)? → Add to @repo/db or @repo/redis
2. Does it have business logic? → Create @repo/new-domain package
3. Does an app need this? → Export from domain package, import in app
4. Does it need a database table? → Update prisma/schema.prisma, then `bun run migrate:dev`
5. Is there cross-app communication? → Use Redis Pub/Sub via @repo/events
6. Does it fail gracefully? → Add health check, fail fast on startup
7. Add E2E tests in tests/e2e/flows/

---

## Critical Files to Review
- [prisma/schema.prisma](prisma/schema.prisma) — Database schema
- [packages/db/src/index.ts](packages/db/src/index.ts) — Singleton pattern
- [packages/trading/src/orders.ts](packages/trading/src/orders.ts) — Order execution with locking
- [packages/trading/src/portfolio.ts](packages/trading/src/portfolio.ts) — Portfolio init
- [apps/api/src/index.ts](apps/api/src/index.ts) — API startup flow
- [apps/ws/src/index.ts](apps/ws/src/index.ts) — WebSocket server
- [packages/redis/src/keys.ts](packages/redis/src/keys.ts) — Redis key naming
- [turbo.json](turbo.json) — Build configuration
- [apps/api/src/index.ts](apps/api/src/index.ts) — Startup flow
- [turbo.json](turbo.json) — Build configuration
- [packages/redis/src/keys.ts](packages/redis/src/keys.ts) — Redis key naming strategy

---

## Redis Key Reference

All Redis keys follow the pattern: `trading:<domain>:<entity>:<id>`

| Domain | Key Pattern | Purpose |
|--------|-------------|---------|
| **Price** | `trading:price:SOL` | Store current SOL price |
| **Price** | `trading:price:{symbol}` | Store token prices |
| **Session** | `trading:session:{token}` | Cache session data (user ID, session ID) |
| **Session** | `trading:session:tokens:{walletAddress}` | Track user's session tokens |
| **WebSocket** | `trading:ws:user:{walletAddress}` | Track WS connections per user |
| **WebSocket** | `trading:ws:connections:{walletAddress}` | List active connections |
| **RateLimit** | `trading:ratelimit:wallet:{walletAddress}` | Rate limit per wallet |
| **RateLimit** | `trading:ratelimit:api:{requestId}` | Rate limit per API request |
| **Nonce** | `trading:nonce:{walletAddress}:{nonce}` | One-time signature nonce (10-minute expiry) |
| **Trading** | `trading:trading:portfolio:{walletAddress}` | User's portfolio cache |
| **Trading** | `trading:trading:position:{walletAddress}:{positionId}` | Individual position cache |
| **Trading** | `trading:trading:positions:open:{walletAddress}` | List of open positions |
| **Trading** | `trading:trading:positions:closed:{walletAddress}` | List of closed positions |
| **Cache** | `trading:cache:profile:{walletAddress}` | User profile cache |
| **Cache** | `trading:cache:market:{symbol}` | Market data cache |

**Usage**: Import from `@repo/redis`:
```typescript
import { redisKeys } from '@repo/redis';

const sessionKey = redisKeys.SESSION.userSession(token);
const priceKey = redisKeys.PRICE.solPrice();
```

---

## Trading Invariants (Must Be Enforced in Code)

**These cannot rely on Postgres alone—application layer is responsible.**

### Balance Integrity
- **`available >= 0` and `locked >= 0`** at all times  
  - Where: Before any UPDATE to balances in `placeOrder()`, `fillOrder()`  
  - Bug if violated: User balance goes negative, USD vanishes, ledger breaks  
  - Prevention: Use `SELECT ... FOR UPDATE` (row-level lock) in transaction  

### Order Validation
- **`requestedSize > 0`** — No zero-size orders  
  - Where: `placeOrder()` input validation  
  - Bug if violated: Division by zero in fee calculation  
  
- **`side IN ('buy', 'sell')`** — Only valid sides  
  - Where: `placeOrder()` validation with constants  
  - Bug if violated: Invalid orders in DB, reporting broken, auditing fails  
  
- **Status transitions only: `pending` → `{filled, rejected}`**  
  - Where: Order state machine in `fillOrder()`, `rejectOrder()`  
  - Bug if violated: Duplicate fills, cancelled orders refilled, double-spend  

### Trade Execution
- **`fee == 0.1% * executedPrice * executedSize` (exactly)**  
  - Where: Before INSERT into trades in `fillOrder()`  
  - Bug if violated: Platform bleeds money or overcharges (every trade compounds)  
  - Example: 1,000 trades with fee=$0 instead of $10 = -$10,000 loss  
  
- **`executedPrice > 0` and `executedSize > 0`**  
  - Where: `fillOrder()` validation  
  - Bug if violated: Negative-price trades, negative quantity positions  

### Position Consistency
- **`size >= 0`** after every fill (total bought - sold)  
  - Where: `fillOrder()` after updating position  
  - Bug if violated: Unintended short selling, P&L calculations wrong  
  
- **Balances + Positions atomic** — both updated in single transaction  
  - Where: `fillOrder()` within `prisma.$transaction()`  
  - Bug if violated: User has cash balance but no position (funds stuck), or position with no cash (fake wealth)  

### Data Immutability
- **Trades are append-only** — No UPDATE/DELETE  
  - Implement: REVOKE UPDATE/DELETE from app role in Postgres  
  - Bug if violated: Audit trail corrupted, P&L wrong, compliance violations  

### Fee Tracking
- **`feesApplied` field logged in Orders**  
  - Tracks actual fees charged to user per order  
  - Used for: Audit disputes, revenue tracking, P&L calculations  

---

## Red Flags (Code Review Checklist)

❌ App directly imports PrismaClient  
❌ DB query in a route handler (should be in service)  
❌ Hardcoded Redis/DB connection strings (use .env)  
❌ Unhandled promise rejections in startup  
❌ **No `SELECT ... FOR UPDATE` in balance deduction** (race condition!)  
❌ **Fee calculation not validated before INSERT**  
❌ **Order status not validated against state machine**  
❌ **Balance/position updates not in same transaction** (ledger split!)  
❌ Silent error handling (should fail fast)  
❌ Cross-package imports from apps/ (should go through packages/)  
❌ Using hardcoded Redis keys instead of `redisKeys` helper  
❌ Stores prices without server timestamp (client time = no audit)  

---

## Production Readiness

### ✅ Implemented
- Row-level locking (SELECT FOR UPDATE) for balance updates
- Advisory locks for portfolio initialization
- Graceful shutdown handling
- Rate limiting per wallet/IP
- Input validation (Zod schemas)
- 89 E2E tests including concurrency tests

### 🚧 Before Production
1. Add row-level security to user data in Postgres
2. Implement audit triggers on orders/trades
3. Set up PgBouncer for external connection pooling
4. Add replication lag checks to /health endpoint
5. Add Prometheus metrics endpoints
6. Verify all prices are timestamped on server (no client time)

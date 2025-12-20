# @repo/db

Centralized database package for the paper-trading platform using Prisma ORM and PostgreSQL.

## Overview

This package manages:
- **Prisma Schema**: Defines the database schema (`prisma/schema.prisma`)
- **Migrations**: Manages schema changes via `prisma/migrations`
- **Database Client**: Exports a singleton `PrismaClient` instance
- **Health Checks**: Provides connectivity verification

## Architecture

The DB package is the **single source of truth** for database access:
- No app directly imports or uses `pg` or `PrismaClient`
- All database operations go through exported functions
- Connection pooling is handled by Prisma internally

## Setup

1. Ensure `.env` has a valid `DATABASE_URL`:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/paper_trading
   ```

2. Initialize the database:
   ```bash
   npm run migrate:dev
   ```

## Usage

### Initialize Database (Startup)

```typescript
import { initDb, shutdownDb } from '@repo/db';

// In your app startup
await initDb(); // Fails fast if DB is unreachable

// On shutdown (SIGTERM/SIGINT)
process.on('SIGTERM', async () => {
  await shutdownDb();
  process.exit(0);
});
```

### Health Checks

```typescript
import { checkDbHealth } from '@repo/db';

const health = await checkDbHealth();
if (!health.ok) {
  console.error('Database is down:', health.error);
}
```

### Query Database

```typescript
import { getDb } from '@repo/db';

const db = getDb();

// Using Prisma
const users = await db.user.findMany();

// Raw queries
const result = await db.$queryRaw`SELECT COUNT(*) FROM users`;

// Transactions
await db.$transaction(async (tx) => {
  await tx.order.create({ data: { ... } });
  await tx.portfolio.update({ ... });
});
```

## Migrations

### Create a New Migration

After updating `prisma/schema.prisma`:

```bash
npm run migrate:dev
# Or with bun:
bun run migrate:dev
```

You'll be prompted for a migration name. This:
1. Generates migration SQL
2. Applies it to the dev database
3. Updates `prisma/schema.prisma` if needed

### Apply Migrations (Production)

```bash
npm run migrate:deploy
```

This applies all pending migrations without generating new ones.

### Check Migration Status

```bash
npm run migrate:status
```

## Schema Organization

Models are organized by domain:

- **Health Check** (diagnostic)
  - `HealthCheck`: Verifies DB connectivity

Future models will include:
- **User & Auth**: User accounts, API keys
- **Trading**: Orders, trades, positions
- **Portfolio**: Holdings, balances
- **Audit**: Audit logs, transaction history

## Isolation Levels (Important for Trading)

For trading operations, use `SERIALIZABLE` isolation:

```typescript
await getDb().$transaction(
  async (tx) => {
    // Check if user has enough cash
    const portfolio = await tx.portfolio.findUnique({
      where: { userId },
    });
    if (portfolio.cash < orderCost) throw new Error('Insufficient funds');

    // Execute order
    await tx.order.create({ data: {...} });
    await tx.portfolio.update({
      where: { userId },
      data: { cash: portfolio.cash - orderCost },
    });
  },
  { isolationLevel: 'Serializable' }
);
```

This prevents race conditions where two traders could buy the same share simultaneously.

## Performance Considerations

- **Connection Pooling**: Prisma manages a pool internally (default max: 10)
- **Prepared Statements**: Prisma uses them automatically
- **N+1 Queries**: Use `include`/`select` to fetch related data in one query
- **Indexes**: Add to frequently queried columns (e.g., `user_id`, `created_at`)

## Common Commands

```bash
# Build TypeScript
bun run build

# Check types
bun run check-types

# Lint
bun run lint

# Create migration
bun run migrate:dev

# Deploy migrations
bun run migrate:deploy

# Check status
bun run migrate:status

# Open Prisma Studio UI
bunx prisma studio
```

## Environment Variables

- `DATABASE_URL` (required): PostgreSQL connection string
- `NODE_ENV` (default: `development`): Controls logging level

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)

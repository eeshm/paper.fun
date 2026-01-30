# Next.js Frontend Dockerfile (using Bun)
FROM oven/bun:latest AS base
WORKDIR /app

# Install dependencies - copy all workspace package.json files for monorepo
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/ws/package.json ./apps/ws/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/trading/package.json ./packages/trading/
COPY packages/env/package.json ./packages/env/
COPY workers/price-ingestion/package.json ./workers/price-ingestion/
COPY workers/candle-aggregation/package.json ./workers/candle-aggregation/
RUN bun install --frozen-lockfile && rm -rf ~/.bun/install/cache

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js with standalone output
WORKDIR /app/apps/web
RUN bun run build

# Production stage - minimal image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (Debian syntax)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy standalone build
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]

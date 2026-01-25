# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - 2024-01-25

### Added
- **Core Trading Engine**: ACID-compliant order execution with row-level locking.
- **Wallet Auth**: Solana wallet adapter integration for authentication.
- **Market Data**: Real-time price ingestion from Pyth Network via Helius.
- **Candles**: OHLC candle aggregation worker and storage in PostgreSQL.
- **Frontend**: Next.js dashboard with TradingView-style charts, order form, and portfolio view.
- **Real-time Updates**: WebSocket server for live price and portfolio updates.
- **Safety**: Comprehensive E2E tests, rate limiting, and input validation.

### Security
- Paper trading only: No real funds, no private key management.
- JWT-based session management.
- Redis-based rate limiting.

### Infrastructure
- Docker Compose setup for PostgreSQL and Redis.
- Separate worker processes for pricing and candles.

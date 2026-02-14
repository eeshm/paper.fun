# Frontend Quick Start

Get the Next.js paper trading frontend running in 5 minutes.

## Prerequisites

✅ Node.js 20.9+ (or newer) and Bun installed  
✅ Phantom or Solflare wallet extension  
✅ Backend running (API on :3000, WebSocket on :3001)

## 5-Minute Setup

```bash
# 1. Navigate to web app
cd apps/web

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env.local

# 4. Start development server
bun run dev

# 5. Open http://localhost:3002
```

That's it! You should see the landing page.

## What You Get

- 🪪 Wallet connection (Phantom/Solflare)
- 📊 Real-time price chart
- 💰 Portfolio dashboard
- 📈 Order placement form
- 📋 Order history with real-time updates
- 🔄 WebSocket real-time data
- 🎯 Responsive mobile design

## Quick Test

1. **Click "Connect Wallet"** → Phantom modal opens
2. **Select an account** → Wallet connected
3. **Click "Sign in with Wallet"** → Sign message
4. **Approve in Phantom** → Logged in!
5. **You're in the dashboard** → Ready to trade

## Project Structure

```
apps/web/
├── app/                    # Pages (landing, dashboard)
├── src/
│   ├── components/        # React components
│   ├── hooks/             # useAuth, useWebSocket
│   ├── lib/               # API client, wallet context
│   ├── store/             # State management (Zustand)
│   └── types/             # TypeScript types
├── .env.example           # Environment variables
├── package.json
└── README.md
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/hooks/useAuth.ts` | Wallet connection & login |
| `src/hooks/useWebSocket.ts` | Real-time price updates |
| `src/lib/api-client.ts` | REST API with auth |
| `src/store/auth.ts` | Auth state management |
| `src/store/trading.ts` | Portfolio & orders state |
| `src/components/dashboard/` | Dashboard pages |
| `.env.example` | Environment variables |

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## Common Commands

```bash
bun run dev          # Start dev server (port 3002)
bun run build        # Build for production
bun run start        # Run production build
bun run lint         # Check code style
```

## Troubleshooting

### Wallet won't connect
- Install Phantom or Solflare extension
- Try disabling browser extensions and re-enabling just the wallet
- Clear browser cache

### Port 3002 already in use
```bash
# Find process using port 3002
lsof -i :3002

# Kill it
kill -9 <PID>
```

### API calls failing (401, 503, etc.)
- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Open DevTools Network tab to see actual errors

### WebSocket disconnecting
- Check backend WebSocket on port 3001
- Verify `NEXT_PUBLIC_WS_URL` in `.env.local`
- Check DevTools Network → WS filter

## Full Stack Setup (All Services)

### Terminal 1: PostgreSQL
```bash
docker run -d \
  --name postgres-dev \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=paper_trading \
  postgres:16
```

### Terminal 2: Redis
```bash
docker run -d \
  --name redis-dev \
  -p 6379:6379 \
  redis:7
```

### Terminal 3: API Server
```bash
cd /path/to/paper-trading
bun install
bun run migrate:dev
bun run dev:api
```

### Terminal 4: WebSocket Server
```bash
cd /path/to/paper-trading
bun run dev:ws
```

### Terminal 5: Frontend
```bash
cd apps/web
bun install
bun run dev
```

## Next Steps

1. **Read the docs:**
   - [README.md](./README.md) - Full documentation
   - [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - How everything connects
   - [API_TESTING.md](./API_TESTING.md) - Test API endpoints

2. **Explore the code:**
   - Check out how wallet connection works in `src/hooks/useAuth.ts`
   - See how WebSocket updates prices in `src/hooks/useWebSocket.ts`
   - Review dashboard components in `src/components/dashboard/`

3. **Make a test trade:**
   - Connect wallet
   - Login
   - Place a buy/sell order
   - Check WebSocket messages in DevTools Network tab

4. **Build features:**
   - Advanced order types (limit orders)
   - Position management
   - Trade history
   - Portfolio analytics

## Support

Stuck? Check:
- Browser console (F12) for errors
- Network tab to see API/WebSocket messages
- `README.md` for detailed docs
- Backend logs for server errors

## Architecture Overview

```
Frontend (Next.js)              Backend (Node.js)
    ↓                               ↓
[Pages & Components]        [Express API + WS]
    ↓                               ↓
[API Client + Hooks]         [Business Logic]
    ↓                               ↓
[Zustand State]              [PostgreSQL + Redis]
    ↓
[Solana Wallet Adapter]
```

**Data Flow:**
1. User connects wallet via Solana adapter
2. Frontend gets nonce from API
3. User signs in wallet
4. Frontend sends signature to login endpoint
5. Backend returns JWT token
6. Frontend stores token and makes authenticated requests
7. WebSocket connects and subscribes to channels
8. Real-time updates flow back to frontend
9. Zustand stores updates and components re-render

## What's Included

✅ **Authentication**
- Wallet connection (Phantom, Solflare)
- Signature-based login (no passwords)
- JWT token management
- Auto token injection in requests

✅ **Real-time Trading**
- WebSocket connection management
- Auto-reconnect with backoff
- Multi-channel subscriptions (prices, orders, portfolio)
- Real-time P&L calculation

✅ **Components**
- Portfolio summary card
- Price chart (Recharts)
- Order placement form with validation
- Order history with status
- Responsive dashboard layout

✅ **State Management**
- Auth state (Zustand)
- Trading state (Zustand)
- Persistent localStorage
- Global data access

✅ **Error Handling**
- Toast notifications
- API error handling
- WebSocket auto-reconnect
- Form validation
- Loading states

✅ **Styling**
- Tailwind CSS
- Responsive mobile design
- Dark theme
- Smooth animations

## Deployment

See [FRONTEND_SETUP.md](../FRONTEND_SETUP.md#deployment) for production deployment.

## License

MIT

---

**Ready to start?** → `bun run dev` and open `http://localhost:3002`

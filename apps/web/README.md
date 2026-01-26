# paper.fun - Next.js Frontend

A modern, real-time paper trading platform for Solana built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Wallet Connection**: Connect with Phantom or Solflare wallets
- **Real-time Price Updates**: WebSocket-powered live SOL/USD prices
- **Market Orders**: Buy/Sell SOL with instant execution
- **Portfolio Dashboard**: View balances, positions, and P&L
- **Order History**: Track all orders with real-time status updates
- **Responsive Design**: Mobile-friendly interface
- **Zero Gas Fees**: Paper trading with virtual funds

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Wallet**: Solana Wallet Adapter
- **HTTP Client**: Axios with auth interceptor
- **WebSocket**: Native browser WebSocket API
- **Charts**: Recharts
- **UI Components**: Lucide Icons, Sonner Toasts
- **Code Style**: ESLint

## Project Structure

```
apps/web/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout with providers
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard
│   └── globals.css              # Global styles
├── src/
│   ├── components/
│   │   ├── ui/                  # Base UI components (Button, etc)
│   │   ├── wallet-connect.tsx   # Wallet connection component
│   │   └── dashboard/           # Dashboard components
│   │       ├── portfolio-summary.tsx
│   │       ├── price-chart.tsx
│   │       ├── order-form.tsx
│   │       └── order-history.tsx
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentication logic
│   │   └── useWebSocket.ts     # WebSocket management
│   ├── lib/
│   │   ├── api-client.ts       # API client with auth interceptor
│   │   ├── wallet-context.tsx  # Solana wallet provider
│   │   └── utils.ts            # Utility functions
│   ├── store/
│   │   ├── auth.ts             # Auth state (Zustand)
│   │   └── trading.ts          # Trading state (Zustand)
│   └── types/
│       └── index.ts            # TypeScript types
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## Installation

1. **Navigate to the web app directory:**
   ```bash
   cd apps/web
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   ```

## Development

### Start the development server:
```bash
bun run dev
```

The app will be available at `http://localhost:3002`

### Build for production:
```bash
bun run build
```

### Start production server:
```bash
bun run start
```

### Run linting:
```bash
bun run lint
```

## API Integration

### Authentication Flow

1. **Connect Wallet**: User clicks "Connect Wallet" → Phantom/Solflare modal
2. **Get Nonce**: Frontend calls `POST /auth/nonce { walletAddress }`
3. **Sign Message**: Wallet signs `"Sign this nonce: {nonce}"`
4. **Login**: Frontend calls `POST /auth/login { walletAddress, signature, nonce }`
5. **Store Token**: Response includes JWT token, stored in localStorage
6. **Auto Auth**: All requests include `Authorization: Bearer {token}` header

### Available Endpoints

#### Authentication
- `POST /auth/nonce` - Get signing nonce
- `POST /auth/login` - Login with signature
- `POST /auth/logout` - Logout

#### Orders
- `POST /orders` - Place market order
- `GET /orders` - List user orders
- `GET /orders/:orderId` - Get single order

#### Portfolio
- `GET /portfolio` - Get balances and positions

#### Market
- `GET /market/price/:symbol` - Get current price
- `GET /market/status` - Get market health

## WebSocket Integration

The app connects to `ws://localhost:3001` after authentication.

### Client Messages
```typescript
{ type: "auth", token: "..." }
{ type: "subscribe", channel: "prices" | "orders" | "portfolio" }
{ type: "unsubscribe", channel: "..." }
{ type: "ping" }
```

### Server Messages
```typescript
{ type: "price", symbol: "SOL", price: "150.50", timestamp: "1234567890" }
{ type: "order_filled", orderId, side, executedPrice, executedSize, fee }
{ type: "portfolio", balances: [...], positions: [...] }
```

## State Management

### Auth Store (Zustand)
```typescript
const { user, token, isAuthenticated, setUser, logout } = useAuthStore();
```

### Trading Store (Zustand)
```typescript
const {
  balances,
  positions,
  orders,
  prices,
  setBalances,
  setPositions,
  addOrder,
  setPrice,
} = useTradingStore();
```

## Custom Hooks

### `useAuth()`
Handles wallet connection and authentication:
```typescript
const {
  publicKey,
  isConnected,
  user,
  token,
  isAuthenticated,
  login,
  logout,
  getNonce,
} = useAuth();
```

### `useWebSocket()`
Manages WebSocket connection and subscriptions:
```typescript
const {
  isConnected,
  send,
  subscribe,
  unsubscribe,
  connect,
  disconnect,
} = useWebSocket({
  token,
  enabled: isAuthenticated,
});
```

## API Client

The `apiClient` singleton provides a configured Axios instance with:
- ✅ Auth token interceptor
- ✅ Automatic token refresh
- ✅ Error handling
- ✅ Timeout configuration
- ✅ LocalStorage persistence

```typescript
import { apiClient } from '@/lib/api-client';

// Automatically includes Bearer token
const orders = await apiClient.getOrders();
```

## Component Usage

### Landing Page
```typescript
// Auto-redirects authenticated users to dashboard
// Shows wallet connection CTA for new users
```

### Dashboard
```typescript
// Protected route - redirects unauthenticated users
// Subscribes to WebSocket channels automatically
// Displays portfolio, price chart, order form, order history
```

### Portfolio Summary
Shows:
- Total portfolio value
- USDC available balance
- SOL holdings with avg entry price
- Unrealized P&L with trend indicator

### Price Chart
- Real-time SOL/USD price
- 24-hour price history (mock data in demo)
- Built with Recharts

### Order Form
- Buy/Sell toggle
- Size input with validation
- Estimated cost calculation
- Fee breakdown
- Order submission with loading state

### Order History
- Scrollable order list
- Status indicators (pending/filled/rejected)
- Order details on hover
- Real-time updates via WebSocket

## Styling

Tailwind CSS with custom color scheme:
- **Primary**: Purple (`purple-600`)
- **Success**: Green (`green-600`)
- **Danger**: Red (`red-600`)
- **Background**: Slate-900
- **Secondary**: Slate-800

### Custom Utilities
```typescript
// Formatting functions in lib/utils.ts
formatCurrency(amount) // "$1,234.56"
formatNumber(num, decimals) // "1234.56"
formatDate(date) // "Jan 01, 2024 12:30 PM"
truncateAddress(addr) // "abc1...xyz9"
```

## Error Handling

- **API Errors**: Toast notifications with error messages
- **WebSocket**: Auto-reconnect with exponential backoff (max 5 attempts)
- **Auth Errors**: Auto-logout on 401, redirect to landing
- **Form Validation**: Real-time validation with helpful messages

## Security

- ✅ JWT tokens stored in localStorage (consider secure storage for production)
- ✅ Auth token cleared on logout
- ✅ Automatic token include in all authenticated requests
- ✅ No private keys handled (wallet signing only)
- ✅ Wallet adapter handles cryptographic operations

## Performance

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component ready
- **Lazy Loading**: Components loaded on demand
- **Caching**: Browser cache + Redis cache (backend)
- **WebSocket**: Single connection with multiplexed channels

## Troubleshooting

### Wallet not connecting?
- Ensure Phantom/Solflare extension is installed
- Check browser console for errors
- Verify you're on devnet/testnet

### WebSocket disconnects frequently?
- Check network tab in DevTools
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Check backend WebSocket server is running

### Orders not executing?
- Ensure you have sufficient USDC balance
- Check market status via `/market/status`
- Verify SOL price is available

### Auth issues?
- Clear browser localStorage
- Refresh page and reconnect wallet
- Check API server is running on port 3000

## Development Tips

1. **Enable React DevTools**: Install React Developer Tools browser extension
2. **WebSocket Debugging**: Use "Network" tab → "WS" filter
3. **State Debugging**: Install Zustand DevTools
4. **API Debugging**: Network tab shows all requests/responses

## Production Deployment

### Before deploying:
1. Set production environment variables
2. Build and test: `bun run build && bun run start`
3. Enable HTTPS for wallet communication
4. Use secure session storage instead of localStorage
5. Add CORS headers matching your domain
6. Set production API/WS URLs

### Deployment platforms:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker + your own server

## Contributing

1. Follow TypeScript best practices
2. Use component composition over prop drilling
3. Keep business logic in hooks
4. Use Zustand for global state
5. Add error boundaries for components
6. Test on mobile devices

## License

MIT

## Support

For issues or questions:
1. Check backend API documentation
2. Review component source code
3. Check browser console for errors
4. Review WebSocket messages in Network tab

## Next Steps

- [ ] Implement price history caching
- [ ] Add more chart types (candles, OHLC)
- [ ] Mobile app optimization
- [ ] Advanced order types (limit orders)
- [ ] Position management (close, edit)
- [ ] Trade history with P&L breakdown
- [ ] Settings page (slippage, notifications)
- [ ] Portfolio analytics and insights
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

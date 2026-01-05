# Event System Architecture

## Overview

The event system enables **real-time updates** from backend services (API, Workers) to connected WebSocket clients (browsers). It uses **Redis Pub/Sub** as the message broker.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Publishers     │────▶│  Redis Pub/Sub  │────▶│  Subscribers    │
│  (API, Workers) │     │  (Channels)     │     │  (WS Server)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  WS Clients     │
                                                │  (Browsers)     │
                                                └─────────────────┘
```

---

## How It Works

### Step 1: Event Published (API/Worker)

When something happens (price update, order filled), the service calls a publish function:

```typescript
// In price-ingestion worker after updating price
await publishPriceUpdate("SOL", "231.45");

// In API after order execution
await publishOrderFilled({
  userId: 123,
  orderId: 456,
  side: "buy",
  executedPrice: "231.45",
  executedSize: "10",
  fee: "0.23145",
});
```

### Step 2: Event Sent to Redis Channel

The `@repo/events` package serializes the event and publishes to a Redis channel:

```typescript
// packages/events/src/publish.ts
export async function publishPriceUpdate(symbol: string, price: string) {
  const event = {
    symbol,
    price,
    timestamp: new Date().toISOString(),
  };
  
  // Publish to Redis channel: "trading:events:price:update"
  await redis.publish(redisKeys.CHANNELS.priceUpdate(), JSON.stringify(event));
}
```

### Step 3: WebSocket Server Subscribes

The WS server creates a Redis subscriber that listens to channels:

```typescript
// apps/ws/src/publishers/prices.ts
export async function startPricePublisher(wss: WebSocketServer) {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  
  // Subscribe to price channel
  await subscriber.subscribe(redisKeys.CHANNELS.priceUpdate(), (message) => {
    const event = JSON.parse(message);
    broadcastPrice(wss, event.symbol, event.price, event.timestamp);
  });
}
```

### Step 4: Broadcast to WebSocket Clients

The WS server sends the event to all connected clients subscribed to that channel:

```typescript
function broadcastPrice(wss, symbol, price, timestamp) {
  wss.clients.forEach((client) => {
    const ws = client as AuthenticatedWebSocket;
    
    // Only send to clients subscribed to "prices"
    if (ws.readyState === OPEN && ws.subscriptions.has("prices")) {
      ws.send(JSON.stringify({
        type: "price",
        symbol,
        price,
        timestamp,
      }));
    }
  });
}
```

### Step 5: Client Receives Update

Browser receives the message instantly:

```javascript
// Frontend code
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === "price") {
    updatePriceDisplay(message.symbol, message.price);
  }
};
```

---

## Redis Channels

All channels are defined in `@repo/redis/src/keys.ts`:

| Channel | Key | Publisher | Purpose |
|---------|-----|-----------|---------|
| Price Updates | `trading:events:price:update` | Price Worker | SOL price changes |
| Order Filled | `trading:events:order:filled` | API | Order execution notifications |
| Order Rejected | `trading:events:order:rejected` | API | Order rejection notifications |
| Portfolio Update | `trading:events:portfolio:update` | API | Balance/position changes |

---

## Event Types

Defined in `@repo/events/src/types.ts`:

```typescript
interface PriceUpdateEvent {
  symbol: string;      // "SOL"
  price: string;       // "231.45"
  timestamp: string;   // ISO string
}

interface OrderFilledEvent {
  userId: number;
  orderId: number;
  side: string;        // "buy" | "sell"
  baseAsset: string;   // "SOL"
  quoteAsset: string;  // "USD"
  executedPrice: string;
  executedSize: string;
  fee: string;
  timestamp: string;
}

interface PortfolioUpdateEvent {
  userId: number;
  balances: { asset, available, locked }[];
  positions: { asset, size, avgEntryPrice }[];
  timestamp: string;
}
```

---

## Why Redis Pub/Sub?

### Problem Without It
- API and WS server are separate processes
- API can't directly send to WS clients
- Workers can't notify users of price changes

### Solution: Redis as Message Broker
```
┌─────────┐                    ┌─────────┐
│   API   │──(can't reach)──X──│   WS    │
└─────────┘                    └─────────┘

         With Redis Pub/Sub:

┌─────────┐     ┌─────────┐     ┌─────────┐
│   API   │────▶│  Redis  │────▶│   WS    │
└─────────┘     └─────────┘     └─────────┘
```

### Benefits
1. **Decoupled**: API doesn't need to know about WS connections
2. **Scalable**: Multiple WS servers can subscribe to same channel
3. **Fast**: Redis Pub/Sub is ~sub-millisecond latency
4. **Simple**: No complex message queue setup needed

---

## Data Flow Examples

### Price Update Flow
```
1. Pyth Oracle returns SOL = $231.45
2. Price Worker calls setPrice("SOL", price)
3. Price Worker calls publishPriceUpdate("SOL", "231.45")
4. Redis receives message on "trading:events:price:update"
5. WS Server (subscribed) receives the message
6. WS Server broadcasts to all clients subscribed to "prices"
7. Browser displays new price instantly
```

### Order Filled Flow
```
1. User places order via POST /orders
2. API executes order (placeOrder)
3. API calls publishOrderFilled({ userId, orderId, ... })
4. API calls publishPortfolioUpdate({ userId, balances, positions })
5. Redis receives messages on respective channels
6. WS Server receives both messages
7. WS Server sends order_filled to user's WebSocket (if connected)
8. WS Server sends portfolio update to user's WebSocket
9. User's browser updates order status and portfolio display
```

---

## Client Subscription Model

Clients must explicitly subscribe to channels:

```javascript
// Connect
const ws = new WebSocket("ws://localhost:3001");

// Authenticate (required for orders/portfolio)
ws.send(JSON.stringify({ type: "auth", token: sessionToken }));

// Subscribe to price updates (no auth needed)
ws.send(JSON.stringify({ type: "subscribe", channel: "prices" }));

// Subscribe to order updates (requires auth)
ws.send(JSON.stringify({ type: "subscribe", channel: "orders" }));

// Subscribe to portfolio updates (requires auth)
ws.send(JSON.stringify({ type: "subscribe", channel: "portfolio" }));
```

### Channel Permissions

| Channel | Auth Required | Scope |
|---------|---------------|-------|
| `prices` | No | All clients receive all price updates |
| `orders` | Yes | Client only receives their own order events |
| `portfolio` | Yes | Client only receives their own portfolio updates |

---

## Summary

| Component | Role |
|-----------|------|
| `@repo/events` | Defines event types + publish functions |
| `@repo/redis` | Defines channel names + Redis client |
| API / Workers | Call `publish*()` functions when events occur |
| WS Server | Subscribes to Redis channels, broadcasts to clients |
| Browser | Connects via WebSocket, subscribes to channels |

This architecture enables **instant updates** without polling, keeping the trading UI responsive and synchronized with backend state.

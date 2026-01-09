// Auth Types
export interface AuthNonceRequest {
  walletAddress: string;
}

export interface AuthNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface AuthLoginRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
}

export interface AuthLoginResponse {
  token: string;
  user: {
    id: number;
    walletAddress: string;
  };
}

// Order Types
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'rejected';

export interface PlaceOrderRequest {
  side: OrderSide;
  baseAsset: string;
  quoteAsset: string;
  requestedSize: string;
}

export interface Order {
  orderId: number;
  side: OrderSide;
  status: OrderStatus;
  baseAsset: string;
  quoteAsset: string;
  requestedSize: string;
  executedPrice: string;
  executedSize: string;
  feesApplied: string;
  createdAt: string;
  updatedAt: string;
}

// Portfolio Types
export interface Balance {
  asset: string;
  available: string;
  locked: string;
}

export interface Position {
  asset: string;
  size: string;
  avgEntryPrice: string;
}

export interface Portfolio {
  balances: Balance[];
  positions: Position[];
}

// Market Types
export interface PriceData {
  symbol: string;
  price: string;
  updatedAt: string;
}

export interface MarketStatus {
  healthy: boolean;
  sol: {
    available: boolean;
    price: string;
    updatedAt: string;
  };
}

// WebSocket Types
export type WSMessageType =
  | 'auth'
  | 'subscribe'
  | 'unsubscribe'
  | 'ping'
  | 'pong'
  | 'subscribed'
  | 'unsubscribed'
  | 'price'
  | 'order_filled'
  | 'portfolio';

export interface WSMessage {
  type: WSMessageType;
  [key: string]: unknown;
}

export interface WSPriceMessage {
  type: 'price';
  symbol: string;
  price: string;
  timestamp: string;
}

export interface WSOrderFilledMessage {
  type: 'order_filled';
  orderId: number;
  side: OrderSide;
  executedPrice: string;
  executedSize: string;
  fee: string;
}

export interface WSPortfolioMessage {
  type: 'portfolio';
  balances: Balance[];
  positions: Position[];
}

// User State
export interface User {
  id: number;
  walletAddress: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

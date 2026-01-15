/**
 * Centralized environment configuration for the frontend
 * All environment variables should be accessed through this module
 */

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const env = {
  // API URLs
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',

  // Solana configuration
  SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || '',

  // Feature flags
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Type for the environment config
export type Env = typeof env;

// Validate required env vars in production
export function validateEnv(): void {
  if (env.IS_PRODUCTION) {
    const required = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.warn(
        `Missing required environment variables in production: ${missing.join(', ')}`
      );
    }
  }
}

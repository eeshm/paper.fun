'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { isAuthenticated, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!connected || !publicKey) {
      return;
    }

    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="flex flex-col items-center justify-center gap-12 text-center px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-white">
            Solana Paper Trading
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Practice trading Solana with virtual $1,000,000 USD. Real-time prices,
            zero risk, maximum learning.
          </p>
        </div>

        <div className="space-y-4">
          {!connected ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400">
                Connect your wallet to get started
              </p>
              <WalletMultiButton />
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              size="lg"
              className="h-12 px-8 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in with Wallet'
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-left max-w-4xl">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Real-time Prices</h3>
            <p className="text-sm text-slate-400">
              Live SOL/USD prices powered by Pyth network
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Market Orders</h3>
            <p className="text-sm text-slate-400">
              Instant execution at current market prices
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Zero Risk</h3>
            <p className="text-sm text-slate-400">
              Paper trading with virtual funds
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
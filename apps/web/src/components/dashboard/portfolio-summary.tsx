'use client';

import { Balance, Position } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingStore } from '@/store/trading';

interface PortfolioSummaryProps {
  balances: Balance[];
  positions: Position[];
}

export function PortfolioSummary({
  balances,
  positions,
}: PortfolioSummaryProps) {
  const { prices } = useTradingStore();
  
  const usdcBalance = balances.find((b) => b.asset === 'USDC');
  const solBalance = balances.find((b) => b.asset === 'SOL');
  const solPosition = positions.find((p) => p.asset === 'SOL');

  // Calculate portfolio value (USDC balance + SOL position value)
  const solPrice = parseFloat(prices.SOL?.price || '150');
  const solValue = solPosition
    ? parseFloat(solPosition.size) * solPrice
    : 0;
  const totalValue =
    (usdcBalance ? parseFloat(usdcBalance.available) : 0) + solValue;

  // Calculate unrealized P&L
  const entryValue = solPosition
    ? parseFloat(solPosition.size) *
      parseFloat(solPosition.avgEntryPrice)
    : 0;
  const unrealizedPnL = solValue - entryValue;
  const unrealizedPnLPercent =
    entryValue > 0 ? (unrealizedPnL / entryValue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Portfolio Value */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-sm text-slate-400 mb-2">Portfolio Value</p>
        <p className="text-3xl font-bold text-white">
          {formatCurrency(totalValue)}
        </p>
        <p className="text-xs text-slate-500 mt-2">Initial: $1,000,000</p>
      </div>

      {/* USDC Balance */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-sm text-slate-400 mb-2">USDC Available</p>
        <p className="text-2xl font-bold text-white">
          {formatCurrency(usdcBalance?.available || '0')}
        </p>
        {usdcBalance?.locked && parseFloat(usdcBalance.locked) > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Locked: {formatCurrency(usdcBalance.locked)}
          </p>
        )}
      </div>

      {/* SOL Position */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-sm text-slate-400 mb-2">SOL Holding</p>
        <p className="text-2xl font-bold text-white">
          {formatNumber(solBalance?.available || '0', 4)} SOL
        </p>
        {solPosition && parseFloat(solPosition.size) > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Avg Entry: ${formatNumber(solPosition.avgEntryPrice, 2)}
          </p>
        )}
      </div>

      {/* Unrealized P&L */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-sm text-slate-400 mb-2">Unrealized P&L</p>
        <div className="flex items-center gap-2">
          <p
            className={`text-2xl font-bold ${
              unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
          </p>
          {unrealizedPnL >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
        </div>
        <p
          className={`text-xs mt-2 ${
            unrealizedPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {unrealizedPnLPercent >= 0 ? '+' : ''}
          {unrealizedPnLPercent.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

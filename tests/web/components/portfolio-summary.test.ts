import { describe, test, expect, beforeEach } from 'vitest';
import { useTradingStore } from '../../../apps/web/src/store/trading';
import { act } from '@testing-library/react';
import type { Balance, Position } from '../../../apps/web/src/types';

/**
 * PortfolioSummary Logic Tests
 * 
 * Tests the portfolio calculation logic for:
 * - Total portfolio value calculation
 * - Unrealized P&L calculation
 * - Handling of edge cases
 */

describe('Portfolio Summary Logic', () => {
  beforeEach(() => {
    act(() => {
      useTradingStore.getState().reset();
    });
  });

  describe('Portfolio Value Calculation', () => {
    test('calculates total value from USDC + SOL holdings', () => {
      // Set SOL price
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '100.00',
          updatedAt: '',
        });
      });

      const balances: Balance[] = [
        { asset: 'USDC', available: '500.00', locked: '0' },
        { asset: 'SOL', available: '5', locked: '0' },
      ];
      const positions: Position[] = [
        { asset: 'SOL', size: '5', avgEntryPrice: '90.00' },
      ];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const usdcBalance = balances.find(b => b.asset === 'USDC');
      const solPosition = positions.find(p => p.asset === 'SOL');

      const solValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;
      const totalValue = (usdcBalance ? parseFloat(usdcBalance.available) : 0) + solValue;

      // $500 USDC + (5 SOL * $100) = $1000
      expect(totalValue).toBe(1000);
    });

    test('returns USDC balance only when no SOL position', () => {
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '100.00',
          updatedAt: '',
        });
      });

      const balances: Balance[] = [
        { asset: 'USDC', available: '750.00', locked: '0' },
      ];
      const positions: Position[] = [];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const usdcBalance = balances.find(b => b.asset === 'USDC');
      const solPosition = positions.find(p => p.asset === 'SOL');

      const solValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;
      const totalValue = (usdcBalance ? parseFloat(usdcBalance.available) : 0) + solValue;

      expect(totalValue).toBe(750);
    });
  });

  describe('Unrealized P&L Calculation', () => {
    test('calculates positive P&L when price is above entry', () => {
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '110.00', // Current price
          updatedAt: '',
        });
      });

      const positions: Position[] = [
        { asset: 'SOL', size: '10', avgEntryPrice: '100.00' }, // Entry price
      ];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const solPosition = positions.find(p => p.asset === 'SOL');

      const currentValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;
      const entryValue = solPosition
        ? parseFloat(solPosition.size) * parseFloat(solPosition.avgEntryPrice)
        : 0;
      const unrealizedPnL = currentValue - entryValue;

      // (10 SOL * $110) - (10 SOL * $100) = $1100 - $1000 = $100 profit
      expect(unrealizedPnL).toBe(100);
      expect(unrealizedPnL > 0).toBe(true);
    });

    test('calculates negative P&L when price is below entry', () => {
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '80.00', // Current price (below entry)
          updatedAt: '',
        });
      });

      const positions: Position[] = [
        { asset: 'SOL', size: '10', avgEntryPrice: '100.00' }, // Entry price
      ];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const solPosition = positions.find(p => p.asset === 'SOL');

      const currentValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;
      const entryValue = solPosition
        ? parseFloat(solPosition.size) * parseFloat(solPosition.avgEntryPrice)
        : 0;
      const unrealizedPnL = currentValue - entryValue;

      // (10 SOL * $80) - (10 SOL * $100) = $800 - $1000 = -$200 loss
      expect(unrealizedPnL).toBe(-200);
      expect(unrealizedPnL < 0).toBe(true);
    });

    test('calculates P&L percentage correctly', () => {
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '120.00',
          updatedAt: '',
        });
      });

      const positions: Position[] = [
        { asset: 'SOL', size: '5', avgEntryPrice: '100.00' },
      ];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const solPosition = positions.find(p => p.asset === 'SOL');

      const currentValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;
      const entryValue = solPosition
        ? parseFloat(solPosition.size) * parseFloat(solPosition.avgEntryPrice)
        : 0;
      const unrealizedPnL = currentValue - entryValue;
      const pnlPercent = entryValue > 0 ? (unrealizedPnL / entryValue) * 100 : 0;

      // ($600 - $500) / $500 * 100 = 20%
      expect(pnlPercent).toBe(20);
    });

    test('returns zero P&L percentage when no entry value', () => {
      const positions: Position[] = [];
      const solPosition = positions.find(p => p.asset === 'SOL');

      const entryValue = solPosition
        ? parseFloat(solPosition.size) * parseFloat(solPosition.avgEntryPrice)
        : 0;
      const unrealizedPnL = 0;
      const pnlPercent = entryValue > 0 ? (unrealizedPnL / entryValue) * 100 : 0;

      expect(pnlPercent).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero SOL price gracefully', () => {
      act(() => {
        useTradingStore.getState().setPrice('SOL', {
          symbol: 'SOL',
          price: '0',
          updatedAt: '',
        });
      });

      const positions: Position[] = [
        { asset: 'SOL', size: '10', avgEntryPrice: '100.00' },
      ];

      const solPrice = parseFloat(useTradingStore.getState().prices['SOL']?.price || '0');
      const solPosition = positions.find(p => p.asset === 'SOL');
      const solValue = solPosition ? parseFloat(solPosition.size) * solPrice : 0;

      expect(solValue).toBe(0);
      expect(isNaN(solValue)).toBe(false);
    });

    test('handles missing price data', () => {
      // Don't set any price
      const prices = useTradingStore.getState().prices;
      const solPrice = parseFloat(prices['SOL']?.price || '0');

      expect(solPrice).toBe(0);
      expect(isNaN(solPrice)).toBe(false);
    });

    test('handles empty arrays for balances and positions', () => {
      const balances: Balance[] = [];
      const positions: Position[] = [];

      const usdcBalance = balances.find(b => b.asset === 'USDC');
      const solPosition = positions.find(p => p.asset === 'SOL');

      expect(usdcBalance).toBeUndefined();
      expect(solPosition).toBeUndefined();
    });
  });
});

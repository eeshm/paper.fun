'use client';

import { PriceData } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

interface PriceChartProps {
  prices: { [symbol: string]: PriceData };
}

export function PriceChart({ prices }: PriceChartProps) {
  const solPrice = prices['SOL']?.price || '0';

  // Generate mock historical data for demo
  // In production, you'd fetch this from the backend
  const chartData = useMemo(() => {
    const basePrice = parseFloat(solPrice) || 150;
    const data = [];
    for (let i = 0; i < 24; i++) {
      const variation = (Math.random() - 0.5) * 20;
      data.push({
        time: `${i}:00`,
        price: parseFloat((basePrice + variation).toFixed(2)),
      });
    }
    return data;
  }, [solPrice]);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">SOL/USD</h2>
        <p className="text-3xl font-bold text-white">
          ${parseFloat(solPrice).toFixed(2)}
        </p>
        <p className="text-sm text-slate-400 mt-2">Real-time price via Pyth</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

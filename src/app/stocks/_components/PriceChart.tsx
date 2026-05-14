'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartRange, ChartResponse } from '@/lib/stocks/types';
import { formatPrice } from '@/lib/stocks/format';

const RANGES: { value: ChartRange; label: string }[] = [
  { value: '1d', label: '1ד׳' },
  { value: '5d', label: '5ד׳' },
  { value: '1mo', label: '1ח׳' },
  { value: '3mo', label: '3ח׳' },
  { value: '6mo', label: '6ח׳' },
  { value: '1y', label: '1ש׳' },
  { value: '5y', label: '5ש׳' },
  { value: 'max', label: 'הכל' },
];

export function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<ChartRange>('1mo');
  const [data, setData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/stocks/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as ChartResponse;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'שגיאה בטעינת הגרף');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const intraday = range === '1d' || range === '5d';
  const firstClose = data?.points[0]?.c ?? 0;
  const lastClose = data?.points[data.points.length - 1]?.c ?? 0;
  const trendUp = lastClose >= firstClose;
  const stroke = trendUp ? '#56D364' : '#FF7B72';
  const fillId = `gradient-${trendUp ? 'up' : 'down'}`;

  return (
    <div className="db-card p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="text-sm font-semibold text-foreground-muted">גרף מחיר</div>
        <div className="flex gap-1 flex-wrap" dir="ltr">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                range === r.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-foreground-muted hover:text-foreground hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72 w-full" dir="ltr">
        {loading ? (
          <div className="h-full skeleton rounded-md" />
        ) : error ? (
          <div className="h-full flex items-center justify-center text-sm text-[#FF7B72]">{error}</div>
        ) : data && data.points.length > 0 ? (
          <ResponsiveContainer>
            <AreaChart data={data.points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#56D364" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#56D364" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7B72" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FF7B72" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v: number) => {
                  const d = new Date(v);
                  return intraday
                    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                tick={{ fontSize: 11, fill: '#7D8590' }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#7D8590' }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{
                  background: '#161B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#7D8590' }}
                labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
                formatter={(v) => [formatPrice(Number(v), data.currency), 'מחיר'] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="c"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-foreground-muted">
            אין נתונים להצגה
          </div>
        )}
      </div>
    </div>
  );
}

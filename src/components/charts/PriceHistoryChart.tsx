'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PricePoint } from '@/types';
import { stores } from '@/data/stores';

interface PriceHistoryChartProps {
  productId: string;
  priceHistory: { storeId: string; history: PricePoint[] }[];
  selectedStores?: string[];
}

export function PriceHistoryChart({
  productId,
  priceHistory,
  selectedStores,
}: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    // Get all unique dates
    const dates = new Set<string>();
    priceHistory.forEach(({ history }) => {
      history.forEach(({ date }) => {
        dates.add(format(new Date(date), 'yyyy-MM-dd'));
      });
    });

    // Create data points for each date
    const sortedDates = Array.from(dates).sort();
    return sortedDates.map((dateStr) => {
      const dataPoint: Record<string, number | string> = {
        date: dateStr,
        label: format(new Date(dateStr), 'd MMM', { locale: he }),
      };

      priceHistory.forEach(({ storeId, history }) => {
        const pricePoint = history.find(
          (p) => format(new Date(p.date), 'yyyy-MM-dd') === dateStr
        );
        if (pricePoint) {
          dataPoint[storeId] = pricePoint.price;
        }
      });

      return dataPoint;
    });
  }, [priceHistory]);

  const visibleStores = selectedStores || priceHistory.map((p) => p.storeId);

  // Calculate average price for reference line
  const avgPrice = useMemo(() => {
    const allPrices: number[] = [];
    chartData.forEach((point) => {
      visibleStores.forEach((storeId) => {
        if (typeof point[storeId] === 'number') {
          allPrices.push(point[storeId] as number);
        }
      });
    });
    return allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  }, [chartData, visibleStores]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--foreground-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--foreground-secondary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₪${value}`}
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              return (
                <div className="glass-card p-3 text-sm">
                  <p className="font-medium mb-2">{label}</p>
                  {payload.map((entry) => {
                    const store = stores.find((s) => s.id === entry.dataKey);
                    return (
                      <div
                        key={entry.dataKey}
                        className="flex items-center justify-between gap-4"
                      >
                        <span style={{ color: entry.color }}>
                          {store?.nameHe}
                        </span>
                        <span className="font-semibold price">
                          ₪{(entry.value as number).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <ReferenceLine
            y={avgPrice}
            stroke="var(--foreground-secondary)"
            strokeDasharray="3 3"
            label={{
              value: `ממוצע ₪${avgPrice.toFixed(2)}`,
              position: 'insideTopRight',
              fill: 'var(--foreground-secondary)',
              fontSize: 10,
            }}
          />
          {visibleStores.map((storeId) => {
            const store = stores.find((s) => s.id === storeId);
            return (
              <Line
                key={storeId}
                type="monotone"
                dataKey={storeId}
                stroke={store?.color || '#666'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// Store Legend Component
export function StoreLegend({
  stores: storeIds,
  selected,
  onToggle,
}: {
  stores: string[];
  selected: string[];
  onToggle: (storeId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {storeIds.map((storeId) => {
        const store = stores.find((s) => s.id === storeId);
        const isSelected = selected.includes(storeId);
        return (
          <motion.button
            key={storeId}
            onClick={() => onToggle(storeId)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              isSelected
                ? 'bg-background-secondary'
                : 'bg-background/50 opacity-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: store?.color }}
            />
            <span>{store?.nameHe}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

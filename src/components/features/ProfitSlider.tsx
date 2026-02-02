'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, TrendingUp, HardHat } from 'lucide-react';

interface ProfitSliderProps {
  additionalArea: number;
  defaultPricePerSqm: number;
  constructionCostPerSqm: number;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('he-IL').format(n);
}

export function ProfitSlider({
  additionalArea,
  defaultPricePerSqm,
  constructionCostPerSqm,
}: ProfitSliderProps) {
  const [pricePerSqm, setPricePerSqm] = useState(defaultPricePerSqm);

  const totalValue = additionalArea * pricePerSqm;
  const totalCost = additionalArea * constructionCostPerSqm;
  const profit = totalValue - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : '0';

  const minPrice = Math.round(defaultPricePerSqm * 0.6);
  const maxPrice = Math.round(defaultPricePerSqm * 1.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-gold p-6"
    >
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        <CircleDollarSign className="w-5 h-5 text-gold" />
        <span className="text-gradient-gold">מחשבון הרווח</span>
      </h3>
      <p className="text-xs text-foreground-muted mb-5">
        {"הזז את הסליידר לפי מחיר מ\"ר בשכונה שלך"}
      </p>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-foreground-secondary">{"מחיר מ\"ר באזור"}</span>
          <span className="text-lg font-bold font-mono text-gold price">
            {new Intl.NumberFormat('he-IL').format(pricePerSqm)} ₪
          </span>
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={pricePerSqm}
          onChange={(e) => setPricePerSqm(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-foreground-muted mt-1 font-mono">
          <span className="price">{new Intl.NumberFormat('he-IL').format(minPrice)} ₪</span>
          <span className="price">{new Intl.NumberFormat('he-IL').format(maxPrice)} ₪</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {/* Value */}
        <div className="p-3 rounded-xl bg-success/8 border border-success/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <TrendingUp className="w-4 h-4 text-success" />
              <span>שווי זכויות הבנייה</span>
            </div>
            <span className="text-xl font-bold text-success font-mono price">
              ₪{formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className="p-3 rounded-xl bg-warning/8 border border-warning/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <HardHat className="w-4 h-4 text-warning" />
              <span>עלות בנייה משוערת</span>
            </div>
            <span className="text-xl font-bold text-warning font-mono price">
              ₪{formatCurrency(totalCost)}
            </span>
          </div>
        </div>

        {/* Profit */}
        <div className={`p-4 rounded-xl border ${profit > 0 ? 'bg-accent/8 border-accent/20' : 'bg-danger/8 border-danger/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground-secondary block">רווח פוטנציאלי</span>
              <span className="text-xs text-foreground-muted">ROI: {roi}%</span>
            </div>
            <span className={`text-2xl font-bold font-mono price ${profit > 0 ? 'text-accent-light' : 'text-danger'}`}>
              ₪{formatCurrency(Math.abs(profit))}
              {profit < 0 && <span className="text-sm">-</span>}
            </span>
          </div>

          {/* Profit bar */}
          <div className="mt-3 h-2 rounded-full bg-background-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${profit > 0 ? 'bg-gradient-to-l from-accent to-success' : 'bg-danger'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(5, (profit / totalValue) * 100))}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-foreground-muted mt-4 leading-relaxed">
        {"* הערכה ראשונית בלבד. עלות בנייה לפי "}
        {new Intl.NumberFormat('he-IL').format(constructionCostPerSqm)}
        {" ₪/מ\"ר. לא כולל עלויות תכנון, היטלי השבחה ומיסים."}
      </p>
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, TrendingUp, HardHat, FileText, Droplets, Landmark, Receipt, Scale } from 'lucide-react';
import type { CostBreakdown } from '@/types';

interface ProfitSliderProps {
  additionalArea: number;
  defaultPricePerSqm: number;
  constructionCostPerSqm: number;
  costBreakdown: CostBreakdown;
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
  costBreakdown,
}: ProfitSliderProps) {
  const [pricePerSqm, setPricePerSqm] = useState(defaultPricePerSqm);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Recalculate based on slider price
  const priceRatio = pricePerSqm / defaultPricePerSqm;
  const totalValue = additionalArea * pricePerSqm;

  // Scale betterment levy with price (since it's based on value increase)
  const scaledBettermentLevy = Math.round(costBreakdown.bettermentLevy * priceRatio);
  const totalCost = costBreakdown.constructionCost +
    costBreakdown.planningAndSupervision +
    scaledBettermentLevy +
    costBreakdown.buildingPermitFees +
    costBreakdown.developmentLevies +
    costBreakdown.vat +
    costBreakdown.legalAndMisc;

  const profit = totalValue - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : '0';

  const minPrice = Math.round(defaultPricePerSqm * 0.6);
  const maxPrice = Math.round(defaultPricePerSqm * 1.5);

  const costItems = [
    { icon: <HardHat className="w-3.5 h-3.5" />, label: 'בנייה ישירה', amount: costBreakdown.constructionCost, color: 'text-warning' },
    { icon: <Landmark className="w-3.5 h-3.5" />, label: 'היטל השבחה (50%)', amount: scaledBettermentLevy, color: 'text-danger' },
    { icon: <FileText className="w-3.5 h-3.5" />, label: 'תכנון ופיקוח (12%)', amount: costBreakdown.planningAndSupervision, color: 'text-foreground-secondary' },
    { icon: <Receipt className="w-3.5 h-3.5" />, label: 'אגרות בנייה', amount: costBreakdown.buildingPermitFees, color: 'text-foreground-secondary' },
    { icon: <Droplets className="w-3.5 h-3.5" />, label: 'היטלי פיתוח (מים, ביוב, כבישים)', amount: costBreakdown.developmentLevies, color: 'text-foreground-secondary' },
    { icon: <Scale className="w-3.5 h-3.5" />, label: 'מע"מ 17%', amount: costBreakdown.vat, color: 'text-foreground-secondary' },
    { icon: <FileText className="w-3.5 h-3.5" />, label: 'משפטי ושונות', amount: costBreakdown.legalAndMisc, color: 'text-foreground-secondary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="db-card-gold p-6"
    >
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        <CircleDollarSign className="w-5 h-5 text-gold" />
        <span className="text-gradient-gold">מחשבון הרווח</span>
      </h3>
      <p className="text-xs text-foreground-muted mb-5">
        {"כולל היטלים, אגרות ומע\"מ | הזז סליידר לפי מחיר מ\"ר"}
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

        {/* Total Cost with breakdown toggle */}
        <div className="rounded-xl bg-warning/8 border border-warning/15 overflow-hidden">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full p-3 flex items-center justify-between hover:bg-warning/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <HardHat className="w-4 h-4 text-warning" />
              <span>{'סה"כ עלויות (כולל היטלים)'}</span>
              <span className="text-[10px] text-foreground-muted">
                {showBreakdown ? '▲' : '▼ פירוט'}
              </span>
            </div>
            <span className="text-xl font-bold text-warning font-mono price">
              ₪{formatCurrency(totalCost)}
            </span>
          </button>

          {/* Cost breakdown */}
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 space-y-1.5 border-t border-warning/10 pt-2"
            >
              {costItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1.5 ${item.color}`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono font-medium price">
                    ₪{new Intl.NumberFormat('he-IL').format(item.amount)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Profit */}
        <div className={`p-4 rounded-xl border ${profit > 0 ? 'bg-accent/8 border-accent/20' : 'bg-danger/8 border-danger/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground-secondary block">רווח פוטנציאלי (נטו)</span>
              <span className="text-xs text-foreground-muted">ROI: {roi}%</span>
            </div>
            <span className={`text-2xl font-bold font-mono price ${profit > 0 ? 'text-accent-light' : 'text-danger'}`}>
              ₪{formatCurrency(Math.abs(profit))}
              {profit < 0 && <span className="text-sm">-</span>}
            </span>
          </div>

          {/* Profit bar */}
          <div className="mt-3 h-2 rounded-full bg-[rgba(17,24,39,0.8)] overflow-hidden">
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
        {"* הערכה ראשונית. עלות בנייה: "}
        {new Intl.NumberFormat('he-IL').format(constructionCostPerSqm)}
        {" ₪/מ\"ר. היטל השבחה: 50% מעליית ערך. היטלי פיתוח לפי תעריפי עיריית רעננה."}
      </p>
    </motion.div>
  );
}

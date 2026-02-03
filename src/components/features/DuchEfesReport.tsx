'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  TrendingUp,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { DuchEfes, ZoningPlan } from '@/types';
import { useView } from '@/context/ViewContext';

interface Props {
  duchEfes: DuchEfes;
  zoningPlan: ZoningPlan;
  plotArea: number;
}

export function DuchEfesReport({ duchEfes, zoningPlan, plotArea }: Props) {
  const { setActiveSourceId, setShowAuditTrail } = useView();

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(n);

  const feasibilityLabels = {
    excellent: 'מעולה',
    good: 'טוב',
    marginal: 'שולי',
    unfeasible: 'לא כדאי',
  };

  const feasibilityIcons = {
    excellent: <CheckCircle2 className="w-6 h-6" />,
    good: <TrendingUp className="w-6 h-6" />,
    marginal: <AlertTriangle className="w-6 h-6" />,
    unfeasible: <AlertTriangle className="w-6 h-6" />,
  };

  const handleSourceClick = (sourceId: string) => {
    setActiveSourceId(sourceId);
    setShowAuditTrail(true);
  };

  return (
    <div className="space-y-6">
      {/* Feasibility Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-gold p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold" />
            דו&quot;ח אפס - פינוי בינוי
          </h3>
          <button
            onClick={() => handleSourceClick(duchEfes.sources[0].id)}
            className="source-badge"
          >
            <FileText className="w-3 h-3" />
            מקור
          </button>
        </div>

        {/* Score Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary border border-border">
          <div className={`score-${duchEfes.feasibilityScore}`}>
            {feasibilityIcons[duchEfes.feasibilityScore]}
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground-secondary">כדאיות הפרויקט</p>
            <p className={`text-2xl font-black score-${duchEfes.feasibilityScore}`}>
              {feasibilityLabels[duchEfes.feasibilityScore]}
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-foreground-secondary">מקדם רווחיות</p>
            <p className="text-3xl font-black text-neon-gold metric-value">
              {duchEfes.profitMargin}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <MetricCard
          label='שטח מכירה (מש"ח)'
          value={`${duchEfes.totalSellableArea}`}
          unit='מ"ר'
          color="cyan"
        />
        <MetricCard
          label="סה״כ דירות"
          value={`${duchEfes.totalUnits}`}
          unit="יח׳"
          color="cyan"
        />
        <MetricCard
          label="רווח נקי"
          value={formatCurrency(duchEfes.profit)}
          color="gold"
        />
        <MetricCard
          label="היטל השבחה"
          value={formatCurrency(duchEfes.bettermentLevy)}
          color="danger"
        />
      </motion.div>

      {/* Financial Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-gold" />
          פירוט פיננסי
        </h3>

        <div className="space-y-2">
          <FinancialRow label="הכנסות" sublabel="סה״כ מכירת דירות" value={formatCurrency(duchEfes.totalRevenue)} isPositive />
          <div className="border-t border-border my-3" />
          <FinancialRow label="עלות בנייה" sublabel={`${duchEfes.constructionCostPerSqm.toLocaleString()} ₪/מ"ר`} value={formatCurrency(duchEfes.totalConstructionCost)} />
          <FinancialRow label="שווי קרקע" sublabel={`${plotArea} מ"ר`} value={formatCurrency(duchEfes.landValueEstimate)} />
          <FinancialRow
            label="היטל השבחה"
            sublabel="50% מעליית השווי"
            value={formatCurrency(duchEfes.bettermentLevy)}
            sourceId={duchEfes.sources[1]?.id}
            onSourceClick={handleSourceClick}
          />
          <div className="border-t border-border my-3" />
          <FinancialRow label="סה״כ עלויות" value={formatCurrency(duchEfes.totalCosts)} isBold />
          <div className="border-t-2 border-gold/30 my-3" />
          <FinancialRow label="רווח נקי" value={formatCurrency(duchEfes.profit)} isPositive isBold isHighlight />
        </div>
      </motion.div>

      {/* Unit Mix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan" />
          תמהיל דירות
        </h3>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>סוג דירה</th>
                <th>כמות</th>
                <th>גודל ממוצע</th>
                <th>מחיר למ&quot;ר</th>
                <th>שווי כולל</th>
              </tr>
            </thead>
            <tbody>
              {duchEfes.unitMix.map((unit, i) => (
                <tr key={i}>
                  <td className="font-semibold">{unit.type}</td>
                  <td className="metric-value">{unit.count}</td>
                  <td className="metric-value">{unit.avgSize} מ&quot;ר</td>
                  <td className="metric-value">{unit.pricePerSqm.toLocaleString()} ₪</td>
                  <td className="font-semibold text-gold metric-value">
                    {formatCurrency(unit.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Unit Mix Source */}
        {duchEfes.sources[2] && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => handleSourceClick(duchEfes.sources[2].id)}
              className="source-badge"
            >
              <FileText className="w-2.5 h-2.5" />
              דרישות תמהיל - עמ׳ {duchEfes.sources[2].pageNumber}
            </button>
          </div>
        )}
      </motion.div>

      {/* Zoning Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="font-bold text-lg mb-4">פרמטרים תכנוניים</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ParamCell label="אחוזי בנייה" value={`${zoningPlan.buildingPercentage}%`} />
          <ParamCell label="קומות מרביות" value={`${zoningPlan.maxFloors}`} />
          <ParamCell label="גובה מרבי" value={`${zoningPlan.maxHeight} מ׳`} />
          <ParamCell label="קו בניין קדמי" value={`${zoningPlan.frontSetback} מ׳`} />
          <ParamCell label="קו בניין צדדי" value={`${zoningPlan.sideSetback} מ׳`} />
          <ParamCell label="חניות ליח׳ דיור" value={`${zoningPlan.parkingRatio}`} />
        </div>
      </motion.div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color: 'cyan' | 'gold' | 'danger';
}) {
  const colorClasses = {
    cyan: 'border-cyan/20 text-cyan',
    gold: 'border-gold/20 text-gold',
    danger: 'border-danger/20 text-danger',
  };

  return (
    <div className={`glass-card p-4 border ${colorClasses[color].split(' ')[0]}`}>
      <p className="text-xs text-foreground-secondary mb-1">{label}</p>
      <p className={`text-xl font-black metric-value ${colorClasses[color].split(' ')[1]}`}>
        {value}
        {unit && <span className="text-xs text-foreground-secondary mr-1">{unit}</span>}
      </p>
    </div>
  );
}

function FinancialRow({
  label,
  sublabel,
  value,
  isPositive,
  isBold,
  isHighlight,
  sourceId,
  onSourceClick,
}: {
  label: string;
  sublabel?: string;
  value: string;
  isPositive?: boolean;
  isBold?: boolean;
  isHighlight?: boolean;
  sourceId?: string;
  onSourceClick?: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isHighlight ? 'p-3 rounded-xl bg-gold-dim' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div>
          <p className={`text-sm ${isBold ? 'font-bold' : ''}`}>{label}</p>
          {sublabel && (
            <p className="text-xs text-foreground-secondary">{sublabel}</p>
          )}
        </div>
        {sourceId && onSourceClick && (
          <button onClick={() => onSourceClick(sourceId)} className="source-badge">
            <FileText className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <p
        className={`metric-value ${isBold ? 'font-bold text-base' : 'text-sm'} ${
          isPositive ? 'text-success' : ''
        } ${isHighlight ? 'text-neon-gold text-lg' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function ParamCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface border border-border">
      <p className="text-[11px] text-foreground-secondary mb-1">{label}</p>
      <p className="font-bold text-sm metric-value">{value}</p>
    </div>
  );
}

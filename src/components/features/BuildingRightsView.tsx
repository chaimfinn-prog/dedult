'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Home,
  Droplets,
  ArrowDownToLine,
  Layers,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import type { BuildingRights, Enhancement, SourceReference } from '@/types';
import { useView } from '@/context/ViewContext';

interface Props {
  buildingRights: BuildingRights;
  enhancements: Enhancement[];
}

export function BuildingRightsView({ buildingRights, enhancements }: Props) {
  const { setActiveSourceId, setShowAuditTrail } = useView();

  const usagePercent = Math.round(
    (buildingRights.currentBuilt / buildingRights.totalAllowed) * 100
  );

  const handleSourceClick = (source: SourceReference) => {
    setActiveSourceId(source.id);
    setShowAuditTrail(true);
  };

  return (
    <div className="space-y-6">
      {/* Building Rights Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-cyan p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan" />
            זכויות בנייה
          </h3>
          <button
            onClick={() => handleSourceClick(buildingRights.sources[0])}
            className="source-badge"
          >
            <FileText className="w-3 h-3" />
            מקור
          </button>
        </div>

        {/* Usage Gauge */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground-secondary">ניצול זכויות</span>
            <span className="font-bold text-cyan metric-value">{usagePercent}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill progress-fill-cyan"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-foreground-secondary mt-1">
            <span>בנוי: {buildingRights.currentBuilt} מ&quot;ר</span>
            <span>מותר: {buildingRights.totalAllowed} מ&quot;ר</span>
          </div>
        </div>

        {/* Remaining Rights - Big Number */}
        <div className="text-center p-4 rounded-xl bg-background-secondary border border-border">
          <p className="text-foreground-secondary text-sm mb-1">
            יתרת זכויות בנייה
          </p>
          <p className="text-4xl font-black text-neon-cyan metric-value">
            {buildingRights.remaining}
            <span className="text-lg text-foreground-secondary mr-1">מ&quot;ר</span>
          </p>
        </div>

        {/* Breakdown */}
        <div className="mt-4 space-y-2">
          {buildingRights.breakdown.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.label}</span>
                <button
                  onClick={() => handleSourceClick(item.source)}
                  className="source-badge"
                >
                  <FileText className="w-2.5 h-2.5" />
                  עמ׳ {item.source.pageNumber}
                </button>
              </div>
              <div className="text-left">
                <span className="font-bold text-sm metric-value">{item.sqm} מ&quot;ר</span>
                <span className="text-xs text-foreground-secondary mr-2 metric-value">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Enhancement Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-cyan" />
          הזדמנויות השבחה
        </h3>

        <div className="space-y-3">
          {enhancements.map((enh, i) => (
            <EnhancementCard
              key={i}
              enhancement={enh}
              onSourceClick={() => handleSourceClick(enh.source)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EnhancementCard({
  enhancement,
  onSourceClick,
}: {
  enhancement: Enhancement;
  onSourceClick: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    extension: <Home className="w-4 h-4" />,
    pool: <Droplets className="w-4 h-4" />,
    basement: <ArrowDownToLine className="w-4 h-4" />,
    floor: <Layers className="w-4 h-4" />,
    mamad: <Shield className="w-4 h-4" />,
    balcony: <Home className="w-4 h-4" />,
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`p-4 rounded-xl border transition-all ${
        enhancement.isEligible
          ? 'bg-surface border-border hover:border-cyan'
          : 'bg-surface/50 border-border opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              enhancement.isEligible ? 'bg-cyan-dim text-cyan' : 'bg-danger-dim text-danger'
            }`}
          >
            {icons[enhancement.type]}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{enhancement.title}</h4>
            <p className="text-xs text-foreground-secondary">{enhancement.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enhancement.isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <XCircle className="w-5 h-5 text-danger" />
          )}
          <button onClick={onSourceClick} className="source-badge">
            <FileText className="w-2.5 h-2.5" />
            מקור
          </button>
        </div>
      </div>

      {enhancement.isEligible && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-background-secondary text-center">
            <p className="text-[10px] text-foreground-secondary">שטח נוסף</p>
            <p className="font-bold text-xs text-cyan metric-value">
              {enhancement.additionalSqm} מ&quot;ר
            </p>
          </div>
          <div className="p-2 rounded-lg bg-background-secondary text-center">
            <p className="text-[10px] text-foreground-secondary">עלות משוערת</p>
            <p className="font-bold text-xs metric-value">
              {formatCurrency(enhancement.estimatedCost)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-background-secondary text-center">
            <p className="text-[10px] text-foreground-secondary">תוספת שווי</p>
            <p className="font-bold text-xs text-neon-gold metric-value">
              {formatCurrency(enhancement.estimatedValueAdd)}
            </p>
          </div>
        </div>
      )}

      {!enhancement.isEligible && (
        <p className="text-xs text-danger mt-2">{enhancement.eligibilityReason}</p>
      )}
    </motion.div>
  );
}

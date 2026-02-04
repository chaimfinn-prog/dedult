'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  Download,
  FileText,
  Home,
  Layers,
  Map,
  Radar,
  RotateCcw,
  Shield,
  TrendingUp,
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { zoningTypeLabels } from '@/types';
import { Building3D } from './Building3D';
import { DeveloperCalculator } from './DeveloperCalculator';
import { RadarScanner } from './RadarScanner';

interface DeveloperDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function DeveloperDashboard({ result, onReset }: DeveloperDashboardProps) {
  const { property, zoningPlan, calculations, financial, envelope, developerReport } = result;

  const allowedBuiltSqm = calculations.maxBuildableArea;
  const avgPrice = financial.neighborhoodAvgPrice || financial.pricePerSqm;
  const revenueEstimation = allowedBuiltSqm * avgPrice;
  const constructionCosts = allowedBuiltSqm * financial.constructionCostPerSqm;
  const valueOld = property.currentBuiltArea * avgPrice;
  const bettermentLevyEstimate = Math.max(revenueEstimation - valueOld, 0) * 0.5;
  const grossProfit = revenueEstimation - (constructionCosts + bettermentLevyEstimate);
  const totalCost = constructionCosts + bettermentLevyEstimate;
  const profitMarginPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  const zeroReportJson = {
    revenue_estimation: Math.round(revenueEstimation),
    construction_costs: Math.round(constructionCosts),
    betterment_levy_estimate: Math.round(bettermentLevyEstimate),
    gross_profit: Math.round(grossProfit),
    profit_margin_percent: Number(profitMarginPercent.toFixed(2)),
  };

  const permitChecks = [
    {
      label: 'סטטוס תכנית',
      value: zoningPlan.status === 'active' ? 'מאושרת' : 'לא מאושרת',
      pass: zoningPlan.status === 'active',
    },
    {
      label: 'סיווג',
      value: 'תכנית מפורטת / מתאר מקומית',
      pass: true,
    },
    {
      label: 'חריגות',
      value: 'ללא תכניות מתאר כלליות (תמ"א/תמ"מ)',
      pass: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onReset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" />
          <span>חיפוש חדש</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="badge badge-accent font-mono text-[10px]">DEVELOPER DASHBOARD</span>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span>{'הורד דו"ח'}</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="db-card p-6 relative overflow-hidden"
      >
        <div className="scan-line" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-accent-light">
              <TrendingUp className="w-4 h-4" />
              <span>{'דו"ח יזם - כדאיות כלכלית'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-gradient">
              {formatNumber(calculations.additionalBuildableArea)} {'מ"ר'} תוספת בנייה
            </h2>
            <p className="text-xs text-foreground-muted mt-2">
              {zoningPlan.planNumber} | {zoningPlan.neighborhood}, {property.city} | גוש {property.block} חלקה {property.parcel}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <MetricCard label="הכנסות" value={`${formatCurrency(revenueEstimation)} ₪`} />
            <MetricCard label="עלויות" value={`${formatCurrency(constructionCosts)} ₪`} />
            <MetricCard label="היטל השבחה" value={`${formatCurrency(bettermentLevyEstimate)} ₪`} />
            <MetricCard label="רווח גולמי" value={`${formatCurrency(grossProfit)} ₪`} highlight />
          </div>
        </div>
      </motion.div>

      {/* Split Screen */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Map + Massing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="db-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Map className="w-4 h-4 text-accent" />
                שכבת מיפוי + סריקת רדאר
              </h3>
              <span className="badge badge-success text-[10px]">LIVE GIS</span>
            </div>
            <div className="relative h-64 rounded-xl bg-[linear-gradient(135deg,rgba(10,25,47,0.9),rgba(15,23,42,0.8))] border border-border overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #1d4ed8 0, transparent 50%), radial-gradient(circle at 80% 30%, #0ea5e9 0, transparent 45%), linear-gradient(120deg, rgba(212,175,55,0.18), transparent 60%)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <RadarScanner />
              </div>
              <div className="absolute bottom-3 left-3 text-[10px] text-foreground-muted flex items-center gap-2">
                <Radar className="w-3.5 h-3.5 text-accent" />
                {'RADAR // סורק מגרש + תב"ע מאושרת'}
              </div>
            </div>
          </div>

          <div className="db-card p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-accent" />
              Massing 3D (זכויות בנייה)
            </h3>
            <Building3D
              floors={calculations.floorBreakdown}
              currentBuiltArea={calculations.currentBuiltArea}
              maxBuildableArea={calculations.maxBuildableArea}
              maxFloors={zoningPlan.buildingRights.maxFloors}
              plotWidth={property.plotWidth}
              plotDepth={property.plotDepth}
            />
            {envelope && (
              <div className="mt-3 text-[11px] text-foreground-muted">
                מעטפת: {formatNumber(envelope.totalEnvelopeVolume)} {'מ"ר'} | ניצולת {envelope.utilizationPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Right: Data Tables */}
        <div className="lg:col-span-3 space-y-6">
          <div className="db-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-accent" />
              {'תב"ע חלה + נתוני בסיס'}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoCard label="ייעוד קרקע" value={zoningTypeLabels[zoningPlan.zoningType]} icon={<Layers className="w-3.5 h-3.5" />} />
              <InfoCard label="אחוזי בנייה" value={`${zoningPlan.buildingRights.totalBuildingPercent}%`} icon={<BarChart3 className="w-3.5 h-3.5" />} />
              <InfoCard label="קומות מרביות" value={String(zoningPlan.buildingRights.maxFloors)} icon={<Building2 className="w-3.5 h-3.5" />} />
              <InfoCard label="צפיפות" value={`עד ${zoningPlan.buildingRights.maxUnits} יח"ד`} icon={<Home className="w-3.5 h-3.5" />} />
              <InfoCard label="גובה מרבי" value={`${zoningPlan.buildingRights.maxHeight} מ'`} icon={<ArrowRight className="w-3.5 h-3.5" />} />
              <InfoCard label="תכסית" value={`${zoningPlan.buildingRights.landCoveragePercent}%`} icon={<Layers className="w-3.5 h-3.5" />} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="db-card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-accent" />
                Valid Permit Rule
              </h3>
              <div className="space-y-2">
                {permitChecks.map((check) => (
                  <div key={check.label} className="flex items-center justify-between text-xs">
                    <span className="text-foreground-muted">{check.label}</span>
                    <span className={`flex items-center gap-1 ${check.pass ? 'text-success' : 'text-danger'}`}>
                      {check.pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                      {check.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-foreground-muted">
                תקן זה מבוסס על Ra/Ra/10/B כתכנית ייחוס למתן היתרים.
              </div>
            </div>

            <div className="db-card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-accent" />
                Zero Report JSON
              </h3>
              <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap text-foreground-secondary bg-[rgba(17,24,39,0.5)] border border-border/50 rounded-lg p-3">
                {JSON.stringify(zeroReportJson, null, 2)}
              </pre>
            </div>
          </div>

          {developerReport && (
            <div className="db-card p-4">
              <DeveloperCalculator report={developerReport} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 border ${highlight ? 'border-gold/40 bg-gold/10' : 'border-border/60 bg-[rgba(17,24,39,0.4)]'}`}>
      <div className="text-[10px] text-foreground-muted mb-1">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? 'text-gold-light' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.45)] border border-border/50">
      <div className="flex items-center gap-2 text-[10px] text-foreground-muted mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

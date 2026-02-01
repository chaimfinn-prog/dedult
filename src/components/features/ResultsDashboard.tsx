'use client';

import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  ArrowRight,
  MapPin,
  FileText,
  Layers,
  ParkingCircle,
  TreePine,
  Ruler,
  Shield,
  Home,
  Banknote,
  HardHat,
  CircleDollarSign,
  RotateCcw,
  Download,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { zoningTypeLabels } from '@/types';

function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL').format(n);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M ₪`;
  }
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ResultsDashboard() {
  const { result, reset } = useZoning();

  if (!result) return null;

  const { property, zoningPlan, calculations, financial } = result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={reset}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>חיפוש חדש</span>
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>הורד דו&quot;ח</span>
        </button>
      </div>

      {/* Main stat hero */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="glass-card-strong p-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/15 text-success text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>פוטנציאל בנייה נוסף</span>
        </div>
        <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-l from-accent to-success bg-clip-text text-transparent">
          {formatNumber(calculations.additionalBuildableArea)} מ&quot;ר
        </div>
        <p className="text-foreground-secondary">
          על מגרש של {formatNumber(property.plotSize)} מ&quot;ר ב{zoningPlan.neighborhood}, {property.city}
        </p>
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 columns - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              פרטי הנכס
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="כתובת" value={property.address} />
              <InfoItem label="גוש" value={property.block} />
              <InfoItem label="חלקה" value={property.parcel} />
              <InfoItem label="שכונה" value={zoningPlan.neighborhood} />
            </div>
          </motion.div>

          {/* Zoning Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              תב&quot;ע חלה: {zoningPlan.planNumber}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Layers className="w-4 h-4" />}
                label="ייעוד"
                value={zoningTypeLabels[zoningPlan.zoningType]}
              />
              <StatCard
                icon={<Building2 className="w-4 h-4" />}
                label="אחוזי בנייה"
                value={`${zoningPlan.buildingRights.totalBuildingPercent}%`}
              />
              <StatCard
                icon={<Layers className="w-4 h-4" />}
                label="מקסימום קומות"
                value={String(zoningPlan.buildingRights.maxFloors)}
              />
              <StatCard
                icon={<Ruler className="w-4 h-4" />}
                label="גובה מקסימלי"
                value={`${zoningPlan.buildingRights.maxHeight} מ'`}
              />
              <StatCard
                icon={<Home className="w-4 h-4" />}
                label="יח' דיור מקסימלי"
                value={String(zoningPlan.buildingRights.maxUnits)}
              />
              <StatCard
                icon={<ParkingCircle className="w-4 h-4" />}
                label="חניות נדרשות"
                value={String(calculations.parkingSpaces)}
              />
            </div>
          </motion.div>

          {/* Floor Breakdown Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              פירוט לפי קומות
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-right py-3 px-4 font-semibold text-foreground-secondary">
                      קומה
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground-secondary">
                      שטח עיקרי (מ&quot;ר)
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground-secondary">
                      שטח שירות (מ&quot;ר)
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground-secondary">
                      סה&quot;כ (מ&quot;ר)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.floorBreakdown.map((floor, i) => (
                    <motion.tr
                      key={floor.floor + i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="border-b border-border/20 hover:bg-accent/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{floor.label}</td>
                      <td className="py-3 px-4 text-center price">
                        {formatNumber(floor.mainArea)}
                      </td>
                      <td className="py-3 px-4 text-center price">
                        {formatNumber(floor.serviceArea)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold price">
                        {formatNumber(floor.totalArea)}
                      </td>
                    </motion.tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-accent/10 font-bold">
                    <td className="py-3 px-4">סה&quot;כ</td>
                    <td className="py-3 px-4 text-center price">
                      {formatNumber(calculations.mainAreaTotal)}
                    </td>
                    <td className="py-3 px-4 text-center price">
                      {formatNumber(calculations.serviceAreaTotal)}
                    </td>
                    <td className="py-3 px-4 text-center price">
                      {formatNumber(calculations.maxBuildableArea)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Restrictions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              מגבלות ונסיגות
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                icon={<ArrowRight className="w-4 h-4" />}
                label="נסיגה קדמית"
                value={`${zoningPlan.restrictions.frontSetback} מ'`}
              />
              <StatCard
                icon={<ArrowRight className="w-4 h-4 rotate-180" />}
                label="נסיגה אחורית"
                value={`${zoningPlan.restrictions.rearSetback} מ'`}
              />
              <StatCard
                icon={<ArrowRight className="w-4 h-4 -rotate-90" />}
                label="נסיגה צדדית"
                value={`${zoningPlan.restrictions.sideSetback} מ'`}
              />
              <StatCard
                icon={<TreePine className="w-4 h-4" />}
                label="שטח ירוק נדרש"
                value={`${formatNumber(calculations.greenArea)} מ"ר`}
              />
              <StatCard
                icon={<Layers className="w-4 h-4" />}
                label="כיסוי קרקע מקסימלי"
                value={`${formatNumber(calculations.landCoverageArea)} מ"ר`}
              />
              <StatCard
                icon={<ParkingCircle className="w-4 h-4" />}
                label="חניות"
                value={`${calculations.parkingSpaces} מקומות`}
              />
            </div>
          </motion.div>

          {/* TMA 38 Card */}
          {zoningPlan.tmaRights?.eligible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6 border-2 border-success/30"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-success">
                <Shield className="w-5 h-5" />
                זכויות תמ&quot;א 38
              </h3>
              <p className="text-foreground-secondary mb-4">
                {zoningPlan.tmaRights.notes}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={<Building2 className="w-4 h-4" />}
                  label="קומות נוספות"
                  value={String(zoningPlan.tmaRights.additionalFloors)}
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="תוספת אחוזי בנייה"
                  value={`${zoningPlan.tmaRights.additionalBuildingPercent}%`}
                />
              </div>
              {zoningPlan.tmaRights.seismicUpgradeRequired && (
                <p className="text-sm text-warning mt-3">
                  * נדרש חיזוק מבנה מפני רעידות אדמה
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Right column - Financial sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-strong p-6 sticky top-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-accent" />
              מה זה אומר בכסף?
            </h3>

            <div className="space-y-5">
              {/* Value estimate */}
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-1">
                  <CircleDollarSign className="w-4 h-4 text-success" />
                  <span>שווי תוספת בנייה</span>
                </div>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(financial.additionalValueEstimate)}
                </div>
                <p className="text-xs text-foreground-secondary mt-1">
                  לפי {formatNumber(financial.pricePerSqm)} ₪/מ&quot;ר באזור
                </p>
              </div>

              {/* Construction cost */}
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-1">
                  <HardHat className="w-4 h-4 text-warning" />
                  <span>עלות בנייה משוערת</span>
                </div>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(financial.estimatedConstructionCost)}
                </div>
                <p className="text-xs text-foreground-secondary mt-1">
                  לפי {formatNumber(financial.constructionCostPerSqm)} ₪/מ&quot;ר
                </p>
              </div>

              {/* Profit */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-1">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span>רווח פוטנציאלי</span>
                </div>
                <div
                  className={`text-2xl font-bold ${financial.estimatedProfit > 0 ? 'text-success' : 'text-danger'}`}
                >
                  {formatCurrency(financial.estimatedProfit)}
                </div>
              </div>

              {/* Summary stats */}
              <div className="border-t border-border/30 pt-4 space-y-3">
                <SummaryRow
                  label="גודל מגרש"
                  value={`${formatNumber(property.plotSize)} מ"ר`}
                />
                <SummaryRow
                  label="שטח בנוי קיים"
                  value={`${formatNumber(property.currentBuiltArea)} מ"ר`}
                />
                <SummaryRow
                  label='סה"כ מותר'
                  value={`${formatNumber(calculations.maxBuildableArea)} מ"ר`}
                />
                <SummaryRow
                  label="פוטנציאל נוסף"
                  value={`${formatNumber(calculations.additionalBuildableArea)} מ"ר`}
                  highlight
                />
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-foreground-secondary/70 leading-relaxed">
                * הערכה ראשונית בלבד. לקבלת חוות דעת מקצועית יש לפנות לאדריכל
                או שמאי מקרקעין מוסמך. הנתונים מבוססים על תב&quot;ע חלה ומחירי
                שוק ממוצעים.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-foreground-secondary">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-background/50 border border-border/30">
      <div className="flex items-center gap-1.5 text-foreground-secondary text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-bold text-base">{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className={highlight ? 'font-bold text-accent' : 'font-medium'}>
        {value}
      </span>
    </div>
  );
}

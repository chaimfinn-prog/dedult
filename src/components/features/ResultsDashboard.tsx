'use client';

import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  MapPin,
  FileText,
  Layers,
  ParkingCircle,
  TreePine,
  Ruler,
  Shield,
  Home,
  RotateCcw,
  Download,
  Eye,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { zoningTypeLabels } from '@/types';
import { Building3D } from './Building3D';
import { ProfitSlider } from './ProfitSlider';

function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL').format(n);
}

export function ResultsDashboard() {
  const { result, reset } = useZoning();
  if (!result) return null;

  const { property, zoningPlan, calculations, financial, urbanRenewalEligibility } = result;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" />
          <span>חיפוש חדש</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="badge badge-accent font-mono text-[10px]">ZCHUT.AI REPORT</span>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span>{"הורד דו\"ח"}</span>
          </button>
        </div>
      </div>

      {/* Main stat hero */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="glass-card-strong p-8 text-center relative overflow-hidden"
      >
        <div className="scan-line" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>פוטנציאל בנייה נוסף</span>
        </div>
        <div className="text-5xl md:text-6xl font-bold mb-2">
          <span className="text-gradient">{formatNumber(calculations.additionalBuildableArea)}</span>
          <span className="text-foreground-secondary text-2xl mr-2">{"מ\"ר"}</span>
        </div>
        <p className="text-foreground-secondary text-sm">
          מגרש {formatNumber(property.plotSize)} {"מ\"ר"} | {zoningPlan.neighborhood}, {property.city} | גוש {property.block} חלקה {property.parcel}
        </p>
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D Building + Property Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 3D Building */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground-secondary">
                <Building2 className="w-4 h-4 text-accent" />
                Massing Study
              </h3>
              <Building3D
                floors={calculations.floorBreakdown}
                currentBuiltArea={calculations.currentBuiltArea}
                maxBuildableArea={calculations.maxBuildableArea}
                maxFloors={zoningPlan.buildingRights.maxFloors}
              />
            </motion.div>

            {/* Property Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                פרטי הנכס
              </h3>
              <div className="space-y-3">
                <InfoRow label="כתובת" value={property.address} />
                <InfoRow label="גוש / חלקה" value={`${property.block} / ${property.parcel}`} />
                <InfoRow label="שכונה" value={zoningPlan.neighborhood} />
                <InfoRow label="שטח מגרש" value={`${formatNumber(property.plotSize)} מ"ר`} />
                {property.plotWidth && property.plotDepth && (
                  <InfoRow label="מידות" value={`${property.plotWidth}×${property.plotDepth} מ'`} />
                )}
                <InfoRow label="שטח בנוי קיים" value={`${formatNumber(property.currentBuiltArea)} מ"ר`} />
                <InfoRow label="קומות קיימות" value={String(property.currentFloors)} />
              </div>
            </motion.div>
          </div>

          {/* Zoning Plan Card with Citations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                {"תב\"ע חלה: "}{zoningPlan.planNumber}
              </h3>
              <span className="badge badge-accent text-[10px]">
                {zoningPlan.sourceDocument.lastUpdated}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="ייעוד קרקע" value={zoningTypeLabels[zoningPlan.zoningType]} />
              <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label='אחוזי בנייה (סה"כ)' value={`${zoningPlan.buildingRights.totalBuildingPercent}%`} />
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="קומות מרביות" value={String(zoningPlan.buildingRights.maxFloors)} />
              <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label="גובה מרבי" value={`${zoningPlan.buildingRights.maxHeight} מ'`} />
              <StatCard icon={<Home className="w-3.5 h-3.5" />} label={'צפיפות (יח"ד)'} value={`עד ${zoningPlan.buildingRights.maxUnits}`} />
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="תכסית" value={`${zoningPlan.buildingRights.landCoveragePercent}%`} />
            </div>

            {/* Source Citations */}
            {zoningPlan.buildingRights.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground-muted mb-2 flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  הוכחות מקור (Source Citations)
                </h4>
                <div className="space-y-2">
                  {zoningPlan.buildingRights.citations.map((c, i) => (
                    <div key={i} className="text-xs p-2.5 rounded-lg bg-background-secondary/50 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-accent-light">{c.value}</span>
                        <div className="flex items-center gap-2">
                          <span className={`badge text-[9px] ${c.confidence >= 95 ? 'badge-success' : c.confidence >= 85 ? 'badge-warning' : 'badge-danger'}`}>
                            {c.confidence}% ודאות
                          </span>
                        </div>
                      </div>
                      <div className="text-foreground-muted">{c.section}</div>
                      <div className="mt-1 text-foreground-secondary/70 italic">{`"${c.quote}"`}</div>
                      {c.page && <div className="mt-1 text-foreground-muted">עמוד {c.page}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Floor Breakdown Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              פירוט שטחים לפי קומות ומקור זכות
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-2.5 px-3 font-semibold text-foreground-muted text-xs">קומה / מקור</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-foreground-muted text-xs">{"שטח עיקרי (מ\"ר)"}</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-foreground-muted text-xs">{"שטח שירות (מ\"ר)"}</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-foreground-muted text-xs">{"סה\"כ (מ\"ר)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.floorBreakdown.map((floor, i) => (
                    <motion.tr
                      key={floor.floor + i}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className={`border-b border-border/50 hover:bg-accent/3 transition-colors ${
                        floor.floor === 'tma' ? 'bg-gold/5' :
                        floor.floor === 'urban_renewal' ? 'bg-accent/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-sm">
                        {floor.label}
                        {floor.floor === 'tma' && <span className="mr-1 text-gold text-[10px]">★ תמ&quot;א</span>}
                        {floor.floor === 'urban_renewal' && <span className="mr-1 text-accent text-[10px]">★ התחדשות</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center price font-mono text-sm">{formatNumber(floor.mainArea)}</td>
                      <td className="py-2.5 px-3 text-center price font-mono text-sm">{formatNumber(floor.serviceArea)}</td>
                      <td className="py-2.5 px-3 text-center font-semibold price font-mono text-sm">{formatNumber(floor.totalArea)}</td>
                    </motion.tr>
                  ))}
                  <tr className="bg-accent/8 font-bold">
                    <td className="py-2.5 px-3">{"סה\"כ"}</td>
                    <td className="py-2.5 px-3 text-center price font-mono">{formatNumber(calculations.mainAreaTotal)}</td>
                    <td className="py-2.5 px-3 text-center price font-mono">{formatNumber(calculations.serviceAreaTotal)}</td>
                    <td className="py-2.5 px-3 text-center price font-mono">{formatNumber(calculations.maxBuildableArea)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Restrictions & Setbacks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              קווי בניין ומגבלות
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard icon={<ArrowRight className="w-3.5 h-3.5" />} label="נסיגה קדמית" value={`${zoningPlan.restrictions.frontSetback} מ'`} />
              <StatCard icon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />} label="נסיגה אחורית" value={`${zoningPlan.restrictions.rearSetback} מ'`} />
              <StatCard icon={<ArrowRight className="w-3.5 h-3.5 -rotate-90" />} label="נסיגה צדדית" value={`${zoningPlan.restrictions.sideSetback} מ'`} />
              <StatCard icon={<TreePine className="w-3.5 h-3.5" />} label="שטח ירוק" value={`${formatNumber(calculations.greenArea)} מ"ר`} />
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="תכסית" value={`${formatNumber(calculations.landCoverageArea)} מ"ר`} />
              <StatCard icon={<ParkingCircle className="w-3.5 h-3.5" />} label="חניות נדרשות" value={`${calculations.parkingSpaces}`} />
            </div>
          </motion.div>

          {/* ========== TMA 38 Eligibility Section ========== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={urbanRenewalEligibility.tma38Eligible ? 'glass-card-gold p-6' : 'glass-card p-6'}
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              <span className={urbanRenewalEligibility.tma38Eligible ? 'text-gradient-gold' : ''}>
                {"בדיקת זכאות תמ\"א 38"}
              </span>
              {urbanRenewalEligibility.tma38Eligible ? (
                <span className="badge badge-success text-[10px]">זכאי</span>
              ) : (
                <span className="badge badge-danger text-[10px]">לא זכאי</span>
              )}
            </h3>

            {/* Eligibility criteria checklist */}
            <div className="space-y-2 mb-4">
              {urbanRenewalEligibility.tma38Criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.met ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  )}
                  <span className="text-foreground-secondary">{c.criterion}:</span>
                  <span className={`font-medium ${c.met ? 'text-foreground' : 'text-danger'}`}>{c.actual}</span>
                  <span className="text-foreground-muted text-xs">(נדרש: {c.required})</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-foreground-secondary mb-3">{urbanRenewalEligibility.tma38Reason}</p>

            {urbanRenewalEligibility.tma38Eligible && zoningPlan.tmaRights && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label="קומות נוספות" value={String(zoningPlan.tmaRights.additionalFloors)} />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="תוספת אחוזי בנייה" value={`${zoningPlan.tmaRights.additionalBuildingPercent}%`} />
                <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label={'תוספת שטח מכוח תמ"א'} value={`${formatNumber(urbanRenewalEligibility.tmaAdditionalArea)} מ"ר`} />
                <StatCard icon={<Calendar className="w-3.5 h-3.5" />} label="סוג תמ&quot;א" value={`38/${zoningPlan.tmaRights.tmaType === '38/1' ? '1 (חיזוק)' : '2 (הריסה)'}`} />
              </div>
            )}

            {zoningPlan.tmaRights?.seismicUpgradeRequired && urbanRenewalEligibility.tma38Eligible && (
              <p className="text-xs text-warning mt-3">* נדרש חיזוק סיסמי בהתאם לתקן ישראלי 413</p>
            )}
          </motion.div>

          {/* ========== Urban Renewal Plan רע/רע/ב Section ========== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={urbanRenewalEligibility.urbanRenewalPlanEligible ? 'glass-card-gold p-6' : 'glass-card p-6'}
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span className={urbanRenewalEligibility.urbanRenewalPlanEligible ? 'text-gradient-gold' : ''}>
                {"תכנית התחדשות עירונית "}{urbanRenewalEligibility.urbanRenewalPlanNumber}
              </span>
              {urbanRenewalEligibility.urbanRenewalPlanEligible ? (
                <span className="badge badge-success text-[10px]">זכאי</span>
              ) : (
                <span className="badge badge-danger text-[10px]">לא זכאי</span>
              )}
            </h3>

            {/* Eligibility criteria checklist */}
            <div className="space-y-2 mb-4">
              {urbanRenewalEligibility.urbanRenewalCriteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.met ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  )}
                  <span className="text-foreground-secondary">{c.criterion}:</span>
                  <span className={`font-medium ${c.met ? 'text-foreground' : 'text-danger'}`}>{c.actual}</span>
                  <span className="text-foreground-muted text-xs">(נדרש: {c.required})</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-foreground-secondary mb-3">{urbanRenewalEligibility.urbanRenewalReason}</p>

            {urbanRenewalEligibility.urbanRenewalPlanEligible && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label="תוספת קומות" value="עד 3" />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="תוספת אחוזי בנייה" value="50%" />
                <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label="תוספת שטח" value={`${formatNumber(urbanRenewalEligibility.urbanRenewalAdditionalArea)} מ"ר`} />
                <StatCard icon={<Home className="w-3.5 h-3.5" />} label="בונוס מרפסות" value={'12 מ"ר ליח"ד'} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column - Profit Slider */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-6 space-y-6"
          >
            <ProfitSlider
              additionalArea={calculations.additionalBuildableArea}
              defaultPricePerSqm={financial.pricePerSqm}
              constructionCostPerSqm={financial.constructionCostPerSqm}
              costBreakdown={financial.costBreakdown}
            />

            {/* Summary */}
            <div className="glass-card p-5">
              <h4 className="font-semibold text-xs text-foreground-muted mb-3">סיכום נתונים</h4>
              <div className="space-y-2.5">
                <SummaryRow label="שטח מגרש" value={`${formatNumber(property.plotSize)} מ"ר`} />
                <SummaryRow label="שטח בנוי קיים" value={`${formatNumber(calculations.currentBuiltArea)} מ"ר`} />
                <SummaryRow label={'מותר מכוח תב"ע'} value={`${formatNumber(calculations.maxBuildableArea)} מ"ר`} />
                {urbanRenewalEligibility.tma38Eligible && (
                  <SummaryRow label={'תוספת תמ"א 38'} value={`${formatNumber(urbanRenewalEligibility.tmaAdditionalArea)} מ"ר`} />
                )}
                {urbanRenewalEligibility.urbanRenewalPlanEligible && (
                  <SummaryRow label={`תוספת ${urbanRenewalEligibility.urbanRenewalPlanNumber}`} value={`${formatNumber(urbanRenewalEligibility.urbanRenewalAdditionalArea)} מ"ר`} />
                )}
                <div className="border-t border-border pt-2">
                  <SummaryRow label="פוטנציאל נוסף" value={`${formatNumber(calculations.additionalBuildableArea)} מ"ר`} highlight />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
              <p className="text-[10px] text-foreground-muted leading-relaxed">
                {"* דו\"ח זה הינו הערכה ראשונית בלבד ואינו מהווה חוות דעת מקצועית. "}
                {"לקבלת חוות דעת מחייבת יש לפנות לאדריכל רישוי או שמאי מקרקעין מוסמך. "}
                {"הנתונים מבוססים על תב\"ע חלה כפי שפורסמה במאגר התכנון הארצי. "}
                {"היטלים ואגרות לפי תעריפי עיריית רעננה 2024."}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-background-secondary/40 border border-border/50">
      <div className="flex items-center gap-1.5 text-foreground-muted text-[10px] mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-bold text-sm">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-foreground-muted">{label}</span>
      <span className={highlight ? 'font-bold text-accent-light' : 'font-medium'}>{value}</span>
    </div>
  );
}

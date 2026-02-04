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
  ClipboardList,
  Box,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { zoningTypeLabels } from '@/types';
import type { AuditStep } from '@/types';
import { Building3D } from './Building3D';
import { ProfitSlider } from './ProfitSlider';
import { DeveloperDashboard } from './DeveloperDashboard';

function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL').format(n);
}



export function ResultsDashboard() {
  const { result, reset, userPath } = useZoning();
  if (!result) return null;

  const { property, zoningPlan, calculations, financial, urbanRenewalEligibility, envelope, auditTrail } = result;

  if (userPath === 'developer') {
    return <DeveloperDashboard result={result} onReset={reset} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" />
          <span>חיפוש חדש</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="badge badge-accent font-mono text-[10px]">
            HOMEOWNER REPORT
          </span>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span>{"הורד דו\"ח"}</span>
          </button>
        </div>
      </div>

      {/* Hero stat */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="db-card p-8 text-center relative overflow-hidden"
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
        {envelope && (
          <p className="text-xs mt-2">
            <span className={envelope.fits ? 'text-success' : 'text-warning'}>
              מעטפת בניין: {formatNumber(envelope.totalEnvelopeVolume)} {"מ\"ר"} | ניצולת: {envelope.utilizationPercent}%
              {!envelope.fits && ' - חריגה, נדרשת הקלה'}
            </span>
          </p>
        )}
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 3D + Property Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="db-card p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground-secondary">
                <Building2 className="w-4 h-4 text-accent" />
                Massing Study
              </h3>
              <Building3D
                floors={calculations.floorBreakdown}
                currentBuiltArea={calculations.currentBuiltArea}
                maxBuildableArea={calculations.maxBuildableArea}
                maxFloors={zoningPlan.buildingRights.maxFloors}
                plotWidth={property.plotWidth}
                plotDepth={property.plotDepth}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="db-card p-6 relative overflow-hidden">
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
              <div className="mt-4">
                <MapBackdropSmall />
              </div>
            </motion.div>
          </div>

          {/* Zoning Plan + Citations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="db-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                {"תב\"ע חלה: "}{zoningPlan.planNumber}
              </h3>
              <span className="badge badge-accent text-[10px]">{zoningPlan.sourceDocument.lastUpdated}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="ייעוד קרקע" value={zoningTypeLabels[zoningPlan.zoningType]} />
              <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label='אחוזי בנייה (סה"כ)' value={`${zoningPlan.buildingRights.totalBuildingPercent}%`} />
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="קומות מרביות" value={String(zoningPlan.buildingRights.maxFloors)} />
              <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label="גובה מרבי" value={`${zoningPlan.buildingRights.maxHeight} מ'`} />
              <StatCard icon={<Home className="w-3.5 h-3.5" />} label={'צפיפות (יח"ד)'} value={`עד ${zoningPlan.buildingRights.maxUnits}`} />
              <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="תכסית" value={`${zoningPlan.buildingRights.landCoveragePercent}%`} />
            </div>

            {zoningPlan.buildingRights.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground-muted mb-2 flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  הוכחות מקור (Source Citations)
                </h4>
                <div className="space-y-2">
                  {zoningPlan.buildingRights.citations.map((c, i) => (
                    <div key={i} className="text-xs p-2.5 rounded-lg bg-[rgba(17,24,39,0.5)] border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-accent-light">{c.value}</span>
                        <span className={`badge text-[9px] ${c.confidence >= 95 ? 'badge-success' : c.confidence >= 85 ? 'badge-warning' : 'badge-danger'}`}>
                          {c.confidence}% ודאות
                        </span>
                      </div>
                      <div className="text-foreground-muted">{c.section}</div>
                      <div className="mt-1 text-foreground-secondary/70 italic">{`"${c.quote}"`}</div>
                      {c.page && <div className="mt-1 text-foreground-muted">עמוד {c.page} — <span className="text-accent cursor-pointer hover:underline">צלילה ל-PDF</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Floor Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="db-card p-6">
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
                    <motion.tr key={floor.floor + i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                      className={`border-b border-border/50 ${floor.floor === 'tma' ? 'bg-gold/5' : floor.floor === 'urban_renewal' ? 'bg-accent/5' : ''}`}>
                      <td className="py-2.5 px-3 font-medium text-sm">
                        {floor.label}
                        {floor.floor === 'tma' && <span className="mr-1 text-gold text-[10px]">★ תמ&quot;א</span>}
                        {floor.floor === 'urban_renewal' && <span className="mr-1 text-accent text-[10px]">★ התחדשות</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm">{formatNumber(floor.mainArea)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm">{formatNumber(floor.serviceArea)}</td>
                      <td className="py-2.5 px-3 text-center font-semibold font-mono text-sm">{formatNumber(floor.totalArea)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Building Envelope Validation */}
          {envelope && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className={`glass-card p-6 ${!envelope.fits ? 'border-warning/30' : ''}`}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Box className="w-4 h-4 text-accent" />
                אימות מעטפת בניין (Envelope Validation)
                <span className={`badge text-[10px] ${envelope.fits ? 'badge-success' : 'badge-warning'}`}>
                  {envelope.fits ? 'נכנס במגרש' : 'חריגה'}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label="טביעת רגל נטו" value={`${formatNumber(envelope.netFootprint)} מ"ר`} />
                <StatCard icon={<Layers className="w-3.5 h-3.5" />} label="תכסית מרבית" value={`${formatNumber(envelope.maxCoverageArea)} מ"ר`} />
                <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label="נפח מעטפת" value={`${formatNumber(envelope.totalEnvelopeVolume)} מ"ר`} />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="ניצולת" value={`${envelope.utilizationPercent}%`} />
              </div>
              {/* Envelope calculation steps */}
              <div className="space-y-2">
                {envelope.steps.map((s, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-lg bg-[rgba(17,24,39,0.5)] border border-border/50">
                    <div className="font-semibold text-foreground-secondary mb-1">שלב {s.step}: {s.title}</div>
                    <div className="text-foreground-muted whitespace-pre-line font-mono text-[11px]">{s.calculation}</div>
                    <div className="mt-1 text-accent-light font-semibold">{s.result}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Setbacks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="db-card p-6">
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

          {/* TMA 38 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className={urbanRenewalEligibility.tma38Eligible ? 'db-card-gold p-6' : 'glass-card p-6'}>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              <span className={urbanRenewalEligibility.tma38Eligible ? 'text-gradient-gold' : ''}>{"בדיקת זכאות תמ\"א 38"}</span>
              {urbanRenewalEligibility.tma38Eligible ? <span className="badge badge-success text-[10px]">זכאי</span> : <span className="badge badge-danger text-[10px]">לא זכאי</span>}
            </h3>
            <div className="space-y-2 mb-4">
              {urbanRenewalEligibility.tma38Criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.met ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" /> : <XCircle className="w-4 h-4 text-danger flex-shrink-0" />}
                  <span className="text-foreground-secondary">{c.criterion}:</span>
                  <span className={`font-medium ${c.met ? 'text-foreground' : 'text-danger'}`}>{c.actual}</span>
                  <span className="text-foreground-muted text-xs">(נדרש: {c.required})</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground-secondary">{urbanRenewalEligibility.tma38Reason}</p>
            {urbanRenewalEligibility.tma38Eligible && zoningPlan.tmaRights && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label="קומות נוספות" value={String(zoningPlan.tmaRights.additionalFloors)} />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="תוספת אחוזי בנייה" value={`${zoningPlan.tmaRights.additionalBuildingPercent}%`} />
                <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label={'תוספת שטח מכוח תמ"א'} value={`${formatNumber(urbanRenewalEligibility.tmaAdditionalArea)} מ"ר`} />
                <StatCard icon={<Calendar className="w-3.5 h-3.5" />} label="סוג תמ&quot;א" value={`38/${zoningPlan.tmaRights.tmaType === '38/1' ? '1 (חיזוק)' : '2 (הריסה)'}`} />
              </div>
            )}
          </motion.div>

          {/* Urban Renewal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className={urbanRenewalEligibility.urbanRenewalPlanEligible ? 'db-card-gold p-6' : 'glass-card p-6'}>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span className={urbanRenewalEligibility.urbanRenewalPlanEligible ? 'text-gradient-gold' : ''}>
                {"תכנית התחדשות עירונית "}{urbanRenewalEligibility.urbanRenewalPlanNumber}
              </span>
              {urbanRenewalEligibility.urbanRenewalPlanEligible ? <span className="badge badge-success text-[10px]">זכאי</span> : <span className="badge badge-danger text-[10px]">לא זכאי</span>}
            </h3>
            <div className="space-y-2 mb-4">
              {urbanRenewalEligibility.urbanRenewalCriteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.met ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" /> : <XCircle className="w-4 h-4 text-danger flex-shrink-0" />}
                  <span className="text-foreground-secondary">{c.criterion}:</span>
                  <span className={`font-medium ${c.met ? 'text-foreground' : 'text-danger'}`}>{c.actual}</span>
                  <span className="text-foreground-muted text-xs">(נדרש: {c.required})</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground-secondary">{urbanRenewalEligibility.urbanRenewalReason}</p>
            {urbanRenewalEligibility.urbanRenewalPlanEligible && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <StatCard icon={<Building2 className="w-3.5 h-3.5" />} label="תוספת קומות" value="עד 3" />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="תוספת אחוזי בנייה" value="50%" />
                <StatCard icon={<Ruler className="w-3.5 h-3.5" />} label="תוספת שטח" value={`${formatNumber(urbanRenewalEligibility.urbanRenewalAdditionalArea)} מ"ר`} />
                <StatCard icon={<Home className="w-3.5 h-3.5" />} label="בונוס מרפסות" value={'12 מ"ר ליח"ד'} />
              </div>
            )}
          </motion.div>

          {/* ========== Audit Trail ========== */}
          {auditTrail && auditTrail.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="db-card p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-accent" />
                דו&quot;ח אימות שקוף (Audit Trail)
              </h3>
              <AuditTrailSection steps={auditTrail} />
            </motion.div>
          )}

        </div>

        {/* Right column */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sticky top-6 space-y-6">
            <div className="db-card p-5">
              <h4 className="font-semibold text-xs text-foreground-muted mb-3">מפת אזור</h4>
              <MapBackdrop />
            </div>
            <ProfitSlider
              additionalArea={calculations.additionalBuildableArea}
              defaultPricePerSqm={financial.pricePerSqm}
              constructionCostPerSqm={financial.constructionCostPerSqm}
              costBreakdown={financial.costBreakdown}
            />

            {/* Summary */}
            <div className="db-card p-5">
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
                {envelope && <SummaryRow label="מעטפת בניין" value={`${formatNumber(envelope.totalEnvelopeVolume)} מ"ר`} />}
                <div className="border-t border-border pt-2">
                  <SummaryRow label="פוטנציאל נוסף" value={`${formatNumber(calculations.additionalBuildableArea)} מ"ר`} highlight />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl border border-border bg-[rgba(17,24,39,0.3)]">
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

// ========== Audit Trail Component ==========
function AuditTrailSection({ steps }: { steps: AuditStep[] }) {
  const sourceIcons: Record<string, string> = {
    mapi_gis: 'מפ"י',
    iplan_api: 'iplan',
    rishui_zamin: 'רישוי זמין',
    raanana_gis: 'GIS רעננה',
    local_db: 'מאגר מקומי',
    calculation: 'מנוע חישוב',
  };

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.step} className="relative pr-8 pb-4 border-r-2 border-accent/30 last:border-0">
          <div className="absolute right-[-9px] top-0 w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-bold">
            {step.step}
          </div>
          <div className="mb-1">
            <span className="font-bold text-sm">{step.title}</span>
            <span className="text-foreground-muted text-xs mr-2">— {step.subtitle}</span>
          </div>
          <div className="bg-[rgba(17,24,39,0.5)] rounded-lg p-3 space-y-1.5">
            {Object.entries(step.data).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">{key}</span>
                <span className="font-medium font-mono">{String(val)}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px]">
            <span className="badge badge-accent">{sourceIcons[step.sourceType] || step.sourceType}</span>
            <span className="text-foreground-muted">{step.source}</span>
          </div>
        </div>
      ))}
    </div>
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
    <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.4)] border border-border/50">
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

function MapBackdrop() {
  return (
    <div
      className="h-40 rounded-xl border border-border overflow-hidden relative"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 80% 30%, rgba(14,165,233,0.3), transparent 50%), linear-gradient(135deg, rgba(10,25,47,0.9), rgba(15,23,42,0.8))',
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <div className="absolute bottom-2 left-2 text-[10px] text-foreground-muted">GIS Preview</div>
    </div>
  );
}

function MapBackdropSmall() {
  return (
    <div
      className="h-24 rounded-lg border border-border overflow-hidden relative"
      style={{
        backgroundImage:
          'radial-gradient(circle at 30% 30%, rgba(34,197,94,0.25), transparent 55%), radial-gradient(circle at 70% 40%, rgba(59,130,246,0.25), transparent 55%), linear-gradient(135deg, rgba(10,25,47,0.95), rgba(15,23,42,0.85))',
      }}
    >
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
      <div className="absolute bottom-1 left-2 text-[9px] text-foreground-muted">Parcel Preview</div>
    </div>
  );
}

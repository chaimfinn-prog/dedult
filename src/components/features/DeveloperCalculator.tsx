'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Building2, Landmark, HardHat,
  Banknote, TrendingUp, Calculator, FileText, Percent
} from 'lucide-react';
import type { DeveloperReport } from '@/types';

interface DeveloperCalculatorProps {
  report: DeveloperReport;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n);
}

function SectionHeader({
  letter,
  title,
  total,
  icon: Icon,
  color,
  isOpen,
  toggle,
}: {
  letter: string;
  title: string;
  total: number;
  icon: typeof Building2;
  color: string;
  isOpen: boolean;
  toggle: () => void;
}) {
  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: `${color}20`, color }}
        >
          {letter}
        </div>
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="font-medium text-foreground text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {fmt(total)} {'₪'}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
      </div>
    </button>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 text-xs">
      <div>
        <span className="text-foreground-muted">{label}</span>
        {sub && <span className="text-foreground-muted/50 mr-1 text-[10px]"> ({sub})</span>}
      </div>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function ConstructionRow({ label, area, costPerSqm, total }: { label: string; area: number; costPerSqm: number; total: number }) {
  if (area === 0 && total === 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5 px-3 text-xs">
      <span className="text-foreground-muted">{label}</span>
      <div className="flex items-center gap-4 font-mono">
        <span className="text-foreground-muted w-16 text-left">{area.toLocaleString()} {"מ\"ר"}</span>
        <span className="text-foreground-muted w-16 text-left">{costPerSqm.toLocaleString()} {'₪'}</span>
        <span className="text-foreground font-medium w-20 text-left">{fmt(total)} {'₪'}</span>
      </div>
    </div>
  );
}

export function DeveloperCalculator({ report }: DeveloperCalculatorProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['summary']));

  const toggle = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const profitColor = report.profitPercent >= 20 ? '#22c55e' :
    report.profitPercent >= 10 ? '#eab308' : '#ef4444';

  return (
    <div className="space-y-1">
      {/* Title */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-foreground">{'דו"ח אפס - תחשיב יזם'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${profitColor}20`, color: profitColor }}>
            {report.feasibilityNote}
          </span>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <motion.div
        className="mx-3 p-4 rounded-xl border"
        style={{ background: `${profitColor}08`, borderColor: `${profitColor}30` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-foreground">{fmt(report.revenue.total)}</div>
            <div className="text-[10px] text-foreground-muted">הכנסות</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{fmt(report.totalCostWithFinancing)}</div>
            <div className="text-[10px] text-foreground-muted">עלויות</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: profitColor }}>{fmt(report.grossProfit)}</div>
            <div className="text-[10px] text-foreground-muted">רווח</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: profitColor }}>{report.profitPercent}%</div>
            <div className="text-[10px] text-foreground-muted">תשואה</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: profitColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, (report.revenue.total / (report.revenue.total + report.totalCostWithFinancing)) * 200))}%` }}
            transition={{ delay: 0.5, duration: 1 }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-foreground-muted">
          <span>עלויות</span>
          <span>הכנסות</span>
        </div>
      </motion.div>

      {/* ── A. קרקע ── */}
      <SectionHeader
        letter="A"
        title="קרקע"
        total={report.land.total}
        icon={Landmark}
        color="#8b5cf6"
        isOpen={openSections.has('A')}
        toggle={() => toggle('A')}
      />
      <AnimatePresence>
        {openSections.has('A') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <Row label="רכישת קרקע / עסקת קומבינציה" value={`${fmt(report.land.acquisitionCost)} ₪`} />
              <Row label="היטל השבחה" value={`${fmt(report.land.bettermentLevy)} ₪`} sub="50%" />
              <Row label="היטל השבחה בגין תכניות בניין עיר" value={`${fmt(report.land.bettermentLevyCityPlan)} ₪`} sub="1%" />
              <Row label="מארגנים ויועצים חברתיים" value={`${fmt(report.land.consultants)} ₪`} />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ הוצאות קרקע'} value={`${fmt(report.land.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── B. עלויות עקיפות ── */}
      <SectionHeader
        letter="B"
        title="עלויות עקיפות / כלליות"
        total={report.indirectCosts.total}
        icon={FileText}
        color="#3b82f6"
        isOpen={openSections.has('B')}
        toggle={() => toggle('B')}
      />
      <AnimatePresence>
        {openSections.has('B') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <Row label="אגרות והיטלים" value={`${fmt(report.indirectCosts.feesAndLevies)} ₪`} sub="תחשיב נפרד" />
              <Row label="מס רכישה" value={`${fmt(report.indirectCosts.purchaseTax)} ₪`} sub="5%" />
              <Row label="עלויות מיוחדות לבעלים" value={`${fmt(report.indirectCosts.ownerSpecialCosts)} ₪`} sub="100%" />
              <Row label="עלויות כלליות" value={`${fmt(report.indirectCosts.ownerGeneralCosts)} ₪`} sub="30%" />
              <Row label="עלויות שירות" value={`${fmt(report.indirectCosts.ownerServiceCosts)} ₪`} sub="30%" />
              <Row label="חיבור חשמל מגורים" value={`${fmt(report.indirectCosts.electricityResidential)} ₪`} sub="18%" />
              <Row label="חיבור חשמל מסחר + תעסוקה" value={`${fmt(report.indirectCosts.electricityCommercial)} ₪`} />
              <Row label="חיבור מים" value={`${fmt(report.indirectCosts.waterConnection)} ₪`} />
              <Row label="מכירות" value={`${fmt(report.indirectCosts.sales)} ₪`} sub="1%" />
              <Row label="שיווק / פרסום / מיתוג" value={`${fmt(report.indirectCosts.marketing)} ₪`} sub="2%" />
              <Row label="תכנון בדיקות ומדידות" value={`${fmt(report.indirectCosts.planningInspection)} ₪`} sub="2%" />
              <Row label={'משפטיות / שכ"ט עו"ד - מגורים'} value={`${fmt(report.indirectCosts.legalPerUnit)} ₪`} sub={'ליח"ד'} />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ עלויות כלליות'} value={`${fmt(report.indirectCosts.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── C. עמלות ── */}
      <SectionHeader
        letter="C"
        title="עמלות"
        total={report.commissions.total}
        icon={Percent}
        color="#f59e0b"
        isOpen={openSections.has('C')}
        toggle={() => toggle('C')}
      />
      <AnimatePresence>
        {openSections.has('C') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <Row label="ערבות אוטונומית יורדת" value={`${fmt(report.commissions.autonomousGuarantee)} ₪`} sub="1%" />
              <Row label="ערבות לדיירים בעלי קרקע" value={`${fmt(report.commissions.landGuarantee)} ₪`} sub="0.65%" />
              <Row label="בדק ורישום" value={`${fmt(report.commissions.inspectionRegistration)} ₪`} sub="1%" />
              <Row label={'עו"ד תורות'} value={`${fmt(report.commissions.torahAffairs)} ₪`} sub="0.65%" />
              <Row label="עמלת אי הקצאת אשראי" value={`${fmt(report.commissions.creditAllocation)} ₪`} sub="0.20%" />
              <Row label="עמלת פתיחת תיק" value={`${fmt(report.commissions.openingFee)} ₪`} sub="0.20%" />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ עמלות'} value={`${fmt(report.commissions.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── D. עלויות בנייה ישירות ── */}
      <SectionHeader
        letter="D"
        title="עלויות בנייה ישירות"
        total={report.directConstruction.total}
        icon={HardHat}
        color="#22c55e"
        isOpen={openSections.has('D')}
        toggle={() => toggle('D')}
      />
      <AnimatePresence>
        {openSections.has('D') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <div className="flex items-center justify-between py-1 px-3 text-[10px] text-foreground-muted border-b border-foreground/10 mb-1">
                <span>סוג</span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="w-16 text-left">{'שטח'}</span>
                  <span className="w-16 text-left">{'עלות/מ"ר'}</span>
                  <span className="w-20 text-left">{'סה"כ'}</span>
                </div>
              </div>
              <ConstructionRow label="הריסה ופינוי" {...report.directConstruction.demolition} />
              <ConstructionRow label="מרתף" {...report.directConstruction.basement} />
              <ConstructionRow label="מסחרי" {...report.directConstruction.commercial} />
              <ConstructionRow label="תעסוקה" {...report.directConstruction.employment} />
              <ConstructionRow label="ציבורי (גמר מלא)" {...report.directConstruction.publicArea} />
              <ConstructionRow label="מגורים" {...report.directConstruction.residential} />
              <ConstructionRow label="מרפסות תלויות/עג" {...report.directConstruction.balconies} />
              <ConstructionRow label="פיתוח צמוד" {...report.directConstruction.outdoorDev} />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ עלויות בנייה ישירה'} value={`${fmt(report.directConstruction.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── E. Indexed total ── */}
      <div className="mx-3 p-3 glass-card rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center text-[10px] font-bold text-foreground-muted">E</div>
          <span className="text-sm font-medium text-foreground">{'סה"כ הוצאות צמודות (A+B+C+D)'}</span>
        </div>
        <span className="font-mono font-bold text-foreground">{fmt(report.totalIndexedCosts)} {'₪'}</span>
      </div>

      {/* ── F. מימון ── */}
      <SectionHeader
        letter="F"
        title="מימון"
        total={report.financing.total}
        icon={Banknote}
        color="#ef4444"
        isOpen={openSections.has('F')}
        toggle={() => toggle('F')}
      />
      <AnimatePresence>
        {openSections.has('F') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <Row label="משך עד היתר בנייה" value={`${report.financing.monthsToPermit} חודשים`} />
              <Row label="משך בנייה" value={`${report.financing.monthsConstruction} חודשים`} />
              <Row label="ריבית אפקטיבית" value={`${report.financing.effectiveInterest}%`} />
              <Row label="הון עצמי מושקע" value={`${fmt(report.financing.selfEquityAmount)} ₪`} sub={`${report.financing.selfEquityPercent}%`} />
              <Row label="מכירה מוקדמת" value={`${fmt(report.financing.earlySalesAmount)} ₪`} sub={`${report.financing.earlySalesPercent}%`} />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ עלויות מימון'} value={`${fmt(report.financing.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── G. Total with financing ── */}
      <div className="mx-3 p-3 glass-card rounded-xl flex items-center justify-between border border-foreground/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-400">G</div>
          <span className="text-sm font-bold text-foreground">{'סה"כ עלויות כולל מימון'}</span>
        </div>
        <span className="font-mono font-bold text-foreground text-lg">{fmt(report.totalCostWithFinancing)} {'₪'}</span>
      </div>

      {/* ── H. הכנסות ── */}
      <SectionHeader
        letter="H"
        title="אומדן הכנסות"
        total={report.revenue.total}
        icon={TrendingUp}
        color="#10b981"
        isOpen={openSections.has('H')}
        toggle={() => toggle('H')}
      />
      <AnimatePresence>
        {openSections.has('H') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-2 glass-card rounded-lg p-1">
              <div className="flex items-center justify-between py-1 px-3 text-[10px] text-foreground-muted border-b border-foreground/10 mb-1">
                <span>סוג</span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="w-16 text-left">{'שטח'}</span>
                  <span className="w-16 text-left">{'מחיר/מ"ר'}</span>
                  <span className="w-20 text-left">{'סה"כ'}</span>
                </div>
              </div>
              <ConstructionRow label={'מגורים - לא דב"י'} area={report.revenue.residential.area} costPerSqm={report.revenue.residential.pricePerSqm} total={report.revenue.residential.total} />
              <ConstructionRow label={'מגורים - דב"י'} area={report.revenue.residentialAffordable.area} costPerSqm={report.revenue.residentialAffordable.pricePerSqm} total={report.revenue.residentialAffordable.total} />
              <ConstructionRow label="מסחר" area={report.revenue.commercial.area} costPerSqm={report.revenue.commercial.pricePerSqm} total={report.revenue.commercial.total} />
              <ConstructionRow label="תעסוקה" area={report.revenue.employment.area} costPerSqm={report.revenue.employment.pricePerSqm} total={report.revenue.employment.total} />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <Row label={'סה"כ הכנסות'} value={`${fmt(report.revenue.total)} ₪`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Line ── */}
      <motion.div
        className="mx-3 p-4 rounded-xl border-2"
        style={{ background: `${profitColor}08`, borderColor: `${profitColor}40` }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-center mb-3">
          <div className="text-xs text-foreground-muted mb-1">שורה תחתונה</div>
          <div className="text-3xl font-bold" style={{ color: profitColor }}>
            {fmt(report.grossProfit)} {'₪'}
          </div>
          <div className="text-sm text-foreground-muted mt-1">
            {report.profitPercent}% תשואה | {report.newUnits} {'יח"ד'} חדשות | {fmt(report.profitPerUnit)} {'₪ ליח"ד'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

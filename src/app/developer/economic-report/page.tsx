'use client';

import { useState, useMemo, Suspense } from 'react';
import { Building2, Globe, ChevronLeft, BarChart3, Info, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { calcBettermentLevy } from '@/lib/betterment-levy';
import type { ComputeResult } from '@/lib/compute-result';

// ── Helpers ──

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL');
const fmtM = (n: number) => Math.abs(n) >= 1_000_000
  ? (n / 1_000_000).toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' מ׳'
  : fmt(n);
const pct = (n: number) => (n * 100).toFixed(1) + '%';

// ── Defaults ──

interface Inputs {
  // From rights check (Mode A) or manual (Mode B)
  buildableSqm: number;
  units: number;
  existingUnits: number;
  publicShareSqm: number;
  isMetroZone: boolean;
  // User inputs
  landPrice: number;
  salePricePerSqm: number;
  constructionCostPerSqm: number;
  timelineMonths: number;
  // Betterment levy
  valueBeforePerSqm: number | null;
  valueAfterPerSqm: number | null;
}

const DEFAULTS: Inputs = {
  buildableSqm: 0, units: 0, existingUnits: 0, publicShareSqm: 0,
  isMetroZone: false, landPrice: 0, salePricePerSqm: 0,
  constructionCostPerSqm: 8000, timelineMonths: 36,
  valueBeforePerSqm: null, valueAfterPerSqm: null,
};

// ── Cost Constants ──

const DEMOLITION_PER_UNIT = 40_000;
const DEVELOPMENT_PER_SQM = 500;
const CONSULTANT_PCT = 0.15;
const CONTINGENCY_PCT = 0.05;
const FINANCING_RATE_ANNUAL = 0.06;
const MARKETING_PCT = 0.03;
const VAT_RATE = 0.17;

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

export default function EconomicReportPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117', color: '#8b949e' }}>Loading...</div>}>
      <EconomicReportPage />
    </Suspense>
  );
}

function EconomicReportPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;
  const searchParams = useSearchParams();

  const isAutoMode = !!(searchParams.get('city') || searchParams.get('buildableSqm'));

  const [inputs, setInputs] = useState<Inputs>({
    ...DEFAULTS,
    buildableSqm: Number(searchParams.get('buildableSqm')) || 0,
    units: Number(searchParams.get('units')) || 0,
    existingUnits: Number(searchParams.get('existingUnits')) || 0,
    publicShareSqm: Number(searchParams.get('publicShareSqm')) || 0,
    isMetroZone: searchParams.get('metro') === '1',
  });

  const update = (key: keyof Inputs, value: number | boolean | null) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  // ── Computed Economics ──

  const economics = useMemo(() => {
    const { buildableSqm, units, existingUnits, landPrice, salePricePerSqm, constructionCostPerSqm, timelineMonths, publicShareSqm, isMetroZone } = inputs;

    if (buildableSqm <= 0 || units <= 0 || salePricePerSqm <= 0) return null;

    const newUnits = Math.max(0, units - existingUnits);
    const residentialSqm = buildableSqm - publicShareSqm;

    // ── Costs ──
    const costLand = landPrice;
    const costConstruction = newUnits > 0 ? (buildableSqm * constructionCostPerSqm) : 0;
    const costDemolition = existingUnits * DEMOLITION_PER_UNIT;
    const costDevelopment = buildableSqm * DEVELOPMENT_PER_SQM;
    const costConsultants = costConstruction * CONSULTANT_PCT;
    const costContingency = costConstruction * CONTINGENCY_PCT;
    const directCosts = costLand + costConstruction + costDemolition + costDevelopment + costConsultants + costContingency;

    const costFinancing = directCosts * FINANCING_RATE_ANNUAL * (timelineMonths / 12);

    // ── Revenue ──
    const revenueGross = residentialSqm * salePricePerSqm;
    const costMarketing = revenueGross * MARKETING_PCT;

    const totalCosts = directCosts + costFinancing + costMarketing;

    // ── Betterment Levy ──
    const levyResult = calcBettermentLevy({
      valueAfterPerSqm: inputs.valueAfterPerSqm,
      valueBeforePerSqm: inputs.valueBeforePerSqm,
      areaSqm: buildableSqm,
      isMetroZone,
      hasPlanApproval: true,
    });

    const levyAmount = levyResult.status === 'OK' ? levyResult.data.levyAmount : 0;
    const totalWithLevy = totalCosts + levyAmount;

    // ── Profitability ──
    const profit = revenueGross - totalWithLevy;
    const marginPct = revenueGross > 0 ? profit / revenueGross : 0;
    const profitPerSqm = residentialSqm > 0 ? profit / residentialSqm : 0;
    const equityMultiple = costLand > 0 ? revenueGross / costLand : 0;

    return {
      residentialSqm, newUnits,
      costs: { costLand, costConstruction, costDemolition, costDevelopment, costConsultants, costContingency, costFinancing, costMarketing, totalCosts },
      levyResult, levyAmount, totalWithLevy,
      revenue: { revenueGross },
      profitability: { profit, marginPct, profitPerSqm, equityMultiple },
    };
  }, [inputs]);

  return (
    <div className="min-h-screen flex flex-col relative bg-orbs">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">{t('| דוח כלכלי', '| Economic Report')}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/developer/rights-check" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('בדיקת זכויות', 'Rights Check')}
            </a>
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/developer" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ChevronLeft className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <BarChart3 className="w-7 h-7" style={{ color: '#22c55e' }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {t('דוח כלכלי', 'Economic Report')}
            </h1>
            <p className="text-foreground-muted text-xs">
              {isAutoMode ? t('מצב אוטומטי — נתונים מבדיקת זכויות', 'Auto mode — data from rights check') : t('מצב ידני — הזינו את כל הנתונים', 'Manual mode — enter all data')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Inputs ── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('נתוני פרויקט', 'Project Data')}</h3>
                <div className="space-y-3">
                  <InputField label={t('שטח בנוי (מ"ר)', 'Buildable (sqm)')} value={inputs.buildableSqm} onChange={v => update('buildableSqm', v)} />
                  <InputField label={t('יח"ד סה"כ', 'Total Units')} value={inputs.units} onChange={v => update('units', v)} />
                  <InputField label={t('יח"ד קיימות', 'Existing Units')} value={inputs.existingUnits} onChange={v => update('existingUnits', v)} />
                  <InputField label={t('שטח ציבורי (מ"ר)', 'Public (sqm)')} value={inputs.publicShareSqm} onChange={v => update('publicShareSqm', v)} />
                  <CheckField label={t('אזור מטרו', 'Metro Zone')} checked={inputs.isMetroZone} onChange={v => update('isMetroZone', v)} />
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('קלט משתמש', 'User Input')}</h3>
                <div className="space-y-3">
                  <InputField label={t('מחיר קרקע (₪)', 'Land Price (₪)')} value={inputs.landPrice} onChange={v => update('landPrice', v)} />
                  <InputField label={t('מחיר מכירה/מ"ר (₪)', 'Sale Price/sqm (₪)')} value={inputs.salePricePerSqm} onChange={v => update('salePricePerSqm', v)} />
                  <InputField label={t('עלות בנייה/מ"ר (₪)', 'Construction/sqm (₪)')} value={inputs.constructionCostPerSqm} onChange={v => update('constructionCostPerSqm', v)} />
                  <InputField label={t('לו"ז (חודשים)', 'Timeline (months)')} value={inputs.timelineMonths} onChange={v => update('timelineMonths', v)} />
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('היטל השבחה', 'Betterment Levy')}</h3>
                <div className="space-y-3">
                  <InputField label={t('שווי לפני (₪/מ"ר)', 'Value Before (₪/sqm)')} value={inputs.valueBeforePerSqm ?? ''} onChange={v => update('valueBeforePerSqm', v || null)} placeholder={t('אופציונלי', 'Optional')} />
                  <InputField label={t('שווי אחרי (₪/מ"ר)', 'Value After (₪/sqm)')} value={inputs.valueAfterPerSqm ?? ''} onChange={v => update('valueAfterPerSqm', v || null)} placeholder={t('אופציונלי', 'Optional')} />
                  <div className="text-[10px] text-foreground-muted flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {t('אם לא ידוע — יוצג כ"הערכה בלבד"', 'If unknown — shown as "Estimate Only"')}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Results ── */}
            <div className="lg:col-span-2 space-y-4">
              {!economics && (
                <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-foreground-muted text-sm">
                    {t('הזינו שטח בנוי, יח"ד ומחיר מכירה להצגת תוצאות', 'Enter buildable area, units and sale price to see results')}
                  </p>
                </div>
              )}

              {economics && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryCard label={t('יח"ד חדשות', 'New Units')} value={fmt(economics.newUnits)} />
                    <SummaryCard label={t('שטח למכירה', 'Sellable sqm')} value={`${fmt(economics.residentialSqm)} מ"ר`} />
                    <SummaryCard label={t('הכנסות', 'Revenue')} value={`₪${fmtM(economics.revenue.revenueGross)}`} color="#22c55e" />
                    <SummaryCard label={t('רווח', 'Profit')} value={`₪${fmtM(economics.profitability.profit)}`} color={economics.profitability.profit >= 0 ? '#22c55e' : '#f85149'} />
                  </div>

                  {/* Cost Breakdown */}
                  <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wide">{t('פירוט עלויות', 'Cost Breakdown')}</h3>
                    <div className="space-y-2 text-sm">
                      <CostLine label={t('קרקע', 'Land')} value={economics.costs.costLand} />
                      <CostLine label={t(`בנייה (${fmt(economics.newUnits)} יח"ד חדשות)`, `Construction (${fmt(economics.newUnits)} new units)`)} value={economics.costs.costConstruction} />
                      <CostLine label={t(`הריסה (₪${fmt(DEMOLITION_PER_UNIT)}/יח"ד)`, `Demolition (₪${fmt(DEMOLITION_PER_UNIT)}/unit)`)} value={economics.costs.costDemolition} />
                      <CostLine label={t('פיתוח', 'Development')} value={economics.costs.costDevelopment} />
                      <CostLine label={t('יועצים (15%)', 'Consultants (15%)')} value={economics.costs.costConsultants} />
                      <CostLine label={t('בלת"מ (5%)', 'Contingency (5%)')} value={economics.costs.costContingency} />
                      <CostLine label={t('מימון', 'Financing')} value={economics.costs.costFinancing} />
                      <CostLine label={t('שיווק (3%)', 'Marketing (3%)')} value={economics.costs.costMarketing} />
                      <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold">
                        <span className="text-foreground">{t('סה"כ עלויות', 'Total Costs')}</span>
                        <span className="text-foreground">₪{fmtM(economics.costs.totalCosts)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Betterment Levy */}
                  <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('היטל השבחה', 'Betterment Levy')}</h3>
                    <BettermentLevyDisplay result={economics.levyResult} t={t} />
                  </div>

                  {/* Revenue */}
                  <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('הכנסות', 'Revenue')}</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">{t(`מכירה: ${fmt(economics.residentialSqm)} מ"ר × ₪${fmt(inputs.salePricePerSqm)}`, `Sale: ${fmt(economics.residentialSqm)} sqm × ₪${fmt(inputs.salePricePerSqm)}`)}</span>
                        <span className="text-foreground font-medium">₪{fmtM(economics.revenue.revenueGross)}</span>
                      </div>
                      <div className="text-[10px] text-foreground-muted flex items-start gap-1.5">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {t('מקור מחיר מכירה: קלט משתמש', 'Sale price source: user input')}
                      </div>
                    </div>
                  </div>

                  {/* Profitability */}
                  <div className="rounded-xl p-5" style={{
                    background: economics.profitability.profit >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(248,81,73,0.06)',
                    border: `1px solid ${economics.profitability.profit >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(248,81,73,0.15)'}`,
                  }}>
                    <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">{t('רווחיות', 'Profitability')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold" style={{ color: economics.profitability.profit >= 0 ? '#22c55e' : '#f85149' }}>
                          {pct(economics.profitability.marginPct)}
                        </div>
                        <div className="text-[10px] text-foreground-muted">{t('מרווח', 'Margin')}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">₪{fmt(economics.profitability.profitPerSqm)}</div>
                        <div className="text-[10px] text-foreground-muted">{t('רווח/מ"ר', 'Profit/sqm')}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{economics.profitability.equityMultiple.toFixed(2)}x</div>
                        <div className="text-[10px] text-foreground-muted">{t('מכפיל הון', 'Equity Multiple')}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: economics.profitability.profit >= 0 ? '#22c55e' : '#f85149' }}>
                          ₪{fmtM(economics.profitability.profit)}
                        </div>
                        <div className="text-[10px] text-foreground-muted">{t('רווח נקי', 'Net Profit')}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function InputField({ label, value, onChange, placeholder }: { label: string; value: number | string | null; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] text-foreground-muted mb-1">{label}</label>
      <input
        type="number"
        value={value === null ? '' : value || ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 rounded-lg text-sm outline-none transition-colors"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e6edf3' }}
      />
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-xs cursor-pointer bg-transparent border-0" style={{ color: checked ? '#5b8dee' : 'var(--fg-dim)' }}>
      <div className="w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px]" style={{
        background: checked ? 'rgba(91,141,238,0.2)' : 'transparent',
        borderColor: checked ? '#5b8dee' : 'rgba(255,255,255,0.2)',
      }}>
        {checked && '✓'}
      </div>
      {label}
    </button>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-base font-bold" style={{ color: color || '#e6edf3' }}>{value}</div>
      <div className="text-[10px] text-foreground-muted mt-0.5">{label}</div>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-foreground">{value > 0 ? `₪${fmtM(value)}` : '—'}</span>
    </div>
  );
}

function BettermentLevyDisplay({ result, t }: { result: ComputeResult<{ levyAmount: number; levyRate: number; levyRateLabel: string }>; t: (he: string, en: string) => string }) {
  if (result.status === 'ESTIMATE_ONLY') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(210,153,34,0.15)', color: '#d29922' }}>
            {t('הערכה בלבד', 'Estimate Only')}
          </span>
          <span className="text-xs text-foreground-muted">{result.data.levyRateLabel}</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-foreground-muted p-3 rounded-lg" style={{ background: 'rgba(210,153,34,0.06)' }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#d29922' }} />
          <span>{result.note}</span>
        </div>
      </div>
    );
  }

  if (result.status === 'OK') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">{result.data.levyRateLabel}</span>
          <span className="text-foreground font-medium">₪{fmtM(result.data.levyAmount)}</span>
        </div>
        {result.warnings.length > 0 && (
          <div className="flex items-start gap-2 text-[10px] text-foreground-muted">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{result.warnings[0]}</span>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-xs text-foreground-muted">{t('אין נתונים', 'No data')}</div>;
}

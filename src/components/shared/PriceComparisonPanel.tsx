'use client';

import { useMemo } from 'react';
import { TrendingUp, Building2, DollarSign, AlertTriangle, Check, BarChart3 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Types ────────────────────────────────────────────────────

export interface RightsAlternative {
  name: string;
  nameEn: string;
  residentialSqm: number;
  publicBuiltSqm: number;
  serviceSqm: number;
  totalSqm: number;
  estimatedUnits: number | null;
  notesHe: string;
  notesEn: string;
  blocked: boolean;
  blockReasonHe?: string;
  blockReasonEn?: string;
}

export type PriceMode = 'developer' | 'urban-renewal' | 'transaction';

interface Props {
  alternatives: RightsAlternative[];
  pricePerSqm: number;
  landValue?: number;
  mode: PriceMode;
  constructionCostPerSqm?: number;
  bettermentLevyPct?: number;
}

// ── Constants ────────────────────────────────────────────────

const DEFAULT_CONSTRUCTION_COST = 12000; // ₪/sqm
const DEFAULT_BETTERMENT_LEVY_PCT = 50;  // standard 50%, metro 60%

// ── Helpers ──────────────────────────────────────────────────

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

function fmtPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `₪${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `₪${Math.round(n / 1_000)}K`;
  }
  return `₪${fmtNum(n)}`;
}

// ── Analysis per alternative ─────────────────────────────────

interface AlternativeAnalysis {
  alt: RightsAlternative;
  grossRevenue: number;
  constructionCost: number;
  bettermentLevy: number;
  totalCost: number;
  netProfit: number;
  yieldPct: number;
  profitPerUnit: number;
  isBestValue: boolean;
}

// ── Component ────────────────────────────────────────────────

export default function PriceComparisonPanel({
  alternatives,
  pricePerSqm,
  landValue = 0,
  mode,
  constructionCostPerSqm = DEFAULT_CONSTRUCTION_COST,
  bettermentLevyPct = DEFAULT_BETTERMENT_LEVY_PCT,
}: Props) {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const analyses = useMemo((): AlternativeAnalysis[] => {
    const activeAlts = alternatives.filter(a => !a.blocked && a.totalSqm > 0);
    if (activeAlts.length === 0 || pricePerSqm <= 0) return [];

    const results = activeAlts.map(alt => {
      const grossRevenue = alt.residentialSqm * pricePerSqm;
      const constructionCost = alt.totalSqm * constructionCostPerSqm;
      const addedValue = grossRevenue - landValue;
      const bettermentLevy = Math.max(0, addedValue * (bettermentLevyPct / 100));
      const totalCost = constructionCost + bettermentLevy + landValue;
      const netProfit = grossRevenue - totalCost;
      const yieldPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
      const profitPerUnit = alt.estimatedUnits && alt.estimatedUnits > 0
        ? netProfit / alt.estimatedUnits : 0;

      return {
        alt,
        grossRevenue,
        constructionCost,
        bettermentLevy,
        totalCost,
        netProfit,
        yieldPct,
        profitPerUnit,
        isBestValue: false,
      };
    });

    // Mark best value (highest net profit)
    if (results.length > 0) {
      const bestIdx = results.reduce((best, curr, idx) =>
        curr.netProfit > results[best].netProfit ? idx : best, 0);
      results[bestIdx].isBestValue = true;
    }

    return results;
  }, [alternatives, pricePerSqm, landValue, constructionCostPerSqm, bettermentLevyPct]);

  if (analyses.length === 0) return null;

  const modeLabel = {
    developer: t('ניתוח יזם', 'Developer Analysis'),
    'urban-renewal': t('ניתוח התחדשות', 'Renewal Analysis'),
    transaction: t('ניתוח עסקה', 'Transaction Analysis'),
  }[mode];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
            {t('השוואת כדאיות כלכלית', 'Economic Comparison')}
          </h3>
          <p className="text-[10px]" style={{ color: '#6b7280' }}>
            {modeLabel} | {fmtNum(pricePerSqm)} ₪/{t('מ"ר', 'sqm')} | {t('עלות בנייה', 'Construction')} {fmtNum(constructionCostPerSqm)} ₪/{t('מ"ר', 'sqm')}
          </p>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className={`grid gap-4 ${analyses.length === 1 ? 'grid-cols-1' : analyses.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {analyses.map((a, i) => (
          <div
            key={i}
            className="relative rounded-xl p-5 overflow-hidden"
            style={{
              background: a.isBestValue ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${a.isBestValue ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            {/* Best value badge */}
            {a.isBestValue && (
              <>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #16a34a, transparent)' }} />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                    <Check className="w-2.5 h-2.5" />
                    {t('כדאי ביותר', 'BEST VALUE')}
                  </span>
                </div>
              </>
            )}

            {/* Alternative name */}
            <h4 className="text-sm font-bold mt-1 mb-3" style={{ color: '#1a1a2e' }}>
              {t(a.alt.name, a.alt.nameEn)}
            </h4>

            {/* Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                  <DollarSign className="w-3 h-3" />
                  {t('הכנסות ברוטו', 'Gross Revenue')}
                </span>
                <span className="font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#16a34a' }}>
                  {fmtCurrency(a.grossRevenue)}
                </span>
              </div>

              {/* Construction cost */}
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                  <Building2 className="w-3 h-3" />
                  {t('עלות בנייה', 'Construction Cost')}
                </span>
                <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#ef4444' }}>
                  -{fmtCurrency(a.constructionCost)}
                </span>
              </div>

              {/* Betterment levy */}
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                  <AlertTriangle className="w-3 h-3" />
                  {t(`היטל השבחה (${bettermentLevyPct}%)`, `Betterment Levy (${bettermentLevyPct}%)`)}
                </span>
                <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#d97706' }}>
                  -{fmtCurrency(a.bettermentLevy)}
                </span>
              </div>

              {/* Land value (if provided) */}
              {landValue > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: '#6b7280' }}>{t('שווי קרקע', 'Land Value')}</span>
                  <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#9ca3af' }}>
                    -{fmtCurrency(landValue)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

              {/* Net profit */}
              <div className="flex justify-between text-[12px]">
                <span className="font-bold" style={{ color: a.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {t('רווח נקי', 'Net Profit')}
                </span>
                <span className="font-black text-lg" style={{
                  fontFamily: "'Space Grotesk', monospace",
                  color: a.netProfit >= 0 ? '#16a34a' : '#dc2626',
                }}>
                  {a.netProfit >= 0 ? '' : '-'}{fmtCurrency(Math.abs(a.netProfit))}
                </span>
              </div>

              {/* Yield */}
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                  <BarChart3 className="w-3 h-3" />
                  {t('תשואה', 'Yield')}
                </span>
                <span className="font-bold" style={{
                  fontFamily: "'Space Grotesk', monospace",
                  color: a.yieldPct >= 15 ? '#16a34a' : a.yieldPct >= 0 ? '#d97706' : '#dc2626',
                }}>
                  {fmtPct(a.yieldPct)}
                </span>
              </div>

              {/* Profit per unit */}
              {a.profitPerUnit > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: '#6b7280' }}>{t('רווח ליחידה', 'Profit/Unit')}</span>
                  <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                    {fmtCurrency(a.profitPerUnit)}
                  </span>
                </div>
              )}
            </div>

            {/* Area breakdown (small text) */}
            <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                {fmtNum(a.alt.residentialSqm)} {t('מ"ר מגורים', 'sqm residential')}
                {a.alt.publicBuiltSqm > 0 && ` + ${fmtNum(a.alt.publicBuiltSqm)} ${t('ציבורי', 'public')}`}
                {a.alt.estimatedUnits && ` | ~${fmtNum(a.alt.estimatedUnits)} ${t('יחידות', 'units')}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary comparison bar */}
      {analyses.length > 1 && (
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px]">
            {analyses.map((a, i) => {
              const barWidth = Math.max(10, Math.min(100,
                (a.netProfit / Math.max(...analyses.map(x => Math.abs(x.netProfit)))) * 100
              ));
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#4a4a6a' }}>
                    {t(a.alt.name, a.alt.nameEn).substring(0, 15)}
                  </span>
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.abs(barWidth)}%`,
                        background: a.netProfit >= 0
                          ? a.isBestValue ? '#16a34a' : '#86efac'
                          : '#fca5a5',
                      }}
                    />
                  </div>
                  <span className="font-bold" style={{
                    fontFamily: "'Space Grotesk', monospace",
                    color: a.netProfit >= 0 ? '#16a34a' : '#dc2626',
                  }}>
                    {fmtPct(a.yieldPct)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

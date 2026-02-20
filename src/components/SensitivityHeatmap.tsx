'use client';

import { useMemo, useState } from 'react';
import { Grid3x3, Info } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface SensitivityHeatmapProps {
  baseRevenue: number;
  baseExpenses: number;
  baseProfitMargin: number;
  baseRoi: number;
  lang: 'he' | 'en';
}

// ── Constants ────────────────────────────────────────────────

const PURPLE = '#a78bfa';

const COST_DELTAS = [-0.10, -0.05, 0, 0.05, 0.10, 0.15];
const PRICE_DELTAS = [0.15, 0.10, 0.05, 0, -0.05, -0.10];

function fmtPctLabel(delta: number): string {
  if (delta === 0) return '0%';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta * 100)}%`;
}

function fmtMargin(margin: number): string {
  return margin.toFixed(1) + '%';
}

// ── Color logic ──────────────────────────────────────────────

function getMarginColor(margin: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (margin < 0) {
    return { bg: '#991b1b', text: '#ffffff', border: '#7f1d1d' };       // deep red (loss)
  }
  if (margin < 5) {
    return { bg: '#dc2626', text: '#ffffff', border: '#b91c1c' };       // red
  }
  if (margin < 10) {
    return { bg: '#f97316', text: '#ffffff', border: '#ea580c' };       // orange
  }
  if (margin < 15) {
    return { bg: '#eab308', text: '#1a1a2e', border: '#ca8a04' };       // yellow/gold
  }
  if (margin < 20) {
    return { bg: '#84cc16', text: '#1a1a2e', border: '#65a30d' };       // light green
  }
  return { bg: '#16a34a', text: '#ffffff', border: '#15803d' };          // deep green
}

// ── Component ────────────────────────────────────────────────

export default function SensitivityHeatmap({
  baseRevenue,
  baseExpenses,
  baseProfitMargin,
  baseRoi,
  lang,
}: SensitivityHeatmapProps) {
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const isRtl = lang === 'he';

  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // ── Build the heatmap matrix ─────────────────────────────

  const matrix = useMemo(() => {
    return PRICE_DELTAS.map((priceDelta) => {
      return COST_DELTAS.map((costDelta) => {
        const adjustedRevenue = baseRevenue * (1 + priceDelta);
        const adjustedExpenses = baseExpenses * (1 + costDelta);
        const profit = adjustedRevenue - adjustedExpenses;
        const margin =
          adjustedRevenue > 0 ? (profit / adjustedRevenue) * 100 : 0;
        return {
          margin,
          priceDelta,
          costDelta,
          adjustedRevenue,
          adjustedExpenses,
          profit,
        };
      });
    });
  }, [baseRevenue, baseExpenses]);

  // ── Tooltip content ──────────────────────────────────────

  const renderTooltip = (cell: (typeof matrix)[0][0]) => {
    const fmtMoney = (n: number) => {
      if (Math.abs(n) >= 1_000_000) {
        return (
          (n / 1_000_000).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }) + (lang === 'he' ? " מ'" : 'M')
        );
      }
      return Math.round(n).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
    };

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#1a1a2e',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 11,
          lineHeight: 1.6,
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4, color: PURPLE }}>
          {t('תרחיש', 'Scenario')}
        </div>
        <div>
          {t('שינוי מחיר מכירה:', 'Sale price change:')}{' '}
          <strong>{fmtPctLabel(cell.priceDelta)}</strong>
        </div>
        <div>
          {t('שינוי עלות בנייה:', 'Construction cost change:')}{' '}
          <strong>{fmtPctLabel(cell.costDelta)}</strong>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 4, paddingTop: 4 }}>
          {t('הכנסות:', 'Revenue:')}{' '}
          <strong>
            {lang === 'he' ? '₪' : ''}
            {fmtMoney(cell.adjustedRevenue)}
            {lang !== 'he' ? ' ILS' : ''}
          </strong>
        </div>
        <div>
          {t('הוצאות:', 'Expenses:')}{' '}
          <strong>
            {lang === 'he' ? '₪' : ''}
            {fmtMoney(cell.adjustedExpenses)}
            {lang !== 'he' ? ' ILS' : ''}
          </strong>
        </div>
        <div>
          {t('רווח:', 'Profit:')}{' '}
          <strong style={{ color: cell.profit >= 0 ? '#4ade80' : '#f87171' }}>
            {lang === 'he' ? '₪' : ''}
            {fmtMoney(cell.profit)}
            {lang !== 'he' ? ' ILS' : ''}
          </strong>
        </div>
        <div style={{ fontWeight: 700, marginTop: 2 }}>
          {t('שיעור רווח:', 'Profit margin:')}{' '}
          <span
            style={{
              color: cell.margin >= 15 ? '#4ade80' : cell.margin >= 5 ? '#fbbf24' : '#f87171',
            }}
          >
            {fmtMargin(cell.margin)}
          </span>
        </div>
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1a1a2e',
          }}
        />
      </div>
    );
  };

  // ── Legend ────────────────────────────────────────────────

  const legendItems = [
    { label: t('הפסד (< 0%)', 'Loss (< 0%)'), color: '#991b1b' },
    { label: '< 5%', color: '#dc2626' },
    { label: '5-10%', color: '#f97316' },
    { label: '10-15%', color: '#eab308' },
    { label: '15-20%', color: '#84cc16' },
    { label: t('>= 20%', '>= 20%'), color: '#16a34a' },
  ];

  // ── Render ───────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#1a1a2e',
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${PURPLE}15`,
              border: `1px solid ${PURPLE}25`,
            }}
          >
            <Grid3x3 className="w-4 h-4" style={{ color: PURPLE }} />
          </div>
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: '#1a1a2e' }}
            >
              {t('ניתוח רגישות — מפת חום', 'Sensitivity Analysis — Heatmap')}
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
              {t(
                'שיעור רווח (%) בתלות בשינויי מחיר מכירה ועלות בנייה',
                'Profit margin (%) based on sale price and construction cost changes'
              )}
            </p>
          </div>
        </div>

        {/* Baseline info */}
        <div
          className="flex items-start gap-2 p-2.5 rounded-lg mt-3"
          style={{
            background: `${PURPLE}08`,
            border: `1px solid ${PURPLE}12`,
          }}
        >
          <Info
            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
            style={{ color: PURPLE }}
          />
          <p
            className="text-[10px] leading-relaxed"
            style={{ color: '#6b7280' }}
          >
            {t(
              `קו בסיס: שיעור רווח ${baseProfitMargin.toFixed(1)}% | תשואה ${baseRoi.toFixed(1)}%. התא המודגש (0%, 0%) מייצג את התרחיש הנוכחי. העבר עכבר מעל תא לפרטים.`,
              `Baseline: profit margin ${baseProfitMargin.toFixed(1)}% | ROI ${baseRoi.toFixed(1)}%. The highlighted cell (0%, 0%) represents the current scenario. Hover over a cell for details.`
            )}
          </p>
        </div>
      </div>

      {/* ── Heatmap Table ── */}
      <div className="px-6 pb-4">
        <div
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table
            style={{
              borderCollapse: 'separate',
              borderSpacing: 3,
              width: '100%',
              minWidth: 520,
            }}
          >
            <thead>
              {/* Top-level axis label row */}
              <tr>
                <th
                  style={{
                    padding: '4px 6px',
                    fontSize: 9,
                    fontWeight: 400,
                    color: '#9ca3af',
                    textAlign: 'center',
                    verticalAlign: 'bottom',
                  }}
                />
                <th
                  colSpan={COST_DELTAS.length}
                  style={{
                    padding: '4px 0 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: PURPLE,
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t('שינוי עלות בנייה →', 'Construction Cost Change →')}
                </th>
              </tr>
              {/* Column headers (cost deltas) */}
              <tr>
                <th
                  style={{
                    padding: '6px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: PURPLE,
                    textAlign: isRtl ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'bottom',
                    writingMode: 'initial',
                  }}
                >
                  <span style={{ display: 'block', marginBottom: 2 }}>
                    {t('↓ שינוי מחיר מכירה', '↓ Sale Price Change')}
                  </span>
                </th>
                {COST_DELTAS.map((delta) => (
                  <th
                    key={delta}
                    style={{
                      padding: '6px 4px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#1a1a2e',
                      textAlign: 'center',
                      fontFamily: "'Space Grotesk', monospace",
                      whiteSpace: 'nowrap',
                      background:
                        delta === 0 ? `${PURPLE}10` : 'transparent',
                      borderRadius: 6,
                    }}
                  >
                    {fmtPctLabel(delta)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {/* Row header (price delta) */}
                  <td
                    style={{
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#1a1a2e',
                      textAlign: 'center',
                      fontFamily: "'Space Grotesk', monospace",
                      whiteSpace: 'nowrap',
                      background:
                        row[0].priceDelta === 0
                          ? `${PURPLE}10`
                          : 'transparent',
                      borderRadius: 6,
                    }}
                  >
                    {fmtPctLabel(row[0].priceDelta)}
                  </td>

                  {/* Data cells */}
                  {row.map((cell, colIdx) => {
                    const colors = getMarginColor(cell.margin);
                    const isBaseline =
                      cell.priceDelta === 0 && cell.costDelta === 0;
                    const isHovered =
                      hoveredCell?.row === rowIdx &&
                      hoveredCell?.col === colIdx;

                    return (
                      <td
                        key={colIdx}
                        style={{
                          position: 'relative',
                          padding: '10px 6px',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: isBaseline ? 800 : 600,
                          fontFamily: "'Space Grotesk', monospace",
                          color: colors.text,
                          background: colors.bg,
                          borderRadius: 8,
                          border: isBaseline
                            ? `3px solid ${PURPLE}`
                            : '1px solid transparent',
                          boxShadow: isBaseline
                            ? `0 0 0 2px rgba(167,139,250,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)`
                            : isHovered
                              ? '0 4px 12px rgba(0,0,0,0.15)'
                              : 'none',
                          cursor: 'default',
                          transition:
                            'box-shadow 0.15s ease, transform 0.15s ease',
                          transform: isHovered
                            ? 'scale(1.08)'
                            : 'scale(1)',
                          zIndex: isHovered ? 10 : 1,
                          minWidth: 58,
                        }}
                        onMouseEnter={() =>
                          setHoveredCell({ row: rowIdx, col: colIdx })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {fmtMargin(cell.margin)}
                        {isBaseline && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -2,
                              left: isRtl ? 'auto' : -2,
                              right: isRtl ? -2 : 'auto',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: PURPLE,
                              border: '2px solid #ffffff',
                            }}
                          />
                        )}
                        {isHovered && renderTooltip(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ── */}
      <div
        className="px-6 pb-5"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="pt-4">
          <div
            className="text-[10px] font-bold mb-2"
            style={{ color: '#6b7280' }}
          >
            {t('מקרא שיעור רווח', 'Profit Margin Legend')}
          </div>
          <div className="flex flex-wrap gap-2">
            {legendItems.map((item) => (
              <div
                key={item.color}
                className="flex items-center gap-1.5"
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: item.color,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <span
                  className="text-[10px]"
                  style={{ color: '#6b7280' }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Baseline indicator note */}
        <div className="flex items-center gap-2 mt-3">
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: `3px solid ${PURPLE}`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: PURPLE,
                border: '1.5px solid #ffffff',
              }}
            />
          </div>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            {t('= תרחיש נוכחי (קו בסיס)', '= Current scenario (baseline)')}
          </span>
        </div>
      </div>
    </div>
  );
}

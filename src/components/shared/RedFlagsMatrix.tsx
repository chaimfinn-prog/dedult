'use client';

import { XCircle, AlertTriangle, Info } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Types ────────────────────────────────────────────────────

export type RedFlagSeverity = 'hard_block' | 'strong_risk' | 'attention';

export interface RedFlag {
  code: string;
  severity: RedFlagSeverity;
  messageHe: string;
  messageEn: string;
  source: string;
}

interface Props {
  flags: RedFlag[];
}

// ── Severity styles ─────────────────────────────────────────

function getSeverityStyle(severity: RedFlagSeverity) {
  switch (severity) {
    case 'hard_block':
      return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#dc2626', Icon: XCircle };
    case 'strong_risk':
      return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#d97706', Icon: AlertTriangle };
    case 'attention':
      return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#2563eb', Icon: Info };
  }
}

function getSeverityLabel(severity: RedFlagSeverity, he: boolean): string {
  switch (severity) {
    case 'hard_block': return he ? 'חסימה מוחלטת' : 'Hard Block';
    case 'strong_risk': return he ? 'סיכון חמור' : 'Strong Risk';
    case 'attention': return he ? 'דגש תשומת לב' : 'Attention';
  }
}

// ── Component ────────────────────────────────────────────────

export default function RedFlagsMatrix({ flags }: Props) {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  if (flags.length === 0) return null;

  const hardBlocks = flags.filter(f => f.severity === 'hard_block').length;
  const strongRisks = flags.filter(f => f.severity === 'strong_risk').length;
  const attentions = flags.filter(f => f.severity === 'attention').length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs font-bold" style={{ color: '#4a4a6a' }}>
          {t('סה"כ דגלים:', 'Total flags:')} {flags.length}
        </span>
        {hardBlocks > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
            <XCircle className="w-3 h-3" /> {hardBlocks} {t('בלוקים קשים', 'hard blocks')}
          </span>
        )}
        {strongRisks > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
            <AlertTriangle className="w-3 h-3" /> {strongRisks} {t('סיכונים', 'risks')}
          </span>
        )}
        {attentions > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>
            <Info className="w-3 h-3" /> {attentions} {t('תשומות לב', 'attention items')}
          </span>
        )}
      </div>

      {/* Flag list */}
      <div className="space-y-2">
        {flags.map((flag, i) => {
          const style = getSeverityStyle(flag.severity);
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3.5 rounded-lg"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <style.Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: style.text }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${style.text}15`, color: style.text }}>
                    {getSeverityLabel(flag.severity, isHe)}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: '#9ca3af' }}>
                    {flag.code}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#4a4a6a' }}>
                  {isHe ? flag.messageHe : flag.messageEn}
                </p>
                <span className="text-[9px]" style={{ color: '#9ca3af' }}>
                  {t('מקור: ', 'Source: ')}{flag.source}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Severity summary boxes */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(['hard_block', 'strong_risk', 'attention'] as RedFlagSeverity[]).map(sev => {
          const count = flags.filter(f => f.severity === sev).length;
          const s = getSeverityStyle(sev);
          return (
            <div key={sev} className="text-center p-2.5 rounded-lg"
              style={{
                background: count > 0 ? s.bg : 'rgba(0,0,0,0.02)',
                border: `1px solid ${count > 0 ? s.border : 'rgba(0,0,0,0.04)'}`,
              }}>
              <div className="text-xl font-black"
                style={{ fontFamily: "'Space Grotesk', monospace", color: count > 0 ? s.text : '#d1d5db' }}>
                {count}
              </div>
              <div className="text-[9px] font-semibold" style={{ color: count > 0 ? s.text : '#9ca3af' }}>
                {getSeverityLabel(sev, isHe)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

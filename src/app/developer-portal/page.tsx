'use client';

import {
  Building2, ArrowRight, Globe, Ruler, Calculator,
  ChevronLeft, HardHat, ExternalLink, BarChart3, FileDown,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

export default function DeveloperPortalPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);

  return (
    <div className="min-h-screen flex flex-col relative bg-orbs">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-cinematic bg-cover bg-center"
          style={{ backgroundImage: `url('${FALLBACK_IMG}')` }}
        />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* ── Header ── */}
      <div
        className="relative z-10 border-b border-[var(--border)] sticky top-0"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">
              {t('| פורטל יזמים', '| Developer Portal')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : '\u05E2\u05D1'}
            </button>
            <a
              href="/"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('\u05D7\u05D6\u05E8\u05D4', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">

        {/* ── Hero Section ── */}
        <div className="text-center mb-14">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              boxShadow: '0 8px 32px rgba(167,139,250,0.3)',
            }}
          >
            <HardHat className="w-9 h-9 text-white" />
          </div>
          <div
            className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: '#a78bfa' }}
          >
            PROPCHECK
          </div>
          <div className="w-24 h-0.5 mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed, #39C5CF)' }} />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-gradient-animate">
            {t('\u05E4\u05D5\u05E8\u05D8\u05DC \u05D9\u05D6\u05DE\u05D9\u05DD', 'Developer Portal')}
          </h1>
          <p className="text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              '\u05DB\u05DC\u05D9\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D9\u05DD \u05DC\u05D9\u05D6\u05DE\u05D9\u05DD, \u05D0\u05D3\u05E8\u05D9\u05DB\u05DC\u05D9\u05DD \u05D5\u05E9\u05DE\u05D0\u05D9\u05DD',
              'Professional Tools for Developers, Architects & Appraisers'
            )}
          </p>
        </div>

        {/* ── Service Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

          {/* Card 1 — Building Rights Assessment */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#1a1a2e',
            }}
          >
            <div className="p-6 sm:p-8">
              {/* Icon + Badge row */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(167,139,250,0.12)',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  <Ruler className="w-7 h-7" style={{ color: '#a78bfa' }} />
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(167,139,250,0.1)',
                    color: '#7c3aed',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  Ra/Ra/B — {t('\u05E8\u05E2\u05E0\u05E0\u05D4', '\u05E8\u05E2\u05E0\u05E0\u05D4')}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t(
                  '\u05D1\u05D3\u05D9\u05E7\u05EA \u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05D1\u05E0\u05D9\u05D9\u05D4',
                  'Building Rights Assessment'
                )}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a4a6a' }}>
                {t(
                  '\u05D7\u05D9\u05E9\u05D5\u05D1 \u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05D1\u05E0\u05D9\u05D9\u05D4 \u05DE\u05D3\u05D5\u05D9\u05E7 \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05EA\u05D1"\u05E2, \u05DB\u05D5\u05DC\u05DC \u05D1\u05D5\u05E0\u05D5\u05E1\u05D9\u05DD, \u05E0\u05D9\u05DB\u05D5\u05D9\u05D9\u05DD \u05D5\u05EA\u05DE\u05D4\u05D9\u05DC \u05D3\u05D9\u05E8\u05D5\u05EA',
                  'Precise building rights calculation based on zoning plans, including bonuses, deductions & apartment mix'
                )}
              </p>

              {/* CTA Button */}
              <a
                href="/developer-portal/rights-calculator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 16px rgba(167,139,250,0.35)',
                }}
              >
                {t('\u05D4\u05EA\u05D7\u05DC \u05D7\u05D9\u05E9\u05D5\u05D1', 'Start Calculation')}
                <ChevronLeft className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2 — Economic Feasibility */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#1a1a2e',
            }}
          >
            <div className="p-6 sm:p-8">
              {/* Icon + Badge row */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(167,139,250,0.12)',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  <Calculator className="w-7 h-7" style={{ color: '#a78bfa' }} />
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(167,139,250,0.1)',
                    color: '#7c3aed',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  {t('תמ"א 38/2', 'TMA 38/2')}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t('בדיקת כדאיות כלכלית', 'Economic Feasibility Check')}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a4a6a' }}>
                {t(
                  'ניתוח כלכלי מקיף לפרויקט התחדשות — הכנסות, עלויות בנייה, מיסים, היטלים ורווחיות צפויה. כל ההנחות ניתנות לעריכה.',
                  'Comprehensive economic analysis for renewal projects — revenue, construction costs, taxes, levies & profitability. All assumptions editable.'
                )}
              </p>

              {/* CTA Button */}
              <a
                href="/developer-portal/economic-feasibility"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 16px rgba(167,139,250,0.35)',
                  textDecoration: 'none',
                }}
              >
                {t('חשב זכויות → כדאיות', 'Calculate Rights → Feasibility')}
                <ChevronLeft className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 3 — Pro Analysis & Export */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#1a1a2e',
            }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(167,139,250,0.12)',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  <BarChart3 className="w-7 h-7" style={{ color: '#a78bfa' }} />
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(63,185,80,0.1)',
                    color: '#16a34a',
                    border: '1px solid rgba(63,185,80,0.25)',
                  }}
                >
                  PRO
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t('ניתוח רגישות וייצוא', 'Sensitivity & Export')}
              </h3>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a4a6a' }}>
                {t(
                  'מפת חום דינמית לבדיקת רגישות רווחיות. ייצוא דוחות מקצועיים ב-PDF ו-Excel עם נוסחאות פתוחות.',
                  'Dynamic heatmap for profitability sensitivity. Export professional reports as PDF & Excel with open formulas.'
                )}
              </p>

              <div className="flex gap-2">
                <a
                  href="/developer-portal/economic-feasibility"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 16px rgba(167,139,250,0.35)',
                    textDecoration: 'none',
                  }}
                >
                  <FileDown className="w-4 h-4" />
                  {t('התחל', 'Start')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABA Information Section ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#1a1a2e',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
              }}
            >
              <ExternalLink className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t('\u05DE\u05D9\u05D3\u05E2 \u05E2\u05DC \u05D4\u05EA\u05D1"\u05E2', 'About the Zoning Plan')}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4a4a6a' }}>
                {t(
                  '\u05DE\u05D1\u05D5\u05E1\u05E1 \u05E2\u05DC \u05EA\u05D1"\u05E2 416-1060052 \u2014 \u05EA\u05DB\u05E0\u05D9\u05EA \u05DC\u05D4\u05EA\u05D7\u05D3\u05E9\u05D5\u05EA \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05EA \u05E8\u05E2\u05E0\u05E0\u05D4 (\u05D0\u05D5\u05E9\u05E8\u05D4 25.02.2025)',
                  'Based on zoning plan 416-1060052 \u2014 Urban Renewal Plan for Ra\'anana (approved 25.02.2025)'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto"
        style={{ background: 'rgba(13,17,23,0.9)' }}
      >
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>
          {t(
            '\u05DB\u05DC\u05D9\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D9\u05DD \u05DC\u05D9\u05D6\u05DE\u05D9\u05DD, \u05D0\u05D3\u05E8\u05D9\u05DB\u05DC\u05D9\u05DD \u05D5\u05E9\u05DE\u05D0\u05D9\u05DD',
            'Professional Tools for Developers, Architects & Appraisers'
          )}
        </span>
      </div>
    </div>
  );
}

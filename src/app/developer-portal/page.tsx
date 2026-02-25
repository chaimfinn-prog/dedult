'use client';

import { useState } from 'react';
import {
  Building2, ArrowRight, Globe, Ruler, Calculator,
  ChevronLeft, HardHat, ExternalLink, BarChart3, FileDown,
  Hammer, ShoppingCart, Search,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PropertySearchBar, { type SearchParams } from '@/components/shared/PropertySearchBar';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

export default function DeveloperPortalPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    // Navigate to rights calculator with search context
    const query = new URLSearchParams();
    if (params.city) query.set('city', params.city);
    if (params.gush) query.set('gush', params.gush);
    if (params.helka) query.set('helka', params.helka);
    if (params.street) query.set('street', params.street);
    window.location.href = `/developer-portal/rights-calculator?${query.toString()}`;
  };

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
            <a href="/urban-renewal" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('התחדשות עירונית', 'Urban Renewal')}
            </a>
            <a href="/transactions" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('עסקאות', 'Transactions')}
            </a>
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a
              href="/"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('חזרה', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">

        {/* ── Hero Section ── */}
        <div className="text-center mb-10">
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
            {t('פורטל יזמים', 'Developer Portal')}
          </h1>
          <p className="text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              'כלים מקצועיים ליזמים, אדריכלים ושמאים',
              'Professional Tools for Developers, Architects & Appraisers'
            )}
          </p>
        </div>

        {/* ── Property Search Bar ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#1a1a2e',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4" style={{ color: '#a78bfa' }} />
            <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
              {t('חיפוש נכס — כל עיר בישראל', 'Property Search — Any City in Israel')}
            </h2>
          </div>
          <PropertySearchBar onSearch={handleSearch} />
        </div>

        {/* ── Service Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Card 1 — Building Rights Calculator */}
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
                  {t('מנוע סטטוטורי', 'Statutory Engine')}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t('מחשבון זכויות בנייה', 'Building Rights Calculator')}
              </h3>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a4a6a' }}>
                {t(
                  'חישוב זכויות בנייה מדויק על בסיס תב"ע, כולל מנוע סטטוטורי עם 3 חלופות, מפת דגלים אדומים, וניתוח כלכלי.',
                  'Precise building rights calculation with statutory engine: 3 alternatives, red flags matrix, and economic analysis.'
                )}
              </p>

              <a
                href="/developer-portal/rights-calculator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 16px rgba(167,139,250,0.35)',
                  textDecoration: 'none',
                }}
              >
                {t('התחל חישוב', 'Start Calculation')}
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
                  {t('ניתוח כלכלי', 'Economics')}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
                {t('בדיקת כדאיות כלכלית', 'Economic Feasibility Check')}
              </h3>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a4a6a' }}>
                {t(
                  'ניתוח כלכלי מקיף לפרויקט התחדשות — הכנסות, עלויות בנייה, מיסים, היטלים ורווחיות צפויה.',
                  'Comprehensive economic analysis for renewal projects — revenue, construction costs, taxes, levies & profitability.'
                )}
              </p>

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
        </div>

        {/* ── Quick Navigation — Urban Renewal & Transactions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Urban Renewal */}
          <a
            href="/urban-renewal"
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl block no-underline"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#1a1a2e',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(63,185,80,0.12)', border: '1px solid rgba(63,185,80,0.25)' }}
              >
                <Hammer className="w-6 h-6" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">{t('התחדשות עירונית', 'Urban Renewal')}</h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {t('תמ"א 38 / חלופת שקד — ניתוח זכויות וכדאיות', 'TAMA 38 / Shaked — rights & feasibility analysis')}
                </p>
              </div>
              <ChevronLeft className="w-5 h-5 mr-auto" style={{ color: '#9ca3af' }} />
            </div>
          </a>

          {/* Transactions */}
          <a
            href="/transactions"
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl block no-underline"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#1a1a2e',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <ShoppingCart className="w-6 h-6" style={{ color: '#2563eb' }} />
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">{t('ניתוח עסקאות', 'Transaction Analysis')}</h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {t('הערכת כדאיות רכישת נכס קיים', 'Property acquisition evaluation')}
                </p>
              </div>
              <ChevronLeft className="w-5 h-5 mr-auto" style={{ color: '#9ca3af' }} />
            </div>
          </a>
        </div>

        {/* ── Pro Tools Row ── */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl mb-8"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#1a1a2e',
          }}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{t('ניתוח רגישות וייצוא', 'Sensitivity & Export')}</h3>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {t('מפת חום, ייצוא PDF ו-Excel', 'Heatmaps, PDF & Excel exports')}
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(63,185,80,0.1)', color: '#16a34a', border: '1px solid rgba(63,185,80,0.25)' }}
              >
                PRO
              </span>
            </div>
            <a
              href="/developer-portal/economic-feasibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:opacity-90"
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
                {t('מידע על תב"ע', 'About the Zoning Plan')}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4a4a6a' }}>
                {t(
                  'המחשבון תומך כעת בתב"ע 416-1060052 (רעננה). ערים נוספות בקרוב — תל אביב, ירושלים, חיפה ועוד.',
                  'The calculator currently supports zoning plan 416-1060052 (Ra\'anana). More cities coming soon — Tel Aviv, Jerusalem, Haifa and more.'
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
            'כלים מקצועיים ליזמים, אדריכלים ושמאים',
            'Professional Tools for Developers, Architects & Appraisers'
          )}
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Building2, Globe, ArrowRight, ShoppingCart, TrendingUp,
  ChevronLeft, Info, DollarSign, BarChart3,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PropertySearchBar, { type SearchParams } from '@/components/shared/PropertySearchBar';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80';
const PURPLE = '#a78bfa';

export default function TransactionsPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
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
              {t('| ניתוח עסקאות', '| Transaction Analysis')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/developer-portal" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('פורטל יזמים', 'Developer Portal')}
            </a>
            <a href="/urban-renewal" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('התחדשות', 'Renewal')}
            </a>
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}
          >
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('ניתוח עסקאות נדל"ן', 'Real Estate Transaction Analysis')}
          </h1>
          <p className="text-base text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              'הערכת כדאיות רכישת נכס — ניתוח מחירים, זכויות בנייה פוטנציאליות, השוואת חלופות ותשואה צפויה',
              'Property acquisition evaluation — price analysis, potential building rights, alternatives comparison & expected yield'
            )}
          </p>
        </div>

        {/* ── Property Search ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4" style={{ color: '#2563eb' }} />
            <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
              {t('חפש נכס לניתוח עסקה', 'Search Property for Transaction Analysis')}
            </h2>
          </div>
          <PropertySearchBar onSearch={handleSearch} />
        </div>

        {/* ── What's Included (before search) ── */}
        {!searchParams && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
                  <DollarSign className="w-4 h-4" style={{ color: '#2563eb' }} />
                </div>
                <h3 className="text-sm font-bold">{t('ניתוח מחירים', 'Price Analysis')}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#4a4a6a' }}>
                {t(
                  'השוואת מחיר הנכס מול עסקאות דומות באזור. מחיר למ"ר, מגמות ותמחור שוק.',
                  'Compare property price with similar transactions in the area. Price per sqm, trends, and market pricing.'
                )}
              </p>
            </div>

            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Building2 className="w-4 h-4" style={{ color: '#7c3aed' }} />
                </div>
                <h3 className="text-sm font-bold">{t('זכויות בנייה פוטנציאליות', 'Potential Building Rights')}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#4a4a6a' }}>
                {t(
                  'ניתוח סטטוטורי של הנכס — 3 חלופות זכויות (תב"ע, תמ"א 38, שקד) עם מפת דגלים אדומים.',
                  'Statutory analysis — 3 rights alternatives (TABA, TAMA 38, Shaked) with red flags matrix.'
                )}
              </p>
            </div>

            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
                </div>
                <h3 className="text-sm font-bold">{t('תשואה צפויה', 'Expected Yield')}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#4a4a6a' }}>
                {t(
                  'חישוב רווח נקי, היטל השבחה, עלויות בנייה ותשואה — לכל חלופת זכויות.',
                  'Net profit, betterment levy, construction costs, and yield — for each rights alternative.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Search Result → Navigate to Calculator ── */}
        {searchParams && (
          <div
            className="rounded-2xl p-6 sm:p-8 mb-8"
            style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4" style={{ color: '#2563eb' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                {t('נכס נבחר — ניתוח עסקה', 'Property Selected — Transaction Analysis')}
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#4a4a6a' }}>
              {searchParams.city && <span className="font-semibold">{searchParams.city}</span>}
              {searchParams.street && <span> — {searchParams.street}</span>}
              {searchParams.gush && <span> | {t('גוש', 'Block')} {searchParams.gush}</span>}
              {searchParams.helka && <span>, {t('חלקה', 'Parcel')} {searchParams.helka}</span>}
            </p>

            {/* Price input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  {t('מחיר מבוקש / מוצע (₪)', 'Asking / Offered Price (₪)')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={t('לדוגמה: 3,500,000', 'e.g. 3,500,000')}
                  className="w-full"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  {t('שטח הנכס (מ"ר)', 'Property Area (sqm)')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={t('לדוגמה: 85', 'e.g. 85')}
                  className="w-full"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`/developer-portal/rights-calculator?city=${encodeURIComponent(searchParams.city || '')}&gush=${searchParams.gush || ''}&helka=${searchParams.helka || ''}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)', textDecoration: 'none' }}
              >
                <BarChart3 className="w-4 h-4" />
                {t('נתח עסקה', 'Analyze Transaction')}
                <ChevronLeft className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
        >
          <h3 className="text-base font-bold mb-2">{t('צריכים חוות דעת מקצועית?', 'Need Professional Opinion?')}</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            {t(
              'הזמינו פגישת ייעוץ עם שמאי מקרקעין — ניתוח עסקה מלא כולל שווי שוק, פוטנציאל השבחה ותחשיב מס.',
              'Book a consultation with a real estate appraiser — full transaction analysis including market value, appreciation potential, and tax calculation.'
            )}
          </p>
          <a
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)', textDecoration: 'none' }}
          >
            {t('קבע פגישת ייעוץ', 'Book Consultation')}
          </a>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('ניתוח עסקאות נדל"ן — השוואת מחירים וכדאיות', 'Real Estate Transactions — Price Comparison & Feasibility')}</span>
      </div>
    </div>
  );
}

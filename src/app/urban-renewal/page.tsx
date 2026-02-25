'use client';

import { useState } from 'react';
import {
  Building2, Globe, ArrowRight, Hammer, Shield, ChevronLeft,
  AlertTriangle, Info,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PropertySearchBar, { type SearchParams } from '@/components/shared/PropertySearchBar';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=80';
const PURPLE = '#a78bfa';

export default function UrbanRenewalPage() {
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
              {t('| התחדשות עירונית', '| Urban Renewal')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/developer-portal" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('פורטל יזמים', 'Developer Portal')}
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
            style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}
          >
            <Hammer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('התחדשות עירונית', 'Urban Renewal')}
          </h1>
          <p className="text-base text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              'ניתוח פרויקטי תמ"א 38 וחלופת שקד (תיקון 139) — זכויות, מגבלות, חלופות וכדאיות כלכלית',
              'TAMA 38 and Shaked Alternative (Amendment 139) project analysis — rights, constraints, alternatives & economics'
            )}
          </p>
        </div>

        {/* ── Property Search ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4" style={{ color: '#16a34a' }} />
            <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
              {t('חפש נכס לניתוח התחדשות', 'Search Property for Renewal Analysis')}
            </h2>
          </div>
          <PropertySearchBar onSearch={handleSearch} />
        </div>

        {/* ── Quick Info: What to expect ── */}
        {!searchParams && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Track 1: TAMA 38 */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Building2 className="w-4 h-4" style={{ color: '#d97706' }} />
                </div>
                <h3 className="text-sm font-bold">{t('תמ"א 38 הרחבה', 'TAMA 38 Extension')}</h3>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#4a4a6a' }}>
                {t(
                  'תוספת של עד 50% משטח הבנוי הקיים. חיזוק סייסמי + תוספת קומות ויחידות. תקף עד מאי 2026.',
                  'Add up to 50% of existing built area. Seismic reinforcement + floor/unit additions. Valid until May 2026.'
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[t('+50% שטח', '+50% area'), t('חיזוק סייסמי', 'Seismic'), t('תוספת קומות', '+ floors')].map((tag, i) => (
                  <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Track 2: Shaked */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Hammer className="w-4 h-4" style={{ color: '#7c3aed' }} />
                </div>
                <h3 className="text-sm font-bold">{t('חלופת שקד (תיקון 139)', 'Shaked (Amendment 139)')}</h3>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#4a4a6a' }}>
                {t(
                  'מכפיל 400-550% משטח קיים. פינוי בינוי או תוספת בנייה. מודל שטח כולל מ-30.10.2025.',
                  '400-550% multiplier of existing area. Demolish & rebuild or addition. Total area model from 30.10.2025.'
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[t('400-550%', '400-550%'), t('פינוי בינוי', 'Demolish'), t('שטח ציבורי', 'Public share')].map((tag, i) => (
                  <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Statutory Engine */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                </div>
                <h3 className="text-sm font-bold">{t('בדיקת חסימות', 'Block Detection')}</h3>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#4a4a6a' }}>
                {t(
                  'זיהוי אוטומטי של הקפאות §77-78, ליבת מטרו (תמ"א 70), מגבלת רט"א, שימור, וסעיף 23.',
                  'Automatic detection of §77-78 freezes, metro core (TAMA 70), RATA height, heritage, and Section 23.'
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[t('הקפאות', 'Freezes'), t('תמ"א 70', 'TAMA 70'), t('רט"א', 'RATA')].map((tag, i) => (
                  <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
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
              <Info className="w-4 h-4" style={{ color: PURPLE }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                {t('נכס נבחר', 'Property Selected')}
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#4a4a6a' }}>
              {searchParams.city && <span className="font-semibold">{searchParams.city}</span>}
              {searchParams.street && <span> — {searchParams.street}</span>}
              {searchParams.gush && <span> | {t('גוש', 'Block')} {searchParams.gush}</span>}
              {searchParams.helka && <span>, {t('חלקה', 'Parcel')} {searchParams.helka}</span>}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/developer-portal/rights-calculator?city=${encodeURIComponent(searchParams.city || '')}&gush=${searchParams.gush || ''}&helka=${searchParams.helka || ''}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', boxShadow: '0 4px 16px rgba(167,139,250,0.35)', textDecoration: 'none' }}
              >
                {t('חשב זכויות בנייה', 'Calculate Building Rights')}
                <ChevronLeft className="w-4 h-4" />
              </a>
              <a
                href="/checkup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#4a4a6a', border: '1px solid rgba(0,0,0,0.1)', textDecoration: 'none' }}
              >
                {t('דו"ח התחדשות מלא (750₪)', 'Full Renewal Report (₪750)')}
              </a>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
        >
          <h3 className="text-base font-bold mb-2">{t('צריכים ניתוח מקצועי?', 'Need Professional Analysis?')}</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            {t(
              'הזמינו פגישת ייעוץ עם מומחי התחדשות עירונית — 2,500₪ לפגישה.',
              'Book a consultation with urban renewal experts — ₪2,500 per session.'
            )}
          </p>
          <a
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 16px rgba(22,163,74,0.35)', textDecoration: 'none' }}
          >
            {t('קבע פגישת ייעוץ', 'Book Consultation')}
          </a>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('התחדשות עירונית — תמ"א 38 / חלופת שקד', 'Urban Renewal — TAMA 38 / Shaked Alternative')}</span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Building2, ChevronLeft, Search, CalendarDays, BarChart3, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

export default function Home() {
  const [address, setAddress] = useState('');
  const router = useRouter();
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const handleStart = () => {
    if (address.trim()) {
      router.push(`/checkup?address=${encodeURIComponent(address)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden">

        {/* Video / Animated Background — UNCHANGED */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay muted loop playsInline
            className="bg-video bg-cinematic"
            poster={FALLBACK_IMG}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 bg-cinematic bg-cover bg-center"
            style={{ backgroundImage: `url('${FALLBACK_IMG}')` }}
          />
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="absolute inset-0 bg-grid" />
        </div>

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green" />
              <span className="font-bold text-sm">THE REALITY CHECK</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'he' ? 'EN' : 'עב'}
              </button>
              <Link href="/about" className="text-xs text-foreground-muted hover:text-foreground transition-colors">{t('אודות', 'About')}</Link>
              <Link href="/prices" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                {t('מקורות מידע', 'Resources')}
              </Link>
              <Link href="/booking" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {t('קביעת ייעוץ', 'Book Consultation')}
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] mb-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
            <span className="w-2 h-2 rounded-full bg-green pulse" />
            <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">{t('בדיקת נאותות להתחדשות עירונית', 'Urban Renewal Due Diligence')}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-gradient-blue">
            {t('בדיקת מציאות להבטחות נדל"ן', 'Reality Check for Real Estate Promises')}
          </h1>

          <p className="text-lg md:text-xl text-foreground-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            {t(
              'חושפים את האמת מאחורי המצגות, המספרים וההבטחות של היזמים. ',
              'Exposing the truth behind presentations, numbers and developer promises. '
            )}
            <span className="text-foreground font-semibold">
              {t('בדיקת נאותות מקיפה על ידי נבחרת מומחים.', 'Comprehensive due diligence by an expert team.')}
            </span>
          </p>

          <div className="max-w-xl mx-auto db-card p-2 flex flex-col md:flex-row gap-2 transition-all focus-within:border-green/50 focus-within:shadow-[0_0_20px_var(--green-glow)]">
            <div className="flex-1 flex items-center px-4 h-14">
              <Search className="w-5 h-5 text-foreground-muted ml-3" />
              <input
                type="text"
                placeholder={t('...הזן כתובת פרויקט מלאה', 'Enter full project address...')}
                className="w-full bg-transparent border-none outline-none text-foreground placeholder-[var(--fg-dim)] text-right"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <button
              onClick={handleStart}
              disabled={!address.trim()}
              className="btn-green h-14 px-8 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('התחל בדיקה', 'Start Check')}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6">
            <Link
              href="/foreign"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-green/40 text-green hover:bg-green/10 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {t('דוח סיכונים בהשקעה בחו"ל', 'Foreign Investment Risk Report')}
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-xs text-foreground-muted font-medium tracking-widest uppercase">
            <span>{t('אימות סטטוס תכנוני', 'Planning Verification')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('פרופיל יזם', 'Developer Profile')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('ניתוח סיכונים', 'Risk Analysis')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('ניתוח כלכלי', 'Financial Analysis')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

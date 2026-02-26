'use client';

import { Building2, Globe, ChevronLeft, Home as HomeIcon, Sprout, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80';

const OPTIONS = [
  {
    id: 'apartment',
    href: '/private/apartment',
    icon: HomeIcon,
    labelHe: 'רכישת דירה',
    labelEn: 'Apartment Purchase',
    descHe: 'ניתוח עסקה, מס רכישה, תשואה ובדיקת פוטנציאל התחדשות',
    descEn: 'Deal analysis, purchase tax, yield & urban renewal potential',
    color: '#5b8dee',
    main: true,
  },
  {
    id: 'agricultural-land',
    href: '/private/agricultural-land',
    icon: Sprout,
    labelHe: 'קרקע חקלאית',
    labelEn: 'Agricultural Land',
    descHe: 'הכוונה בלבד — סיכונים ומידע כללי',
    descEn: 'Orientation only — risks & general information',
    color: '#f85149',
    main: false,
  },
  {
    id: 'abroad',
    href: '/private/abroad',
    icon: Plane,
    labelHe: 'רכישה בחו"ל',
    labelEn: 'Foreign Property',
    descHe: 'הכוונה בלבד — סיכוני מדינה ומיסוי',
    descEn: 'Orientation only — country risk & taxation',
    color: '#d29922',
    main: false,
  },
];

export default function PrivatePage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

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
            <span className="text-foreground-muted text-xs">{t('| פרטי', '| Private')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ChevronLeft className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-center">
          {t('מסלול פרטי', 'Private Path')}
        </h1>
        <p className="text-foreground-muted text-sm mb-10 text-center max-w-lg">
          {t('בחרו את סוג ההשקעה', 'Select your investment type')}
        </p>

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => router.push(opt.href)}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:scale-[1.03] hover:shadow-2xl neon-glow"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  backdropFilter: 'blur(20px)',
                  minHeight: '200px',
                }}
              >
                <div className="relative z-10 p-7 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{
                    background: `color-mix(in srgb, ${opt.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${opt.color} 30%, transparent)`,
                  }}>
                    <Icon className="w-6 h-6" style={{ color: opt.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">
                      {lang === 'he' ? opt.labelHe : opt.labelEn}
                    </h2>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {lang === 'he' ? opt.descHe : opt.descEn}
                    </p>
                  </div>
                  {!opt.main && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.15)]" style={{ color: opt.color }}>
                      {t('הכוונה בלבד', 'Orientation Only')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

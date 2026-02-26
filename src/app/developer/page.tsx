'use client';

import { Building2, Globe, ChevronLeft, Ruler, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

const OPTIONS = [
  {
    id: 'rights-check',
    href: '/developer/rights-check',
    icon: Ruler,
    labelHe: 'בדיקת זכויות',
    labelEn: 'Rights Check',
    descHe: 'מנוע סטטוטורי — זכויות בנייה, הקפאות, דגלים אדומים וחלופות תכנון',
    descEn: 'Statutory engine — building rights, freezes, red flags & planning alternatives',
    color: '#a78bfa',
  },
  {
    id: 'economic-report',
    href: '/developer/economic-report',
    icon: BarChart3,
    labelHe: 'דוח כלכלי',
    labelEn: 'Economic Report',
    descHe: 'ניתוח כדאיות — עלויות, הכנסות, היטל השבחה ורווחיות',
    descEn: 'Feasibility analysis — costs, revenue, betterment levy & profitability',
    color: '#22c55e',
  },
];

export default function DeveloperPage() {
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
            <span className="text-foreground-muted text-xs">{t('| יזם', '| Developer')}</span>
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
          {t('פורטל יזמים', 'Developer Portal')}
        </h1>
        <p className="text-foreground-muted text-sm mb-10 text-center max-w-lg">
          {t('בחרו את הכלי הנדרש', 'Select the tool you need')}
        </p>

        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="relative z-10 p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{
                    background: `color-mix(in srgb, ${opt.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${opt.color} 30%, transparent)`,
                  }}>
                    <Icon className="w-7 h-7" style={{ color: opt.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {lang === 'he' ? opt.labelHe : opt.labelEn}
                    </h2>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {lang === 'he' ? opt.descHe : opt.descEn}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

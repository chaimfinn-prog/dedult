'use client';

import { Building2, Globe, CalendarDays, Home as HomeIcon, Plane, Hammer, Sprout, HardHat, ChevronLeft, ArrowRight, LogIn, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const TILES = [
  {
    id: 'new-apartment',
    href: '/new-apartment',
    icon: HomeIcon,
    labelHe: 'דירה חדשה',
    labelEn: 'New Apartment',
    subtitleHe: 'צמיחה למגורים',
    subtitleEn: 'Residential Growth',
    color: 'var(--accent)',
    bgGradient: 'linear-gradient(135deg, rgba(91,141,238,0.12) 0%, rgba(91,141,238,0.04) 100%)',
    borderColor: 'rgba(91,141,238,0.25)',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'foreign',
    href: '/foreign',
    icon: Plane,
    labelHe: 'נכס בחו"ל',
    labelEn: 'Foreign Property',
    subtitleHe: 'סיכון בינלאומי',
    subtitleEn: 'International Risk',
    color: 'var(--gold)',
    bgGradient: 'linear-gradient(135deg, rgba(210,153,34,0.12) 0%, rgba(210,153,34,0.04) 100%)',
    borderColor: 'rgba(210,153,34,0.25)',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'urban-renewal',
    href: '/checkup',
    icon: Hammer,
    labelHe: 'התחדשות עירונית',
    labelEn: 'Urban Renewal',
    subtitleHe: 'השבחת ערך',
    subtitleEn: 'Value Add',
    color: 'var(--green)',
    bgGradient: 'linear-gradient(135deg, rgba(63,185,80,0.12) 0%, rgba(63,185,80,0.04) 100%)',
    borderColor: 'rgba(63,185,80,0.25)',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'agri',
    href: '/agri',
    icon: Sprout,
    labelHe: 'קרקע חקלאית',
    labelEn: 'Agricultural Land',
    subtitleHe: 'ספקולטיבי',
    subtitleEn: 'Speculative',
    color: 'var(--red)',
    bgGradient: 'linear-gradient(135deg, rgba(248,81,73,0.12) 0%, rgba(248,81,73,0.04) 100%)',
    borderColor: 'rgba(248,81,73,0.25)',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'developer',
    href: '/developer-portal',
    icon: HardHat,
    labelHe: 'פורטל יזמים',
    labelEn: 'Developer Portal',
    subtitleHe: 'זכויות בנייה וכדאיות כלכלית',
    subtitleEn: 'Building Rights & Feasibility',
    color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
    borderColor: 'rgba(167,139,250,0.25)',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const { user, signInWithGoogle, signOut } = useAuth();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="absolute inset-0 bg-grid" />
        </div>

        {/* Nav */}
        <div className="relative z-20 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit">
              <Building2 className="w-5 h-5 text-green" />
              <span className="font-bold text-sm tracking-tight">PROPCHECK</span>
            </a>
            <div className="flex items-center gap-4">
              <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'he' ? 'EN' : 'עב'}
              </button>
              <a href="/about" className="text-xs text-foreground-muted hover:text-foreground transition-colors">{t('אודות', 'About')}</a>
              <a href="/booking" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {t('ייעוץ', 'Consult')}
              </a>
              {user ? (
                <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
                </button>
              ) : (
                <button onClick={signInWithGoogle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                  <LogIn className="w-3.5 h-3.5" />
                  {t('התחבר', 'Sign In')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] mb-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
              <span className="w-2 h-2 rounded-full bg-green pulse" />
              <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">{t('עין מקצועית על העסקה שלכם', 'A Professional Eye on Your Deal')}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-blue">
              {t('אל תסתפקו בהבטחות, תסתמכו על עובדות.', "Don't Settle for Promises, Rely on Facts.")}
            </h1>

            <p className="text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
              {t(
                'בחרו את סוג ההשקעה שלכם. אנחנו נספק לכם את המידע שצריך כדי לקבל החלטה חכמה.',
                'Select your investment type. We provide the intelligence you need to make a smart decision.'
              )}
            </p>
          </div>

          {/* Decision Matrix */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {TILES.map((tile, idx) => {
              const Icon = tile.icon;
              const isLast = idx === TILES.length - 1 && TILES.length % 2 === 1;
              return (
                <button
                  key={tile.id}
                  onClick={() => router.push(tile.href)}
                  className={`group relative rounded-2xl overflow-hidden text-right transition-all duration-300 cursor-pointer border-0 hover:scale-[1.02] hover:shadow-2xl${isLast ? ' md:col-span-2 md:max-w-[calc(50%-10px)] md:mx-auto' : ''}`}
                  style={{
                    background: tile.bgGradient,
                    border: `1px solid ${tile.borderColor}`,
                    backdropFilter: 'blur(20px)',
                    minHeight: '160px',
                  }}
                >
                  {/* Background image — subtle */}
                  <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500 bg-cover bg-center" style={{ backgroundImage: `url('${tile.image}')` }} />

                  <div className="relative z-10 p-6 md:p-8 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{
                      background: `color-mix(in srgb, ${tile.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${tile.color} 30%, transparent)`,
                    }}>
                      <Icon className="w-7 h-7" style={{ color: tile.color }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                        {lang === 'he' ? tile.labelHe : tile.labelEn}
                      </h2>
                      <p className="text-sm font-medium" style={{ color: tile.color }}>
                        {lang === 'he' ? tile.subtitleHe : tile.subtitleEn}
                      </p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-foreground-muted opacity-40 group-hover:opacity-100 transition-all group-hover:-translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom feature chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground-muted font-medium tracking-widest uppercase">
            <span>{t('בדיקת כדאיות', 'Viability Check')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('ניתוח סיכונים', 'Risk Analysis')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('פרופיל יזם', 'Developer Profile')}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{t('מודיעין עסקי', 'Business Intelligence')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted" style={{ background: 'rgba(13,17,23,0.9)' }}>
          <span>PROPCHECK</span>
          <span className="opacity-30 mx-2">|</span>
          <span>{t('אל תסתפקו בהבטחות, תסתמכו על עובדות.', "Don't settle for promises, rely on facts.")}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Building2, Globe, CalendarDays, HardHat, ShoppingCart, ChevronLeft, LogIn, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const PATHS = [
  {
    id: 'developer',
    href: '/developer',
    icon: HardHat,
    labelHe: 'יזם',
    labelEn: 'Developer',
    descHe: 'בדיקת זכויות בנייה, מנוע סטטוטורי ודוח כלכלי ליזמי נדל"ן',
    descEn: 'Building rights analysis, statutory engine & economic feasibility for real estate developers',
    color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0.04) 100%)',
    borderColor: 'rgba(167,139,250,0.3)',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'private',
    href: '/private',
    icon: ShoppingCart,
    labelHe: 'פרטי',
    labelEn: 'Private',
    descHe: 'רכישת דירה, קרקע חקלאית או נכס בחו"ל — ניתוח כדאיות וסיכונים',
    descEn: 'Apartment purchase, agricultural land or foreign property — viability & risk analysis',
    color: '#5b8dee',
    bgGradient: 'linear-gradient(135deg, rgba(91,141,238,0.14) 0%, rgba(91,141,238,0.04) 100%)',
    borderColor: 'rgba(91,141,238,0.3)',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const { user, signInWithGoogle, signOut } = useAuth();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  return (
    <div className="min-h-screen flex flex-col bg-orbs">
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
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] mb-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
              <span className="w-2 h-2 rounded-full bg-green pulse" />
              <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">{t('עין מקצועית על העסקה שלכם', 'A Professional Eye on Your Deal')}</span>
            </div>

            <div className="w-24 h-0.5 mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-purple), var(--teal))' }} />

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-animate">
              {t('אל תסתפקו בהבטחות, תסתמכו על עובדות.', "Don't Settle for Promises, Rely on Facts.")}
            </h1>

            <p className="text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
              {t('מי אתם?', 'Who are you?')}
            </p>
          </div>

          {/* Two cards */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {PATHS.map((path) => {
              const Icon = path.icon;
              return (
                <button
                  key={path.id}
                  onClick={() => router.push(path.href)}
                  className="group relative rounded-2xl overflow-hidden text-right transition-all duration-300 cursor-pointer border-0 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[0_0_40px_rgba(91,141,238,0.15)] neon-glow"
                  style={{
                    background: path.bgGradient,
                    border: `1px solid ${path.borderColor}`,
                    backdropFilter: 'blur(20px)',
                    minHeight: '220px',
                  }}
                >
                  {/* Background image */}
                  <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 bg-cover bg-center" style={{ backgroundImage: `url('${path.image}')` }} />

                  <div className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center gap-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{
                      background: `color-mix(in srgb, ${path.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${path.color} 30%, transparent)`,
                    }}>
                      <Icon className="w-9 h-9" style={{ color: path.color }} />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        {lang === 'he' ? path.labelHe : path.labelEn}
                      </h2>
                      <p className="text-sm text-foreground-muted leading-relaxed">
                        {lang === 'he' ? path.descHe : path.descEn}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium mt-1" style={{ color: path.color }}>
                      <span>{t('בחרו', 'Select')}</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted" style={{ background: 'rgba(13,17,23,0.9)' }}>
          <span>PROPCHECK</span>
          <span className="opacity-30 mx-2">|</span>
          <span>{t('אל תסתפקו בהבטחות, תסתמכו על עובדות.', "Don't settle for promises, rely on facts.")}</span>
          <span className="opacity-30 mx-2">|</span>
          <span>&copy; 2025</span>
          <span className="opacity-30 mx-2">|</span>
          <a href="/prices" className="text-foreground-muted hover:text-foreground transition-colors">{t('מחירון', 'Prices')}</a>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  Building2, Globe, ArrowRight, AlertOctagon, AlertTriangle,
  Landmark, Users, DollarSign, TrendingDown, FileText,
  CalendarDays, ChevronLeft, Hammer, ShieldAlert, Clock,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const RISK_SECTIONS = [
  {
    id: 'planning',
    icon: Clock,
    titleHe: 'חוסר ודאות תכנוני מובנה',
    titleEn: 'Inherent Planning Uncertainty',
    contentHe:
      'תהליך הפשרה של קרקע חקלאית גולמית יכול להימשך בין מספר שנים לעשור ואף עשרות שנים, ללא כל ערובה לתוצאה הסופית. לאורך כל התקופה הזו, הכסף "נעול" ללא תשואה שוטפת.',
    contentEn:
      'The rezoning process of raw agricultural land can take anywhere from several years to a decade or even decades, with no guarantee of the final outcome. Throughout this entire period, capital is "locked" with no current yield.',
  },
  {
    id: 'tax',
    icon: DollarSign,
    titleHe: 'עלויות נסתרות ונטל מס כבד',
    titleEn: 'Hidden Costs & Tax Burden',
    contentHe:
      'המיסוי על קרקע חקלאית הוא מהכבדים בשוק: היטל השבחה בגובה 50% מעליית השווי, מס שבח של עד 25% מהרווח הריאלי ומס רכישה של 6% ללא מדרגות פטור. נטל המס יכול להגיע ל-70% מסך ההשבחה.',
    contentEn:
      'Taxation on agricultural land is among the heaviest in the market: a betterment levy of 50% of the value increase, capital gains tax of up to 25% on real profit, and a purchase tax of 6% with no exemption brackets. The total tax burden can reach 70% of appreciation.',
  },
  {
    id: 'rmi',
    icon: Landmark,
    titleHe: 'מלכודת קרקעות המדינה (רמ"י)',
    titleEn: 'State Land Trap (RMI)',
    contentHe:
      'בקרקע המוחכרת מרשות מקרקעי ישראל, חוזה החכירה קובע לרוב כי עם שינוי הייעוד הקרקע חוזרת למדינה. החוכר מקבל פיצוי חקלאי מינימלי בלבד.',
    contentEn:
      'For land leased from the Israel Land Authority, the lease contract typically states that upon rezoning the land reverts to the state. The lessee receives only minimal agricultural compensation.',
  },
  {
    id: 'musha',
    icon: Users,
    titleHe: 'בעיית המושע',
    titleEn: 'The Musha Problem',
    contentHe:
      'ברבות מעסקאות הקרקע החקלאית, הרוכש מצטרף ל"קבוצת רכישה" \u2014 מושע. ההצלחה תלויה ביכולת ניהול של קבוצת זרים, שיתוף פעולה בין עשרות אנשים, ועמידות תקציבית אישית.',
    contentEn:
      'In many agricultural land transactions, the buyer joins a "purchase group" \u2014 musha. Success depends on the management ability of a group of strangers, cooperation among dozens of people, and personal financial resilience.',
  },
  {
    id: 'agents',
    icon: TrendingDown,
    titleHe: 'סוכני קרקע \u2014 מוכרי חלומות',
    titleEn: 'Land Agents \u2014 Dream Sellers',
    contentHe:
      'סוכני קרקע ומשווקים מציגים מצגת שווא של "הזדמנות השקעה". הם מציגים תרחישים אופטימיים בלבד, מסתירים את הסיכונים, ומרוויחים עמלות גבוהות ללא אחריות לתוצאה.',
    contentEn:
      'Land agents and marketers present a false "investment opportunity." They show only optimistic scenarios, hide the risks, and earn high commissions with no accountability for the outcome.',
  },
];

export default function AgriPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Video Background */}
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

      {/* Header */}
      <div
        className="relative z-10 border-b border-[var(--border)] sticky top-0"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-green/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green" />
            </div>
            <span className="font-bold text-sm tracking-tight">PROPCHECK</span>
            <span className="text-foreground-muted text-xs">
              {t('| \u05e7\u05e8\u05e7\u05e2 \u05d7\u05e7\u05dc\u05d0\u05d9\u05ea', '| Agricultural Land')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : '\u05e2\u05d1'}
            </button>
            <a
              href="/"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('\u05d7\u05d6\u05e8\u05d4', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Hero Warning Section */}
        <div
          className="rounded-2xl p-8 md:p-12 mb-10 text-center fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 40%, #1a0505 100%)',
            border: '2px solid rgba(220,38,38,0.4)',
            boxShadow: '0 0 60px rgba(220,38,38,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'rgba(220,38,38,0.15)',
              border: '2px solid rgba(220,38,38,0.35)',
              boxShadow: '0 0 30px rgba(220,38,38,0.2)',
            }}
          >
            <AlertOctagon className="w-10 h-10" style={{ color: '#ef4444' }} />
          </div>
          <h1
            className="text-2xl md:text-4xl font-black mb-4 leading-tight"
            style={{ color: '#ef4444' }}
          >
            {t(
              '\u05d0\u05dc \u05ea\u05d9\u05e4\u05dc\u05d5 \u05d1\u05e4\u05d7 \u05e9\u05dc \u05de\u05d5\u05db\u05e8\u05d9 \u05d4\u05d7\u05dc\u05d5\u05de\u05d5\u05ea \u05d1\u05e7\u05e8\u05e7\u05e2 \u05d7\u05e7\u05dc\u05d0\u05d9\u05ea!',
              "Don't Fall for Agricultural Land Dream Sellers!"
            )}
          </h1>
          <p
            className="text-base md:text-lg font-semibold max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {t(
              '\u05d4\u05e1\u05d1\u05e8 \u05de\u05e4\u05d5\u05e8\u05d8 \u05d5\u05de\u05e7\u05e6\u05d5\u05e2\u05d9 \u05dc\u05de\u05d4 \u05dc\u05d0 \u05dc\u05d1\u05e6\u05e2 \u05e2\u05e1\u05e7\u05d4 \u05d1\u05e7\u05e8\u05e7\u05e2 \u05d7\u05e7\u05dc\u05d0\u05d9\u05ea',
              'A detailed professional explanation of why you should not invest in agricultural land'
            )}
          </p>
        </div>

        {/* Risk Cards */}
        <div className="space-y-5 mb-10">
          {RISK_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-xl p-6 md:p-8 fade-in-up flex gap-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(22,27,34,0.95) 0%, rgba(35,8,8,0.85) 100%)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
                  animationDelay: `${idx * 0.08}s`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                  style={{
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.25)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#ef4444' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: '#ef4444' }}
                    >
                      {t('\u05e1\u05d9\u05db\u05d5\u05df', 'RISK')} {idx + 1}/5
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {lang === 'he' ? section.titleHe : section.titleEn}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {lang === 'he' ? section.contentHe : section.contentEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Line Summary */}
        <div
          className="rounded-xl p-6 md:p-8 mb-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(13,17,23,0.95) 0%, rgba(40,5,5,0.9) 100%)',
            border: '2px solid rgba(220,38,38,0.35)',
            boxShadow: '0 0 40px rgba(220,38,38,0.08)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5" style={{ color: '#ef4444' }} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#ef4444' }}
            >
              {t('\u05e9\u05d5\u05e8\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4', 'BOTTOM LINE')}
            </span>
          </div>
          <p className="text-lg md:text-xl font-bold text-foreground leading-relaxed max-w-3xl mx-auto">
            {t(
              '\u05e8\u05db\u05d9\u05e9\u05ea \u05e7\u05e8\u05e7\u05e2 \u05d7\u05e7\u05dc\u05d0\u05d9\u05ea \u05de\u05d0\u05d5\u05e4\u05d9\u05d9\u05e0\u05ea \u05d1\u05e1\u05d9\u05db\u05d5\u05df \u05e7\u05d9\u05e6\u05d5\u05e0\u05d9. \u05e8\u05d5\u05d1 \u05d4\u05e8\u05d5\u05db\u05e9\u05d9\u05dd \u05e0\u05d5\u05ea\u05e8\u05d9\u05dd \u05e2\u05dd \u05e7\u05e8\u05e7\u05e2 \u05e9\u05d0\u05d9\u05e0\u05d4 \u05e0\u05d9\u05ea\u05e0\u05ea \u05dc\u05e4\u05d9\u05ea\u05d5\u05d7.',
              'Agricultural land investment is characterized by extreme risk. Most buyers end up with land that cannot be developed.'
            )}
          </p>
        </div>

        {/* CTA Section */}
        <div
          className="rounded-2xl p-8 md:p-10 mb-10 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-3">
            PROPCHECK
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {t(
              '\u05e8\u05d5\u05e6\u05d9\u05dd \u05d1\u05d3\u05d9\u05e7\u05d4 \u05de\u05e7\u05e6\u05d5\u05e2\u05d9\u05ea?',
              'Want a Professional Assessment?'
            )}
          </h2>
          <p className="text-sm text-foreground-muted mb-8 max-w-lg mx-auto">
            {t(
              '\u05e6\u05d5\u05d5\u05ea \u05d4\u05de\u05d5\u05de\u05d7\u05d9\u05dd \u05e9\u05dc\u05e0\u05d5 \u05d9\u05d1\u05d3\u05d5\u05e7 \u05d0\u05ea \u05d4\u05e7\u05e8\u05e7\u05e2 \u05d4\u05e1\u05e4\u05e6\u05d9\u05e4\u05d9\u05ea \u05e9\u05dc\u05db\u05dd \u05d5\u05d9\u05e1\u05e4\u05e7 \u05d3\u05d5\u05f4\u05d7 \u05de\u05e4\u05d5\u05e8\u05d8',
              'Our expert team will review your specific land and deliver a detailed report'
            )}
          </p>

          {/* Primary CTA */}
          <a
            href="/booking"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-lg text-base font-bold transition-all cursor-pointer border-0 mb-4"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#fff',
              boxShadow: '0 0 24px rgba(220,38,38,0.25)',
            }}
          >
            <FileText className="w-5 h-5" />
            {t(
              '\u05d4\u05d6\u05de\u05df \u05d3\u05d5\u05f4\u05d7 \u05de\u05e7\u05e6\u05d5\u05e2\u05d9 \u05dc\u05e7\u05e8\u05e7\u05e2 \u05d7\u05e7\u05dc\u05d0\u05d9\u05ea \u2014 250 \u20aa',
              'Order a Professional Agricultural Land Report \u2014 250 \u20aa'
            )}
          </a>

          {/* Secondary CTA */}
          <div className="mb-4">
            <a
              href="/booking"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--fg-muted)' }}
            >
              <CalendarDays className="w-4 h-4" />
              {t(
                '\u05d0\u05d5 \u05e7\u05d1\u05e2\u05d5 \u05e4\u05d2\u05d9\u05e9\u05ea \u05d9\u05d9\u05e2\u05d5\u05e5 \u2014 2,500 \u20aa',
                'Or book a consultation session \u2014 2,500 \u20aa'
              )}
            </a>
          </div>

          {/* Tertiary CTA */}
          <div
            className="pt-4 mt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <a
              href="/checkup"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--green)' }}
            >
              <Hammer className="w-4 h-4" />
              {t(
                '\u05d4\u05e9\u05d5\u05d5\u05d5 \u05dc\u05d0\u05dc\u05d8\u05e8\u05e0\u05d8\u05d9\u05d1\u05d4: \u05d4\u05ea\u05d7\u05d3\u05e9\u05d5\u05ea \u05e2\u05d9\u05e8\u05d5\u05e0\u05d9\u05ea \u05d1\u05d9\u05e9\u05e8\u05d0\u05dc',
                'Compare the alternative: Urban Renewal in Israel'
              )}
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto"
        style={{ background: 'rgba(13,17,23,0.9)' }}
      >
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>
          {t(
            '\u05d0\u05dc \u05ea\u05e1\u05ea\u05e4\u05e7\u05d5 \u05d1\u05d4\u05d1\u05d8\u05d7\u05d5\u05ea, \u05ea\u05e1\u05ea\u05de\u05db\u05d5 \u05e2\u05dc \u05e2\u05d5\u05d1\u05d3\u05d5\u05ea.',
            "Don't settle for promises, rely on facts."
          )}
        </span>
      </div>
    </div>
  );
}

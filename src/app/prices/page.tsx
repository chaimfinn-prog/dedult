'use client';

import {
  Building2, ArrowRight, ExternalLink, MapPin, BarChart3, TrendingUp, FileText, Globe,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

export default function PricesPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const LINKS = [
    {
      title: t('אתר הנדל"ן הממשלתי', 'Government Real Estate Portal'),
      desc: t('כל עסקאות הנדל"ן בפועל מרשות המיסים. המקור הרשמי והאמין ביותר לבדיקת מחירים.', 'All actual real estate transactions from the Tax Authority. The most official and reliable source for price checks.'),
      url: 'https://www.nadlan.gov.il',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'var(--accent)',
    },
    {
      title: t('מדלן — מדד ההתחדשות העירונית', 'Urban Renewal Index'),
      desc: t('דירוג יזמי ההתחדשות העירונית, השוואת פרויקטים ונתוני שוק מקיפים.', 'Developer rankings, project comparisons and comprehensive market data.'),
      url: 'https://madadithadshut.co.il',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'var(--green)',
    },
    {
      title: t('GovMap — מפות ישראל', 'GovMap — Israel Maps'),
      desc: t('מפות תכנון, גוש/חלקה, תב"ע ושכבות מידע גיאוגרפי ממשלתיות.', 'Planning maps, parcel data, TBA and government geographic data layers.'),
      url: 'https://www.govmap.gov.il',
      icon: <MapPin className="w-6 h-6" />,
      color: 'var(--teal)',
    },
    {
      title: t('XPLAN — קווים כחולים', 'XPLAN — Blue Lines'),
      desc: t('מערכת לצפייה בתוכניות מתאריות. כל התוכניות המוגשות למוסדות התכנון.', 'System for viewing outline plans. All plans submitted to planning authorities.'),
      url: 'https://ags.iplan.gov.il/xplan/',
      icon: <FileText className="w-6 h-6" />,
      color: 'var(--accent-purple)',
    },
    {
      title: t('מידע תכנוני — מבא"ת', 'Planning Info — Mavat'),
      desc: t('מאגר מינהל התכנון. חיפוש תוכניות, ישיבות ועררים, צפייה במסמכים סטטוטוריים.', 'Planning Administration database. Search plans, meetings, appeals and statutory documents.'),
      url: 'https://mavat.iplan.gov.il/SV3',
      icon: <Building2 className="w-6 h-6" />,
      color: 'var(--gold)',
    },
    {
      title: t('Duns100 — דירוג יזמי התחדשות', 'Duns100 — Developer Rankings'),
      desc: t('דירוג דאן אנד ברדסטריט של יזמי ההתחדשות העירונית המובילים בישראל.', 'Dun & Bradstreet ranking of leading urban renewal developers in Israel.'),
      url: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'var(--green)',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background — UNCHANGED */}
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
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm">THE REALITY CHECK</span>
            <span className="text-foreground-muted text-xs">{t('| מקורות מידע', '| Resources')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}<ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 flex-1">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">{t('מקורות מידע ובדיקת מחירים', 'Resources & Price Verification')}</h1>
          <p className="text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            {t(
              'אלו הכלים הרשמיים שאני משתמש בהם בעבודתי המקצועית. כל המקורות פתוחים לציבור ללא עלות.',
              'These are the official tools I use in my professional work. All sources are free and open to the public.'
            )}
          </p>
        </div>

        <div className="space-y-4">
          {LINKS.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="db-card p-5 flex items-center gap-5 hover:border-[var(--accent)]/30 transition-all group block"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${link.color} 12%, transparent)`, color: link.color }}>
                {link.icon}
              </div>
              <div className="flex-1 text-right">
                <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors">{link.title}</h3>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{link.desc}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-foreground-muted">
          <p>{t('כל המקורות המפורטים הם אתרים ממשלתיים ומוסדיים הפתוחים לשימוש חופשי.', 'All listed sources are government and institutional websites open for free public use.')}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('חיים פיין', 'Haim Finn')}</span>
      </div>
    </div>
  );
}

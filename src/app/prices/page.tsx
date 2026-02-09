'use client';

import {
  Building2, ArrowRight, ExternalLink, MapPin, BarChart3, TrendingUp, FileText,
} from 'lucide-react';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const LINKS = [
  {
    title: 'אתר הנדל"ן הממשלתי',
    desc: 'כל עסקאות הנדל"ן בפועל מרשות המיסים. המקור הרשמי והאמין ביותר לבדיקת מחירים.',
    url: 'https://www.nadlan.gov.il',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'var(--accent)',
  },
  {
    title: 'מדלן — מדד ההתחדשות העירונית',
    desc: 'דירוג יזמי ההתחדשות העירונית, השוואת פרויקטים ונתוני שוק מקיפים.',
    url: 'https://madadithadshut.co.il',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'var(--green)',
  },
  {
    title: 'GovMap — מפות ישראל',
    desc: 'מפות תכנון, גוש/חלקה, תב"ע ושכבות מידע גיאוגרפי ממשלתיות.',
    url: 'https://www.govmap.gov.il',
    icon: <MapPin className="w-6 h-6" />,
    color: 'var(--teal)',
  },
  {
    title: 'XPLAN — קווים כחולים',
    desc: 'מערכת לצפייה בתוכניות מתאריות. כל התוכניות המוגשות למוסדות התכנון.',
    url: 'https://ags.iplan.gov.il/xplan/',
    icon: <FileText className="w-6 h-6" />,
    color: 'var(--accent-purple)',
  },
  {
    title: 'מידע תכנוני — מבא"ת',
    desc: 'מאגר מינהל התכנון. חיפוש תוכניות, ישיבות ועררים, צפייה במסמכים סטטוטוריים.',
    url: 'https://mavat.iplan.gov.il/SV3',
    icon: <Building2 className="w-6 h-6" />,
    color: 'var(--gold)',
  },
  {
    title: 'Duns100 — דירוג יזמי התחדשות',
    desc: 'דירוג דאן אנד ברדסטריט של יזמי ההתחדשות העירונית המובילים בישראל.',
    url: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'var(--green)',
  },
];

export default function PricesPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
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
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm">THE REALITY CHECK</span>
            <span className="text-foreground-muted text-xs">{'| מקורות מידע'}</span>
          </div>
          <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה'}<ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 flex-1">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">{'מקורות מידע ובדיקת מחירים'}</h1>
          <p className="text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            {'אלו הכלים הרשמיים שאני משתמש בהם בעבודתי המקצועית. כל המקורות פתוחים לציבור ללא עלות.'}
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
          <p>{'כל המקורות המפורטים הם אתרים ממשלתיים ומוסדיים הפתוחים לשימוש חופשי.'}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'by Haim Finn'}</span>
      </div>
    </div>
  );
}

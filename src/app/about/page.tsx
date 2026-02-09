'use client';

import {
  Building2, ArrowRight, Award, Users, Briefcase, Shield, BookOpen,
  ChevronLeft, CalendarDays, MapPin, Phone, Mail,
} from 'lucide-react';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const CREDENTIALS = [
  { icon: <Award className="w-5 h-5" />, title: 'שמאי מקרקעין מוסמך', desc: 'מוסמך מטעם מועצת שמאי המקרקעין' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'כלכלן', desc: 'תואר בכלכלה עם התמחות בנדל"ן' },
  { icon: <Building2 className="w-5 h-5" />, title: 'מנהל התחדשות עירונית', desc: 'ניסיון עשיר בליווי פרויקטי פינוי-בינוי ותמ"א 38' },
  { icon: <Shield className="w-5 h-5" />, title: 'בדיקות Due Diligence', desc: 'מאות בדיקות נאותות לרוכשי דירות בהתחדשות עירונית' },
];

const TEAM = [
  { role: 'אדריכלים בכירים', desc: 'צוות אדריכלים מנוסה הבוחן את התוכניות האדריכליות, המפרטים הטכניים ואיכות התכנון של כל פרויקט.', icon: <MapPin className="w-5 h-5" /> },
  { role: 'מתווכים בכירים ומנוסים', desc: 'מתווכים עם ניסיון עשיר בשוק ההתחדשות העירונית, מכירים את השחקנים ויודעים לזהות עסקאות אמיתיות.', icon: <Users className="w-5 h-5" /> },
  { role: 'יועצים משפטיים', desc: 'עורכי דין המתמחים בחוזי התחדשות עירונית, הגנה על זכויות הדיירים וליווי משפטי מקצועי.', icon: <Briefcase className="w-5 h-5" /> },
];

const SERVICES = [
  'בדיקת נאותות (Due Diligence) לרוכשי דירות בפרויקטי התחדשות',
  'ניתוח חוזים מול יזמים — זיהוי סעיפים בעייתיים',
  'הערכת שווי נכסים לפני ואחרי התחדשות',
  'אימות סטטוס תכנוני מול מוסדות התכנון',
  'בדיקת איתנות פיננסית של יזמים',
  'ליווי דיירים בתהליכי משא ומתן מול יזמים',
  'חוות דעת שמאיות לפרויקטי התחדשות',
];

export default function AboutPage() {
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
            <span className="text-foreground-muted text-xs">{'| אודות'}</span>
          </div>
          <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה'}<ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex-1">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden border-3 flex items-center justify-center" style={{ borderColor: 'var(--accent)', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)' }}>
            <span className="text-4xl font-black text-white">{'ח״פ'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{'חיים פיין'}</h1>
          <p className="text-lg text-accent font-semibold mb-2">{'שמאי מקרקעין | כלכלן | מנהל התחדשות עירונית'}</p>
          <p className="text-sm text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {'בעולם שבו כולם מוכרים חלומות, אני מביא את המציאות. עם ניסיון עשיר בשוק הנדל"ן הישראלי ובפרויקטי התחדשות עירונית, אני מספק ללקוחותיי תמונת מצב אמיתית — ללא אג\'נדות, ללא אינטרסים.'}
          </p>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CREDENTIALS.map((c, i) => (
            <div key={i} className="db-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {c.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">{c.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">{'הצוות שלי'}</h2>
            <p className="text-sm text-foreground-muted">{'אני עובד עם צוות מומחים בכירים ומנוסים שמביאים ידע רב-תחומי'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEAM.map((t, i) => (
              <div key={i} className="db-card p-5 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                  {t.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{t.role}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="db-card p-6 mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent" />
            {'שירותים מקצועיים'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SERVICES.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2 text-sm text-foreground-secondary">
                <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Contact + CTA */}
        <div className="db-card-accent p-6 text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">{'בואו נדבר'}</h2>
          <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
            {'פגישת ייעוץ ממוקדת של 45 דקות, בה ננתח את הפרויקט שלכם לעומק — חוזה, מפרט, יזם ותכנון.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Phone className="w-4 h-4 text-green" />
              <span>{'ליצירת קשר ישיר'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Mail className="w-4 h-4 text-green" />
              <span>contact@haim-checkup.co.il</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/booking" className="btn-primary py-3 px-8 rounded-lg text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {'קביעת פגישת ייעוץ'}
              <ChevronLeft className="w-4 h-4" />
            </a>
            <a href="/checkup" className="btn-secondary py-3 px-8 rounded-lg text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {'הפק דוח Reality Check'}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'חיים פיין — שמאי מקרקעין, כלכלן'}</span>
      </div>
    </div>
  );
}

'use client';

import {
  Building2, ArrowRight, Award, Users, Briefcase, Shield, BookOpen,
  ChevronLeft, CalendarDays, MapPin, Phone, Mail, Globe,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

export default function AboutPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const CREDENTIALS = [
    { icon: <Award className="w-5 h-5" />, title: t('שמאי מקרקעין מוסמך', 'Certified Real Estate Appraiser'), desc: t('מוסמך מטעם מועצת שמאי המקרקעין — ניסיון רב בהערכות שווי לפרויקטי התחדשות', 'Certified by the Appraisers Council — extensive renewal project valuation experience') },
    { icon: <BookOpen className="w-5 h-5" />, title: t('כלכלן', 'Economist'), desc: t('התמחות בכלכלת נדל"ן וניתוח כדאיות עסקאות', 'Specializing in real estate economics and deal feasibility analysis') },
    { icon: <Building2 className="w-5 h-5" />, title: t('ניהול התחדשות עירונית', 'Urban Renewal Management'), desc: t('ניסיון עשיר בליווי פרויקטי פינוי-בינוי ותמ"א 38', 'Extensive experience in Pinui-Binui & TAMA 38 projects') },
    { icon: <Shield className="w-5 h-5" />, title: t('בדיקות Due Diligence', 'Due Diligence Reviews'), desc: t('מאות בדיקות נאותות לרוכשי דירות בהתחדשות עירונית', 'Hundreds of due diligence reviews for urban renewal buyers') },
  ];

  const TEAM = [
    { role: t('אדריכלים בכירים', 'Senior Architects'), desc: t('צוות אדריכלים מנוסה הבוחן תוכניות אדריכליות, מפרטים טכניים ואיכות תכנון של כל פרויקט.', 'Experienced team reviewing architectural plans, specs and design quality.'), icon: <MapPin className="w-5 h-5" /> },
    { role: t('מתווכים בכירים ומנוסים', 'Senior Real Estate Brokers'), desc: t('מתווכים עם ניסיון עשיר בשוק ההתחדשות, מכירים את השחקנים ויודעים לזהות עסקאות אמיתיות.', 'Brokers with deep renewal market knowledge — know the players and real deals.'), icon: <Users className="w-5 h-5" /> },
    { role: t('יועצים משפטיים', 'Legal Advisors'), desc: t('עורכי דין המתמחים בחוזי התחדשות עירונית, הגנה על זכויות דיירים וליווי משפטי מקצועי.', 'Lawyers specializing in renewal contracts and tenant rights protection.'), icon: <Briefcase className="w-5 h-5" /> },
  ];

  const SERVICES = [
    t('בדיקת נאותות (Due Diligence) לרוכשי דירות בפרויקטי התחדשות', 'Due diligence for apartment buyers in renewal projects'),
    t('ניתוח חוזים מול יזמים — זיהוי סעיפים בעייתיים', 'Contract analysis vs. developers — identifying problematic clauses'),
    t('הערכת שווי נכסים לפני ואחרי התחדשות', 'Property valuation before and after renewal'),
    t('אימות סטטוס תכנוני מול מוסדות התכנון', 'Planning status verification with authorities'),
    t('בדיקת איתנות פיננסית של יזמים', 'Developer financial stability checks'),
    t('ליווי דיירים בתהליכי משא ומתן מול יזמים', 'Tenant guidance in developer negotiations'),
    t('חוות דעת שמאיות לפרויקטי התחדשות', 'Appraisal opinions for renewal projects'),
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
            <span className="text-foreground-muted text-xs">{t('| אודות', '| About')}</span>
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex-1">
        {/* Hero — No name, just who we are */}
        <div className="text-center mb-12">
          <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden border-3 flex items-center justify-center" style={{ borderColor: 'var(--accent)', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)' }}>
            <span className="text-4xl font-black text-white">{t('RC', 'RC')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('מי אנחנו', 'Who We Are')}</h1>
          <p className="text-lg text-accent font-semibold mb-2">{t('שמאות מקרקעין | כלכלה | התחדשות עירונית', 'Real Estate Appraisal | Economics | Urban Renewal')}</p>
          <p className="text-base text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            {t(
              'בעולם שבו כולם מוכרים חלומות, אנחנו מביאים את המציאות. עם ניסיון עשיר בשוק הנדל"ן הישראלי ובפרויקטי התחדשות עירונית, אנחנו מספקים ללקוחותינו תמונת מצב אמיתית — ללא אג\'נדות, ללא אינטרסים.',
              'In a world where everyone sells dreams, we bring reality. With extensive experience in Israeli real estate and urban renewal, we provide clients with a true picture — no agendas, no hidden interests.'
            )}
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
            <h2 className="text-xl font-bold text-foreground mb-2">{t('הצוות', 'The Team')}</h2>
            <p className="text-sm text-foreground-muted">{t('צוות מומחים בכירים ומנוסים עם ידע רב-תחומי', 'Senior experts with multi-disciplinary knowledge')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEAM.map((tm, i) => (
              <div key={i} className="db-card p-5 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                  {tm.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{tm.role}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{tm.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="db-card p-6 mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent" />
            {t('שירותים מקצועיים', 'Professional Services')}
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
          <h2 className="text-xl font-bold text-foreground mb-3">{t('בואו נדבר', "Let's Talk")}</h2>
          <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
            {t(
              'פגישת ייעוץ ממוקדת של 45 דקות, בה ננתח את הפרויקט שלכם לעומק — חוזה, מפרט, יזם ותכנון.',
              'A focused 45-minute consultation analyzing your project in depth — contract, specs, developer and planning.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Phone className="w-4 h-4 text-green" />
              <span>{t('ליצירת קשר ישיר', 'Direct Contact')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Mail className="w-4 h-4 text-green" />
              <span>contact@therealitycheck.co.il</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/checkup" className="btn-primary py-3 px-8 rounded-lg text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('הפק דוח Reality Check', 'Generate Reality Check')}
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('שמאות מקרקעין | כלכלה | התחדשות עירונית', 'Real Estate Appraisal | Economics | Urban Renewal')}</span>
      </div>
    </div>
  );
}

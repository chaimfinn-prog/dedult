'use client';

import {
  Building2, ArrowRight, Shield, Globe, Users, Briefcase,
  Award, BookOpen, MapPin, Eye, Scale, HardHat, Phone, Mail,
  ChevronLeft, CalendarDays,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

export default function AboutPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const TEAM_SECTIONS = [
    {
      icon: <Award className="w-6 h-6" />,
      title: t('שמאי מקרקעין וכלכלנים בכירים', 'Senior Appraisers & Economists'),
      desc: t(
        'העיניים הכלכליות של הפרויקט. מומחים בניתוח דוחות אפס, תקני שמאות מחמירים (תקינה 21), וזיהוי "בורות" תקציביים שיזמים נוטים להסתיר. אנחנו יודעים כמה הדירה שווה באמת — היום, ובעוד עשור.',
        'The economic eyes of the project. Experts in feasibility reports, strict appraisal standards (Standard 21), and identifying budget traps developers hide. We know what the apartment is really worth — today and in a decade.'
      ),
      color: 'var(--accent)',
    },
    {
      icon: <HardHat className="w-6 h-6" />,
      title: t('אדריכלים ומתכנני ערים', 'Architects & Urban Planners'),
      desc: t(
        'האנשים שרואים דרך הקירות. אדריכלים בכירים שבוחנים את היתכנות התכנון מעבר להדמיות היפות. אנחנו מזהים מראש כשלים תכנוניים, חריגות בנייה פוטנציאליות ובעיות רישוי שיכולות לתקוע פרויקט שנים בוועדות.',
        'The people who see through walls. Senior architects examining planning feasibility beyond beautiful renders. We identify planning failures, potential building violations, and licensing issues that can stall projects for years.'
      ),
      color: 'var(--green)',
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: t('משפטנים מומחי התחדשות עירונית', 'Urban Renewal Legal Experts'),
      desc: t(
        'השכפ"ץ המשפטי שלכם. עורכי דין שחיים את בתי המשפט ואת האותיות הקטנות בחוזי המכר והפינוי-בינוי. אנחנו מזהים את הסעיפים הדרקוניים ומבטיחים שהזכויות שלכם מוגנות בברזל, לא רק על הנייר.',
        'Your legal armor. Lawyers who live in courtrooms and fine print of sale and renewal contracts. We identify draconian clauses and ensure your rights are protected in steel, not just on paper.'
      ),
      color: 'var(--gold)',
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: t('אנשי שטח ומתווכים ותיקים', 'Field Experts & Senior Brokers'),
      desc: t(
        'החיבור למציאות. בעוד שהדוחות מדברים במספרים, אנשי השטח שלנו מכירים את הרחוב. אנחנו יודעים איזה יזם באמת מסיים פרויקטים, איזה בניין הוא "מוקש", ומה באמת קורה בשטח כשהדחפורים עולים (או לא עולים) על הקרקע.',
        'The reality connection. While reports speak in numbers, our field agents know the street. We know which developer actually finishes projects, which building is a "landmine", and what really happens when bulldozers arrive (or don\'t).'
      ),
      color: 'var(--teal)',
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
            <span className="font-bold text-sm">PROPCHECK</span>
            <span className="text-foreground-muted text-xs">{t('| הנבחרת', '| The Team')}</span>
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

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden border-3 flex items-center justify-center" style={{ borderColor: 'var(--accent)', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)' }}>
            <span className="text-3xl font-black text-white">PC</span>
          </div>
          <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">PROPCHECK</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('הנבחרת', 'The Task Force')}</h1>
          <p className="text-base text-accent font-semibold mb-4">{t('הנבחרת המקצועית שעומדת לצידכם', 'The Professional Team on Your Side')}</p>
        </div>

        {/* Who We Are */}
        <div className="db-card p-8 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('מי אנחנו?', 'Who Are We?')}</h2>
          <div className="space-y-4 text-base text-foreground-secondary leading-relaxed">
            <p>
              {t(
                'בעולם שמונע מאינטרסים, עמלות והבטחות שיווקיות, הקמנו את PROPCHECK מתוך תחושת שליחות אמיתית וצורך בוער בשטח. ראינו יותר מדי רוכשים, משקיעים ובעלי דירות הולכים שבי אחרי מצגות נוצצות, כשהפער בינן לבין המציאות התכנונית והכלכלית הוא עצום — ולעיתים הרסני.',
                'In a world driven by commissions and marketing promises, we founded PROPCHECK from a genuine sense of mission. We\'ve seen too many buyers and investors captivated by flashy presentations, when the gap between them and planning/economic reality is enormous — and sometimes devastating.'
              )}
            </p>
            <p>
              {t(
                'אנחנו לא "יועצים" רגילים. אנחנו איחוד כוחות נדיר של בכירי המומחים במשק הישראלי. חיברנו סביב שולחן אחד את השמות המנוסים ביותר: שמאי מקרקעין, אדריכלים, עורכי דין, כלכלנים ומתווכי-שטח ותיקים. כל אחד מאיתנו חי ונושם את התחום שלו עשרות שנים, וכולנו התאגדנו למטרה אחת: לנטרל את רעשי הרקע, לפרק את המוקשים, ולתת לכם את האמת הטהורה — גם כשהיא לא נעימה.',
                'We\'re not ordinary "consultants." We\'re a rare union of Israel\'s top experts. We\'ve brought the most experienced names around one table: appraisers, architects, lawyers, economists and veteran field brokers. Each of us has lived and breathed our field for decades, united for one purpose: to cut through the noise, defuse the landmines, and give you the pure truth — even when it\'s uncomfortable.'
              )}
            </p>
            <p className="text-foreground font-semibold">
              {t(
                'זה בדמנו. אנחנו כאן כדי לוודא שאף אחד לא יקנה חלום וישאר עם שברון לב.',
                'It\'s in our blood. We\'re here to make sure nobody buys a dream and ends up heartbroken.'
              )}
            </p>
          </div>
        </div>

        {/* Professional Power */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">{t('הכוח המקצועי שלנו', 'Our Professional Power')}</h2>
            <p className="text-sm text-foreground-muted">
              {t(
                'הצוות שלנו מורכב מאנשי מקצוע שבדקו, ליוו ואישרו פרויקטים בהיקפים של מיליארדי שקלים. הניסיון המצטבר שלנו הוא תעודת הביטוח שלכם.',
                'Our team consists of professionals who reviewed, managed and approved projects worth billions. Our combined experience is your insurance policy.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TEAM_SECTIONS.map((section, i) => (
              <div key={i} className="db-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${section.color} 15%, transparent)`, color: section.color }}>
                    {section.icon}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                </div>
                <p className="text-sm text-foreground-muted leading-relaxed">{section.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div className="db-card-accent p-8 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            {t('המניע שלנו', 'Our Motivation')}
          </h2>
          <div className="text-base text-foreground-secondary leading-relaxed space-y-3">
            <p>
              {t(
                'אנחנו לא מוכרים דירות. אנחנו לא משווקים פרויקטים. אנחנו לא מקבלים עמלות מיזמים. הנאמנות שלנו היא אליכם בלבד.',
                'We don\'t sell apartments. We don\'t market projects. We don\'t take commissions from developers. Our loyalty is to you alone.'
              )}
            </p>
            <p>
              {t(
                'השילוב בין הידע השמאי, החדות המשפטית והראייה האדריכלית, מאפשר לנו לתת לכם את המוצר היקר ביותר בשוק הנדל"ן של היום: וודאות.',
                'The combination of appraisal knowledge, legal precision and architectural vision allows us to give you the most valuable product in today\'s real estate market: certainty.'
              )}
            </p>
          </div>
        </div>

        {/* Tagline + CTA */}
        <div className="db-card-green p-8 text-center mb-8">
          <div className="text-xs font-bold text-green uppercase tracking-[0.2em] mb-3">PROPCHECK</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t('אנחנו בודקים. אתם ישנים בשקט.', 'We check. You sleep soundly.')}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <a href="/checkup" className="btn-primary py-3 px-8 rounded-lg text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('הפק דוח PROPCHECK', 'Generate PROPCHECK Report')}
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="db-card p-6 text-center">
          <h2 className="text-lg font-bold text-foreground mb-3">{t('בואו נדבר', "Let's Talk")}</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-foreground-muted">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green" />{t('ליצירת קשר ישיר', 'Direct Contact')}</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-green" />contact@therealitycheck.co.il</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('אנחנו בודקים. אתם ישנים בשקט.', 'We check. You sleep soundly.')}</span>
      </div>
    </div>
  );
}

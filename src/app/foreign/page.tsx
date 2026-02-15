'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Globe, PlayCircle } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Country } from '@/domain/enums/Country';

type LocalizedText = { he: string; en: string };

type RiskSlide = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  bullets: LocalizedText[];
  video: string;
};

const COUNTRY_RISK_SLIDES: Record<Country, RiskSlide[]> = {
  [Country.CYPRUS]: [
    {
      id: 'cyprus-closed-market',
      title: { he: 'שוק סגור למשקיעים ישראלים', en: 'Closed Israeli-focused sub-market' },
      description: {
        he: 'כשפרויקט משווק כמעט רק לישראלים, היציאה תלויה בגל משקיעים דומה ולא בביקוש מקומי טבעי.',
        en: 'When a project is marketed mostly to Israelis, exits depend on similar investor waves rather than natural local demand.',
      },
      bullets: [
        { he: 'סיכון נזילות במכירה מחדש.', en: 'Higher resale liquidity risk.' },
        { he: 'פער תמחור מול שוק מקומי.', en: 'Potential pricing gap from local market.' },
        { he: 'רגישות גבוהה לשינויי סנטימנט.', en: 'High sensitivity to sentiment shifts.' },
      ],
      video: 'https://videos.pexels.com/video-files/7578552/7578552-hd_1920_1080_30fps.mp4',
    },
    {
      id: 'cyprus-regulatory',
      title: { he: 'סיכון רגולטורי', en: 'Regulatory uncertainty' },
      description: {
        he: 'רגולציה משתנה לגבי רוכשים זרים יכולה להשפיע על היקף הרכישה, זכאות ותנאי שוק.',
        en: 'Evolving foreign-buyer regulation can affect purchase scope, eligibility and market conditions.',
      },
      bullets: [
        { he: 'מגבלות אפשריות על מספר יחידות.', en: 'Possible limits on number of units.' },
        { he: 'מגבלות גודל/מיקום.', en: 'Potential size/location restrictions.' },
        { he: 'צורך בבדיקת עדכון רגולציה שוטפת.', en: 'Need continuous legal updates.' },
      ],
      video: 'https://videos.pexels.com/video-files/8730837/8730837-hd_1920_1080_25fps.mp4',
    },
    {
      id: 'cyprus-operations',
      title: { he: 'ניהול מרחוק ושחיקת תשואה', en: 'Remote management and yield erosion' },
      description: {
        he: 'ניהול נכס מרחוק, תחזוקה וחברת ניהול יכולים לשחוק משמעותית את הנטו בפועל.',
        en: 'Remote operations, maintenance and management fees can materially erode net returns.',
      },
      bullets: [
        { he: 'דמי ניהול גבוהים בהשכרה קצרה.', en: 'Higher management fees for short-term rentals.' },
        { he: 'עלויות ועד בית ותחזוקה שנתית.', en: 'Annual HOA and maintenance costs.' },
        { he: 'פער בין תשואת ברוטו לנטו.', en: 'Meaningful gross-to-net gap.' },
      ],
      video: 'https://videos.pexels.com/video-files/7656928/7656928-hd_1920_1080_24fps.mp4',
    },
  ],
  [Country.GREECE]: [
    {
      id: 'greece-title',
      title: { he: 'סיכוני רישום וזכויות', en: 'Title and registry risks' },
      description: {
        he: 'בחלק מהעסקאות קיימים פערי רישום, עיקולים סמויים או חריגות בנייה שלא הוסדרו.',
        en: 'Some deals include registry gaps, hidden liens, or unresolved building deviations.',
      },
      bullets: [
        { he: 'נדרש עו״ד מקומי בלתי תלוי.', en: 'Independent local legal review is essential.' },
        { he: 'חובה לבדוק נסח/רישום מלא.', en: 'Full registry/title extraction required.' },
        { he: 'בדיקת התאמה הנדסית לנכס.', en: 'Engineering compliance check is critical.' },
      ],
      video: 'https://videos.pexels.com/video-files/7195341/7195341-hd_1920_1080_25fps.mp4',
    },
    {
      id: 'greece-bureaucracy',
      title: { he: 'מורכבות בירוקרטית', en: 'Bureaucratic complexity' },
      description: {
        he: 'תהליכי קנייה, רישום והשלמה מערבים מספר גורמים ועלולים להתארך.',
        en: 'Purchase, registration and closing involve multiple actors and can be delayed.',
      },
      bullets: [
        { he: 'עו״ד + נוטריון + מהנדס – כולם חשובים.', en: 'Lawyer + notary + engineer are all key.' },
        { he: 'שלבי אישור עם תלות ברשויות.', en: 'Approval stages depend on authorities.' },
        { he: 'זמן סגירה עלול להתארך.', en: 'Closing timeline may stretch.' },
      ],
      video: 'https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_24fps.mp4',
    },
    {
      id: 'greece-exit',
      title: { he: 'סיכון נזילות ביציאה', en: 'Exit liquidity risk' },
      description: {
        he: 'תנאי שוק, דמוגרפיה וספי כניסה למשקיעים זרים יכולים להשפיע על קצב המכירה בעתיד.',
        en: 'Market conditions, demographics and foreign-investor thresholds can impact future exit pace.',
      },
      bullets: [
        { he: 'ביקוש לא אחיד בין אזורים.', en: 'Demand is uneven across locations.' },
        { he: 'רגישות למחזוריות תיירותית.', en: 'Sensitive to tourism cycles.' },
        { he: 'היצע מתחרה פוגע במהירות מכירה.', en: 'Competing supply may slow resale.' },
      ],
      video: 'https://videos.pexels.com/video-files/5804040/5804040-hd_1920_1080_25fps.mp4',
    },
  ],
  [Country.NORTH_CYPRUS]: [
    {
      id: 'north-cyprus-legal',
      title: { he: 'סיכון משפטי חמור', en: 'Severe legal risk' },
      description: {
        he: 'ברכישה בצפון קפריסין קיימים סיכונים משפטיים מהותיים סביב זכויות בעלות והכרה בינלאומית.',
        en: 'North Cyprus acquisitions carry substantial legal exposure around ownership rights and recognition.',
      },
      bullets: [
        { he: 'סיכון לבעלות שאינה מוכרת בינלאומית.', en: 'Risk of internationally disputed title.' },
        { he: 'חשיפה למחלוקות בעלות עתידיות.', en: 'Exposure to future ownership disputes.' },
        { he: 'מורכבות משפטית חוצת מדינות.', en: 'Cross-border legal complexity.' },
      ],
      video: 'https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_25fps.mp4',
    },
    {
      id: 'north-cyprus-finance',
      title: { he: 'סיכון פיננסי ונזילות', en: 'Financial and liquidity risk' },
      description: {
        he: 'מימון, ביטוח ואפשרויות יציאה מוגבלות משמעותית ביחס לשווקים מוכרים.',
        en: 'Financing, insurance and exit options are materially weaker than recognized markets.',
      },
      bullets: [
        { he: 'נגישות מוגבלת למימון בנקאי.', en: 'Limited access to mainstream bank financing.' },
        { he: 'ביטוח מורכב או יקר.', en: 'Insurance may be limited or expensive.' },
        { he: 'קושי במימוש מהיר במכירה.', en: 'Fast exit can be difficult.' },
      ],
      video: 'https://videos.pexels.com/video-files/7578815/7578815-hd_1920_1080_30fps.mp4',
    },
  ],
};

export default function ForeignPurchasePage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);

  const [country, setCountry] = useState<Country>(Country.CYPRUS);
  const [started, setStarted] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => COUNTRY_RISK_SLIDES[country], [country]);
  const activeSlide = slides[slideIndex];


  useEffect(() => {
    if (!started || slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [started, slides.length]);

  const next = () => setSlideIndex((current) => (current + 1) % slides.length);
  const prev = () => setSlideIndex((current) => (current - 1 + slides.length) % slides.length);

  if (!started) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <section className="w-full max-w-xl db-card p-8 text-center">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-sm text-foreground-muted hover:text-foreground inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              {t('חזרה לדף הבית', 'Back to Home')}
            </Link>
            <button onClick={toggle} className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1 bg-transparent border-0">
              <Globe className="w-4 h-4" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-3">{t('דוח סיכונים בהשקעה בחו״ל', 'Foreign Investment Risk Report')}</h1>
          <p className="text-sm text-foreground-muted mb-6">
            {t('בחר/י מדינה וקבל/י דוח ברור של כל הסיכונים המרכזיים — בפורמט מצגת מונפשת.', 'Choose a country and get a clear slide-style report of the key risks.')}
          </p>

          <label className="block text-start text-sm mb-4">
            {t('באיזו מדינה ההשקעה?', 'Which country is the investment in?')}
            <select
              className="w-full mt-2 p-3 rounded-lg bg-black/20 border border-white/10"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value as Country);
                setSlideIndex(0);
              }}
            >
              <option value={Country.CYPRUS}>{t('קפריסין', 'Cyprus')}</option>
              <option value={Country.GREECE}>{t('יוון', 'Greece')}</option>
              <option value={Country.NORTH_CYPRUS}>{t('צפון קפריסין', 'North Cyprus')}</option>
            </select>
          </label>

          <button onClick={() => setStarted(true)} className="btn-green w-full h-12 rounded-xl inline-flex items-center justify-center gap-2">
            <PlayCircle className="w-4 h-4" />
            {t('הצג דוח סיכונים', 'Show Risk Report')}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.video
          key={activeSlide.id}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <source src={activeSlide.video} type="video/mp4" />
        </motion.video>
      </AnimatePresence>

      <div className="absolute inset-0 bg-black/65" />

      <section className="relative z-10 min-h-screen max-w-5xl mx-auto px-6 py-8 flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <Link href="/foreign" onClick={() => setStarted(false)} className="text-sm text-foreground-muted hover:text-foreground inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            {t('בחירת מדינה מחדש', 'Choose Country Again')}
          </Link>

          <div className="flex items-center gap-3">
            <button onClick={toggle} className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1 bg-transparent border-0">
              <Globe className="w-4 h-4" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <span className="text-xs px-3 py-1 rounded-full border border-white/20">
              {t('דוח סיכונים בלבד', 'Risk report only')}
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.article
            key={activeSlide.id + lang}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="db-card p-8 backdrop-blur-md bg-[rgba(0,0,0,0.45)] border border-white/20"
          >
            <p className="text-xs text-foreground-muted mb-2">
              {t('שקופית', 'Slide')} {slideIndex + 1} / {slides.length}
            </p>
            <h2 className="text-3xl font-bold mb-3">{activeSlide.title[lang]}</h2>
            <p className="text-lg text-foreground-muted mb-6">{activeSlide.description[lang]}</p>

            <ul className="space-y-3">
              {activeSlide.bullets.map((bullet) => (
                <li key={bullet.he} className="p-4 rounded-xl bg-black/35 border border-white/10">
                  {bullet[lang]}
                </li>
              ))}
            </ul>
          </motion.article>
        </AnimatePresence>

        <footer className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === slideIndex ? 'w-8 bg-green' : 'w-2 bg-white/40'}`}
                aria-label={`slide-${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={prev} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
              {t('הקודם', 'Previous')}
            </button>
            <button onClick={next} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
              {t('הבא', 'Next')}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}

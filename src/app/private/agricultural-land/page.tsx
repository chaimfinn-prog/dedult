'use client';

import { Building2, Globe, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function AgriculturalLandPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="border-b border-[var(--border)] sticky top-0 z-10" style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">{t('| קרקע חקלאית', '| Agricultural Land')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/private" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ChevronLeft className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full rounded-2xl p-8 md:p-10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(248,81,73,0.15)', border: '1px solid rgba(248,81,73,0.3)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f85149' }} />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('קרקע חקלאית — הכוונה', 'Agricultural Land — Orientation')}</h1>
          </div>

          <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {t(
                'מסך זה מספק הכוונה בלבד. אין פלטים פיננסיים ללא נתונים מאומתים.',
                'This screen provides orientation only. No financial outputs are generated without verified data.'
              )}
            </p>
          </div>

          <div className="space-y-4 text-sm text-foreground-muted leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t('סיכונים מרכזיים', 'Key Risks')}</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('קרקע חקלאית אינה מאושרת לבנייה — שינוי ייעוד לוקח שנים ואינו מובטח', 'Agricultural land is not approved for construction — rezoning takes years and is not guaranteed')}</li>
                <li>{t('עסקאות בקרקע חקלאית הן ספקולטיביות מטבען', 'Agricultural land transactions are speculative by nature')}</li>
                <li>{t('אין ערבות שהקרקע תשנה ייעוד — גם אם המשווק מציג זאת כוודאי', 'There is no guarantee of rezoning — even if the marketer presents it as certain')}</li>
                <li>{t('עלויות פיתוח ותשתית נוספות נדרשות גם לאחר שינוי ייעוד', 'Additional development and infrastructure costs are required even after rezoning')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">{t('מה לבדוק לפני רכישה', 'What to Check Before Purchase')}</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('תוכניות מתאר ארציות ומחוזיות באזור — באתר iplan.gov.il', 'National and district outline plans in the area — at iplan.gov.il')}</li>
                <li>{t('ועדה מחוזית — האם יש הליך פעיל לשינוי ייעוד', 'District committee — is there an active rezoning process')}</li>
                <li>{t('בעלות — נסח טאבו או אישור רמ"י', 'Ownership — Tabu extract or ILA certificate')}</li>
                <li>{t('ייעוץ עם שמאי מקרקעין ועורך דין', 'Consult with a real estate appraiser and attorney')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

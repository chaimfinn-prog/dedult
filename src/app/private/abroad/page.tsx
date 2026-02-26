'use client';

import { Building2, Globe, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function AbroadPage() {
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
            <span className="text-foreground-muted text-xs">{t('| רכישה בחו"ל', '| Foreign Property')}</span>
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(210,153,34,0.15)', border: '1px solid rgba(210,153,34,0.3)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#d29922' }} />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('רכישה בחו"ל — הכוונה', 'Foreign Property — Orientation')}</h1>
          </div>

          <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)' }}>
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
                <li>{t('סיכון מדינה — יציבות פוליטית, חקיקה משתנה, מגבלות על זרים', 'Country risk — political stability, changing legislation, restrictions on foreigners')}</li>
                <li>{t('מיסוי כפול — ישראל + מדינת היעד. יש לבדוק אמנות מס', 'Double taxation — Israel + target country. Check tax treaties')}</li>
                <li>{t('עלויות ניהול מרחוק — אחזקה, ניהול שוכרים, ביטוח', 'Remote management costs — maintenance, tenant management, insurance')}</li>
                <li>{t('סיכון מטבע — תנודות בשער החליפין', 'Currency risk — exchange rate fluctuations')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">{t('מה לבדוק', 'What to Check')}</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('אמנת מס בין ישראל למדינת היעד', 'Tax treaty between Israel and target country')}</li>
                <li>{t('חובות דיווח לרשות המסים בישראל', 'Reporting obligations to Israel Tax Authority')}</li>
                <li>{t('הגבלות על רכישה ע"י זרים במדינת היעד', 'Foreign ownership restrictions in target country')}</li>
                <li>{t('ייעוץ עם רו"ח ועו"ד המתמחים בנדל"ן בינלאומי', 'Consult accountant and lawyer specializing in international real estate')}</li>
              </ul>
            </div>

            <div className="pt-4">
              <a href="/foreign" className="text-xs font-medium hover:underline" style={{ color: '#d29922' }}>
                {t('→ עבור לכלי סיכון מדינה', '→ Go to Country Risk Tool')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

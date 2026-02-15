'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, ShieldAlert } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Country } from '@/domain/enums/Country';

type TaxRoute = 'FLAT_15' | 'MARGINAL';

interface RiskFactorView {
  id: string;
  category: string;
  severity: number;
  title: string;
  description: string;
}

interface RiskResponse {
  overallScore: number;
  factors: RiskFactorView[];
  warnings?: string[];
}

export default function ForeignPurchasePage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);

  const [country, setCountry] = useState<Country>(Country.CYPRUS);
  const [priceEur, setPriceEur] = useState(250000);
  const [grossYieldPct, setGrossYieldPct] = useState(7.5);
  const [rentalMode, setRentalMode] = useState<'LONG_TERM' | 'AIRBNB'>('AIRBNB');
  const [viaCompany, setViaCompany] = useState(true);
  const [isIsraeliOnlyProject, setIsIsraeliOnlyProject] = useState(true);
  const [isNorthCyprus, setIsNorthCyprus] = useState(false);
  const [usesCyprus60DayRule, setUsesCyprus60DayRule] = useState(false);
  const [taxRoute, setTaxRoute] = useState<TaxRoute>('MARGINAL');
  const [holdsViaForeignCompany, setHoldsViaForeignCompany] = useState(false);
  const [foreignCompanyIsCfc, setForeignCompanyIsCfc] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<RiskResponse | null>(null);

  const normalizedNorthCyprus = useMemo(
    () => isNorthCyprus || country === Country.NORTH_CYPRUS,
    [country, isNorthCyprus],
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/risk/evaluate?locale=${lang}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            country,
            priceEur,
            grossYieldPct,
            rentalMode,
            viaCompany,
            isIsraeliOnlyProject,
            isNorthCyprus: normalizedNorthCyprus,
            usesCyprus60DayRule,
          },
          israelTax: {
            taxRoute,
            holdsViaForeignCompany,
            foreignCompanyIsCfc,
          },
        }),
      });

      const json = (await response.json()) as RiskResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? t('אירעה שגיאה בחישוב.', 'Failed to evaluate risk.'));
      }

      setReport(json);
    } catch (submitError) {
      setReport(null);
      setError(submitError instanceof Error ? submitError.message : t('שגיאה לא ידועה.', 'Unknown error.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="text-sm text-foreground-muted hover:text-foreground flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          {t('חזרה לדף הבית', 'Back to Home')}
        </Link>
        <button onClick={toggle} className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 bg-transparent border-0">
          <Globe className="w-4 h-4" />
          {lang === 'he' ? 'EN' : 'עב'}
        </button>
      </header>

      <section className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={onSubmit} className="db-card p-6 space-y-4">
          <h1 className="text-2xl font-bold">{t('רכישת דירה מחו״ל — בדיקת סיכונים', 'Foreign Apartment Purchase — Risk Check')}</h1>
          <p className="text-sm text-foreground-muted">
            {t('מלא/י את הפרופיל וקבל/י ציון סיכון וניתוח גורמים מרכזיים.', 'Fill profile data to get a risk score and key risk factors.')}
          </p>

          <label className="block text-sm">
            {t('מדינה', 'Country')}
            <select className="w-full mt-1 p-2 rounded-lg bg-black/20 border border-white/10" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
              <option value={Country.CYPRUS}>{t('קפריסין', 'Cyprus')}</option>
              <option value={Country.GREECE}>{t('יוון', 'Greece')}</option>
              <option value={Country.NORTH_CYPRUS}>{t('צפון קפריסין', 'North Cyprus')}</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              {t('מחיר (EUR)', 'Price (EUR)')}
              <input className="w-full mt-1 p-2 rounded-lg bg-black/20 border border-white/10" type="number" min={1} value={priceEur} onChange={(e) => setPriceEur(Number(e.target.value))} />
            </label>
            <label className="text-sm">
              {t('תשואה גולמית (%)', 'Gross Yield (%)')}
              <input className="w-full mt-1 p-2 rounded-lg bg-black/20 border border-white/10" type="number" min={0} max={30} step="0.1" value={grossYieldPct} onChange={(e) => setGrossYieldPct(Number(e.target.value))} />
            </label>
          </div>

          <label className="block text-sm">
            {t('מצב השכרה', 'Rental Mode')}
            <select className="w-full mt-1 p-2 rounded-lg bg-black/20 border border-white/10" value={rentalMode} onChange={(e) => setRentalMode(e.target.value as 'LONG_TERM' | 'AIRBNB')}>
              <option value="LONG_TERM">{t('לטווח ארוך', 'Long Term')}</option>
              <option value="AIRBNB">Airbnb</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={viaCompany} onChange={(e) => setViaCompany(e.target.checked)} />
              {t('דרך חברה', 'Via company')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isIsraeliOnlyProject} onChange={(e) => setIsIsraeliOnlyProject(e.target.checked)} />
              {t('פרויקט ישראלי סגור', 'Israeli-only project')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNorthCyprus} onChange={(e) => setIsNorthCyprus(e.target.checked)} />
              {t('השקעה בצפון קפריסין', 'North Cyprus exposure')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={usesCyprus60DayRule} onChange={(e) => setUsesCyprus60DayRule(e.target.checked)} />
              {t('שימוש בכלל 60 יום', 'Using 60-day rule')}
            </label>
          </div>

          <label className="block text-sm">
            {t('מסלול מס ישראלי', 'Israel tax route')}
            <select className="w-full mt-1 p-2 rounded-lg bg-black/20 border border-white/10" value={taxRoute} onChange={(e) => setTaxRoute(e.target.value as TaxRoute)}>
              <option value="MARGINAL">{t('מסלול שולי', 'Marginal')}</option>
              <option value="FLAT_15">{t('15% קבוע', 'Flat 15%')}</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={holdsViaForeignCompany} onChange={(e) => setHoldsViaForeignCompany(e.target.checked)} />
              {t('החזקה דרך חברה זרה', 'Hold via foreign company')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={foreignCompanyIsCfc} onChange={(e) => setForeignCompanyIsCfc(e.target.checked)} />
              {t('החברה מוגדרת CFC', 'Foreign company is CFC')}
            </label>
          </div>

          <button disabled={loading} className="btn-green w-full h-12 rounded-xl disabled:opacity-60">
            {loading ? t('מחשב...', 'Calculating...') : t('חשב סיכונים', 'Evaluate Risks')}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>

        <section className="db-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('תוצאות ניתוח', 'Analysis Result')}</h2>

          {!report && (
            <p className="text-sm text-foreground-muted">
              {t('לאחר חישוב יוצגו כאן ציון הסיכון והגורמים המרכזיים.', 'Run evaluation to view score and detailed risk factors here.')}
            </p>
          )}

          {report && (
            <>
              <div className="rounded-xl border border-white/10 p-4 bg-black/20">
                <p className="text-sm text-foreground-muted">{t('ציון סיכון כולל', 'Overall Risk Score')}</p>
                <p className="text-4xl font-bold">{report.overallScore}/100</p>
              </div>

              {report.warnings?.length ? (
                <div className="rounded-xl border border-amber-500/30 p-4 bg-amber-500/5 text-sm">
                  {report.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}

              <div className="space-y-3 max-h-[55vh] overflow-auto pr-1">
                {report.factors.map((factor) => (
                  <article key={factor.id} className="rounded-xl border border-white/10 p-4 bg-black/20">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{factor.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300">
                        {t('חומרה', 'Severity')}: {factor.severity}/5
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">{factor.description}</p>
                    <p className="text-xs text-foreground-muted mt-2">{t('קטגוריה', 'Category')}: {factor.category}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="text-xs text-foreground-muted flex items-center gap-2 pt-2">
            <ShieldAlert className="w-4 h-4" />
            {t('הפלט אינפורמטיבי בלבד ואינו ייעוץ משפטי/מס.', 'Output is informational only and not legal/tax advice.')}
          </div>
        </section>
      </section>
    </main>
  );
}

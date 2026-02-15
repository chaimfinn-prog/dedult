'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, AlertTriangle, CheckCircle2, Info, SlidersHorizontal } from 'lucide-react';
import { runFeasibility } from '@/lib/finance/simulation';
import type { FeasibilityInputs } from '@/lib/finance/types';

const DEFAULTS_2026 = {
  primeRateAnnualPct: 5.5,
  fixedRateAnnualPct: 4.9,
  annualConstructionIndexPct: 2.2,
  vatPct: 18,
};

const baseInputs: FeasibilityInputs = {
  contractPriceNis: 3_200_000,
  buyerStatus: 'single_home_resident',
  resident: true,
  propertyType: 'new_from_developer',
  legalFeeNis: 18_000,
  brokerFeeNis: 32_000,

  downPaymentPct: 30,
  additionalSecuredDebtNis: 0,
  loanPurpose: 'single_home',
  borrowerMonthlyDisposableIncomeNis: 28_000,
  mortgageYears: 25,

  fixedRateAnnualPct: DEFAULTS_2026.fixedRateAnnualPct,
  primeRateAnnualPct: DEFAULTS_2026.primeRateAnnualPct,
  variableIndexedAnnualPct: 4.3,

  annualConstructionIndexPct: DEFAULTS_2026.annualConstructionIndexPct,
  paymentSchedule: [
    { date: '2026-01-15', amountNis: 640_000 },
    { date: '2026-08-15', amountNis: 960_000 },
    { date: '2027-04-15', amountNis: 960_000 },
    { date: '2027-12-15', amountNis: 640_000 },
  ],
  contractualDeliveryDate: '2028-01-31',

  monthlyRentNis: 9_500,
  rentalTrack: 'flat10',
  marginalTaxRatePct: 35,
  deductibleExpensesAnnualNis: 24_000,

  managementFeePct: 9,
  annualArnonaNis: 9_600,
  vacancyPct: 4,
  repairReservePct: 1,

  distanceToTransitMeters: 420,
  annualAppreciationPct: 3,
};

const fmt = (v: number) => Math.round(v).toLocaleString('he-IL');

type ToggleOption<T extends string> = { value: T; label: string };

function ToggleCards<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: ToggleOption<T>[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl p-3 text-sm border transition ${
              active ? 'border-green-400 bg-green-500/10 text-white' : 'border-white/15 bg-black/15 text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FeasibilityPage() {
  const [inputs, setInputs] = useState<FeasibilityInputs>(baseInputs);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const result = useMemo(() => runFeasibility(inputs), [inputs]);

  const setNum = (key: keyof FeasibilityInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const setBuyerMode = (mode: 'first_home' | 'investor') => {
    setInputs((prev) => ({
      ...prev,
      buyerStatus: mode === 'first_home' ? 'single_home_resident' : 'investor_resident',
      loanPurpose: mode === 'first_home' ? 'single_home' : 'investment',
    }));
  };

  const setPropertyMode = (mode: 'new' | 'second') => {
    setInputs((prev) => ({
      ...prev,
      propertyType: mode === 'new' ? 'new_from_developer' : 'second_hand',
    }));
  };

  const buyerMode = inputs.buyerStatus === 'single_home_resident' ? 'first_home' : 'investor';
  const propertyMode = inputs.propertyType === 'new_from_developer' ? 'new' : 'second';

  return (
    <div className="min-h-screen px-6 py-10 bg-[#0a0f1d] text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calculator className="w-7 h-7 text-green-400" /> מחשבון כדאיות פשוט וברור
            </h1>
            <p className="text-sm text-gray-300 mt-1">מיועד גם למי שלא מגיע מהתחום. מכניסים כמה מספרים בסיסיים ומקבלים תשובה ברורה.</p>
          </div>
          <Link href="/" className="text-sm text-green-300 hover:text-green-200 whitespace-nowrap">חזרה לדף הבית</Link>
        </div>

        <section className="db-card p-4 space-y-3 border border-green-500/25">
          <div className="flex items-center gap-2 text-green-200 text-sm">
            <Info className="w-4 h-4" />
            ברירות מחדל 2026 (לא חובה לשנות): פריים {DEFAULTS_2026.primeRateAnnualPct}% · ריבית קבועה {DEFAULTS_2026.fixedRateAnnualPct}% · מדד תשומות {DEFAULTS_2026.annualConstructionIndexPct}% · מע״מ {DEFAULTS_2026.vatPct}%
          </div>
        </section>

        <section className="db-card p-4 space-y-4">
          <h2 className="font-semibold text-lg">שלב 1: בחירות בסיסיות (כמו שאלון קצר)</h2>

          <div className="space-y-2">
            <label className="text-sm text-gray-200">זה נכס למגורים ראשון?</label>
            <ToggleCards
              value={buyerMode}
              onChange={setBuyerMode}
              options={[
                { value: 'first_home', label: 'כן, דירה ראשונה' },
                { value: 'investor', label: 'לא, נכס להשקעה' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-200">סוג עסקה</label>
            <ToggleCards
              value={propertyMode}
              onChange={setPropertyMode}
              options={[
                { value: 'new', label: 'דירה חדשה מקבלן' },
                { value: 'second', label: 'יד שנייה' },
              ]}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <label className="space-y-1">מחיר הנכס (₪)
              <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.contractPriceNis} onChange={(e) => setNum('contractPriceNis', e.target.value)} />
            </label>
            <label className="space-y-1">הון עצמי (%)
              <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.downPaymentPct} onChange={(e) => setNum('downPaymentPct', e.target.value)} />
            </label>
            <label className="space-y-1">שכר דירה צפוי לחודש (₪)
              <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.monthlyRentNis} onChange={(e) => setNum('monthlyRentNis', e.target.value)} />
            </label>
            <label className="space-y-1">הכנסה פנויה למשפחה (₪ לחודש)
              <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.borrowerMonthlyDisposableIncomeNis} onChange={(e) => setNum('borrowerMonthlyDisposableIncomeNis', e.target.value)} />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {advancedOpen ? 'הסתר אפשרויות מתקדמות' : 'פתח אפשרויות מתקדמות (לא חובה)'}
          </button>

          {advancedOpen && (
            <div className="grid md:grid-cols-2 gap-3 text-sm border-t border-white/10 pt-3">
              <label className="space-y-1">ריבית קבועה (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.fixedRateAnnualPct} onChange={(e) => setNum('fixedRateAnnualPct', e.target.value)} />
              </label>
              <label className="space-y-1">פריים (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.primeRateAnnualPct} onChange={(e) => setNum('primeRateAnnualPct', e.target.value)} />
              </label>
              <label className="space-y-1">מדד תשומות בנייה (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.annualConstructionIndexPct} onChange={(e) => setNum('annualConstructionIndexPct', e.target.value)} />
              </label>
              <label className="space-y-1">מרחק מהרכבת הקלה (מטר)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.distanceToTransitMeters} onChange={(e) => setNum('distanceToTransitMeters', e.target.value)} />
              </label>
            </div>
          )}
        </section>

        <section className="db-card p-4 space-y-3">
          <h2 className="font-semibold text-lg">שלב 2: התוצאה שלך (פשוט)</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded bg-black/20">
              <div className="text-gray-300">כמה תעלה העסקה הכוללת</div>
              <div className="font-bold text-2xl">₪{fmt(result.totalAcquisitionCostNis)}</div>
            </div>
            <div className="p-3 rounded bg-black/20">
              <div className="text-gray-300">החזר משכנתה חודשי משוער</div>
              <div className="font-bold text-2xl">₪{fmt(result.monthlyMortgagePaymentNis)}</div>
            </div>
            <div className="p-3 rounded bg-black/20">
              <div className="text-gray-300">תזרים שנתי אחרי הוצאות ומסים</div>
              <div className={`font-bold text-2xl ${result.annualNetCashflowNis >= 0 ? 'text-green-300' : 'text-red-300'}`}>₪{fmt(result.annualNetCashflowNis)}</div>
            </div>
            <div className="p-3 rounded bg-black/20">
              <div className="text-gray-300">תשואה פנימית ל-10 שנים (XIRR)</div>
              <div className="font-bold text-2xl">{result.xirr10yPct.toFixed(2)}%</div>
            </div>
          </div>

          <div className={`rounded p-3 border ${result.financingConstraintsPassed ? 'border-green-500/50 bg-green-500/10' : 'border-amber-500/50 bg-amber-500/10'}`}>
            <div className="flex items-center gap-2 font-semibold">
              {result.financingConstraintsPassed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
              האם המשכנתה נראית בטווח בטוח?
            </div>
            <div className="text-sm mt-1 text-gray-200">
              LTV בפועל: {result.aggregateLtvPct.toFixed(1)}% (מותר: {result.maxAllowedLtvPct.toFixed(1)}%) · PTI: {result.ptiPct.toFixed(1)}%
            </div>
          </div>
        </section>

        <section className="db-card p-4 space-y-2 text-sm text-gray-200">
          <h3 className="font-semibold">פירוט מקוצר למי שרוצה להבין את המספר</h3>
          <div>מס רכישה משוער: ₪{fmt(result.purchaseTaxNis)}</div>
          <div>מע״מ ושירותים: ₪{fmt(result.vatOnPropertyNis + result.vatOnServicesNis)}</div>
          <div>השפעת הצמדה למדד: ₪{fmt(result.linkageSurchargeNis)}</div>
        </section>
      </div>
    </div>
  );
}

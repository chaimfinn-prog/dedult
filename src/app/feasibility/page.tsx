'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { runFeasibility } from '@/lib/finance/simulation';
import type { FeasibilityInputs } from '@/lib/finance/types';

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

  fixedRateAnnualPct: 4.9,
  primeRateAnnualPct: 5.5,
  variableIndexedAnnualPct: 4.3,

  annualConstructionIndexPct: 2.2,
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

export default function FeasibilityPage() {
  const [inputs, setInputs] = useState<FeasibilityInputs>(baseInputs);
  const result = useMemo(() => runFeasibility(inputs), [inputs]);

  const setNum = (key: keyof FeasibilityInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-[#0a0f1d] text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Calculator className="w-7 h-7 text-green-400" /> מחשבון כדאיות נדל״ן 2026</h1>
            <p className="text-sm text-gray-300 mt-1">מס רכישה, הצמדה, מימון, שכירות, ועלות אחזקה + XIRR ל-10 שנים.</p>
          </div>
          <Link href="/" className="text-sm text-green-300 hover:text-green-200">חזרה לדף הבית</Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="db-card p-4 space-y-3">
            <h2 className="font-semibold">קלט מרכזי</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">מחיר חוזה (₪)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.contractPriceNis} onChange={(e) => setNum('contractPriceNis', e.target.value)} />
              </label>
              <label className="space-y-1">שכר דירה חודשי (₪)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.monthlyRentNis} onChange={(e) => setNum('monthlyRentNis', e.target.value)} />
              </label>
              <label className="space-y-1">הון עצמי (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.downPaymentPct} onChange={(e) => setNum('downPaymentPct', e.target.value)} />
              </label>
              <label className="space-y-1">הכנסה פנויה חודשית (₪)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.borrowerMonthlyDisposableIncomeNis} onChange={(e) => setNum('borrowerMonthlyDisposableIncomeNis', e.target.value)} />
              </label>
              <label className="space-y-1">ריבית קבועה (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.fixedRateAnnualPct} onChange={(e) => setNum('fixedRateAnnualPct', e.target.value)} />
              </label>
              <label className="space-y-1">פריים (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.primeRateAnnualPct} onChange={(e) => setNum('primeRateAnnualPct', e.target.value)} />
              </label>
              <label className="space-y-1">מדד תשומות שנתי (%)
                <input className="w-full bg-black/20 rounded p-2" type="number" step="0.1" value={inputs.annualConstructionIndexPct} onChange={(e) => setNum('annualConstructionIndexPct', e.target.value)} />
              </label>
              <label className="space-y-1">מרחק מרכבת קלה (מ׳)
                <input className="w-full bg-black/20 rounded p-2" type="number" value={inputs.distanceToTransitMeters} onChange={(e) => setNum('distanceToTransitMeters', e.target.value)} />
              </label>
            </div>
          </section>

          <section className="db-card p-4 space-y-3">
            <h2 className="font-semibold">תוצאות עיקריות</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">עלות רכישה כוללת</div><div className="font-bold text-lg">₪{fmt(result.totalAcquisitionCostNis)}</div></div>
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">מס רכישה</div><div className="font-bold text-lg">₪{fmt(result.purchaseTaxNis)}</div></div>
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">הצמדה למדד</div><div className="font-bold text-lg">₪{fmt(result.linkageSurchargeNis)}</div></div>
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">תשלום משכנתה חודשי</div><div className="font-bold text-lg">₪{fmt(result.monthlyMortgagePaymentNis)}</div></div>
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">תזרים שנתי נטו</div><div className={`font-bold text-lg ${result.annualNetCashflowNis >= 0 ? 'text-green-300' : 'text-red-300'}`}>₪{fmt(result.annualNetCashflowNis)}</div></div>
              <div className="p-3 rounded bg-black/20"><div className="text-gray-300">XIRR ל-10 שנים</div><div className="font-bold text-lg">{result.xirr10yPct.toFixed(2)}%</div></div>
            </div>

            <div className={`rounded p-3 border ${result.financingConstraintsPassed ? 'border-green-500/50 bg-green-500/10' : 'border-amber-500/50 bg-amber-500/10'}`}>
              <div className="flex items-center gap-2 font-semibold">
                {result.financingConstraintsPassed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
                בדיקת מגבלות מימון
              </div>
              <div className="text-sm mt-1 text-gray-200">LTV מצרפי: {result.aggregateLtvPct.toFixed(1)}% / מותר עד {result.maxAllowedLtvPct.toFixed(1)}% · PTI: {result.ptiPct.toFixed(1)}%</div>
            </div>
          </section>
        </div>

        <section className="db-card p-4">
          <h2 className="font-semibold mb-3">Waterfall שנתי (קרן / ריבית / הצמדה)</h2>
          {([
            ['קרן', result.waterfall.annualPrincipalNis, 'bg-blue-500'],
            ['ריבית', result.waterfall.annualInterestNis, 'bg-purple-500'],
            ['הצמדה', result.waterfall.annualLinkageNis, 'bg-amber-500'],
          ] as const).map(([label, val, cls]) => (
            <div key={label} className="mb-2">
              <div className="flex justify-between text-xs mb-1"><span>{label}</span><span>₪{fmt(val)}</span></div>
              <div className="h-3 rounded bg-black/20 overflow-hidden"><div className={`${cls} h-full`} style={{ width: `${Math.min((val / (result.monthlyMortgagePaymentNis * 12 || 1)) * 100, 100)}%` }} /></div>
            </div>
          ))}
        </section>

        <section className="db-card p-4">
          <h2 className="font-semibold mb-3">Heatmap רגישות (ריבית ±0.5%, מדד ±1%)</h2>
          <div className="grid grid-cols-3 gap-2">
            {result.sensitivity.flatMap((row, rowIdx) => row.map((cell, colIdx) => {
              const positive = cell >= 0;
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`rounded p-3 text-xs border ${positive ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}
                >
                  ₪{fmt(cell)}
                </div>
              );
            }))}
          </div>
        </section>
      </div>
    </div>
  );
}

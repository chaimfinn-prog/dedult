'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useLang } from '@/lib/i18n';
import type { BusinessPlanResult } from '@/lib/pinui-binui';
import type { CompetitiveOffer } from '@/lib/pinui-binui';
import type { PinuiBinuiInput, ExistingBuilding, AreaTier, FinishLevel } from '@/lib/pinui-binui';
import type { CityPlanResult } from '@/data/plans/types';

function DashboardContent() {
  const { lang } = useLang();
  const isHe = lang === 'he';

  const [plan, setPlan] = useState<BusinessPlanResult | null>(null);
  const [offer, setOffer] = useState<CompetitiveOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'offer'>('input');

  const [formState, setFormState] = useState({
    projectName: '',
    city: '',
    neighborhood: '',
    address: '',
    floors: 4,
    unitsPerFloor: 4,
    avgUnitSize: 65,
    condition: 'fair' as ExistingBuilding['condition'],
    yearBuilt: 1970,
    plotArea: 1500,
    plotWidth: 30,
    plotDepth: 50,
    marketPrice: 35000,
    areaTier: 'demand' as AreaTier,
    finishLevel: 'high' as FinishLevel,
    constructionMonths: 36,
    tenantUpgrade: 12,
    maxFloors: 16,
    coefficient: 3.5,
  });

  const update = useCallback((key: string, value: string | number) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const building: ExistingBuilding = {
        address: formState.address || formState.projectName,
        floors: formState.floors,
        unitsPerFloor: formState.unitsPerFloor,
        avgUnitSizeSqm: formState.avgUnitSize,
        condition: formState.condition,
        yearBuilt: formState.yearBuilt,
        hasElevator: false,
        hasParking: false,
        hasShelter: false,
      };

      const totalExisting = formState.floors * formState.unitsPerFloor;
      const maxUnits = Math.floor(formState.plotArea * formState.coefficient / 75);
      const residentialRights = formState.plotArea * formState.coefficient;

      const zoningRights: CityPlanResult = {
        coveragePct: 40,
        coverageArea: formState.plotArea * 0.4,
        coefficient: formState.coefficient,
        maxFloorsLabel: String(formState.maxFloors),
        baseRights: residentialRights,
        bonusBreakdown: [],
        totalBonusPct: 0,
        bonusRights: 0,
        residentialRights,
        publicUse: residentialRights * 0.05,
        sharedAreas: maxUnits * 8,
        totalAboveGround: residentialRights + maxUnits * 8,
        maxUnitsByArea: maxUnits,
        maxUnitsByDensity: Math.floor(formState.plotArea / 1000 * 40),
        maxUnits,
        smallUnits: Math.floor(maxUnits * 0.3),
        largeUnits: maxUnits - Math.floor(maxUnits * 0.3),
        balconies: maxUnits * 12,
        undergroundPerLevel: formState.plotArea * 0.6,
        maxUndergroundLevels: 2,
        storage: maxUnits * 4.5,
        maxCommercial: residentialRights * 0.2,
        setbacks: { front: 5, side: 3, rear: 4 },
        buildableWidth: formState.plotWidth - 6,
        buildableDepth: formState.plotDepth - 9,
        buildableFootprint: (formState.plotWidth - 6) * (formState.plotDepth - 9),
        unitGain: maxUnits - totalExisting,
        areaRatio: residentialRights / (totalExisting * formState.avgUnitSize),
        steps: [],
      };

      const input: PinuiBinuiInput = {
        projectName: formState.projectName,
        city: formState.city,
        neighborhood: formState.neighborhood || undefined,
        existingBuildings: [building],
        plotArea: formState.plotArea,
        plotWidth: formState.plotWidth,
        plotDepth: formState.plotDepth,
        zoningRights,
        marketPricePerSqm: formState.marketPrice,
        areaTier: formState.areaTier,
        finishLevel: formState.finishLevel,
        constructionPeriodMonths: formState.constructionMonths,
        tenantUpgradeSqm: formState.tenantUpgrade,
        stage: 'declared',
      };

      const res = await fetch('/api/pinui-binui/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setPlan(data.plan);
      setOffer(data.competitiveOffer);
      setActiveTab('results');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(isHe ? 'he-IL' : 'en-US');
  const fmtNis = (n: number) => `₪${fmt(Math.round(n))}`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {isHe ? 'מערכת ניתוח פינוי-בינוי' : 'Pinui-Binui Analysis System'}
        </h1>
        <p className="text-gray-400 mb-6">
          {isHe ? 'תוכנית עסקית אוטומטית ליזמי התחדשות עירונית' : 'Automated business plan for urban renewal developers'}
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          {(['input', 'results', 'offer'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              disabled={tab !== 'input' && !plan}
            >
              {tab === 'input' && (isHe ? 'נתוני פרויקט' : 'Project Data')}
              {tab === 'results' && (isHe ? 'תוכנית עסקית' : 'Business Plan')}
              {tab === 'offer' && (isHe ? 'הצעת יזם' : 'Developer Offer')}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputCard title={isHe ? 'פרטי פרויקט' : 'Project Details'}>
              <Field label={isHe ? 'שם פרויקט' : 'Project Name'} value={formState.projectName} onChange={v => update('projectName', v)} />
              <Field label={isHe ? 'עיר' : 'City'} value={formState.city} onChange={v => update('city', v)} />
              <Field label={isHe ? 'שכונה' : 'Neighborhood'} value={formState.neighborhood} onChange={v => update('neighborhood', v)} />
              <Field label={isHe ? 'כתובת' : 'Address'} value={formState.address} onChange={v => update('address', v)} />
            </InputCard>

            <InputCard title={isHe ? 'מבנה קיים' : 'Existing Building'}>
              <NumField label={isHe ? 'קומות' : 'Floors'} value={formState.floors} onChange={v => update('floors', v)} />
              <NumField label={isHe ? 'דירות לקומה' : 'Units/Floor'} value={formState.unitsPerFloor} onChange={v => update('unitsPerFloor', v)} />
              <NumField label={isHe ? 'גודל ממוצע (מ"ר)' : 'Avg Size (sqm)'} value={formState.avgUnitSize} onChange={v => update('avgUnitSize', v)} />
              <SelectField
                label={isHe ? 'מצב מבנה' : 'Condition'}
                value={formState.condition}
                options={[
                  { value: 'poor', label: isHe ? 'גרוע' : 'Poor' },
                  { value: 'fair', label: isHe ? 'בינוני' : 'Fair' },
                  { value: 'good', label: isHe ? 'טוב' : 'Good' },
                ]}
                onChange={v => update('condition', v)}
              />
              <NumField label={isHe ? 'שנת בניה' : 'Year Built'} value={formState.yearBuilt} onChange={v => update('yearBuilt', v)} />
            </InputCard>

            <InputCard title={isHe ? 'נתוני מגרש' : 'Plot Data'}>
              <NumField label={isHe ? 'שטח מגרש (מ"ר)' : 'Plot Area (sqm)'} value={formState.plotArea} onChange={v => update('plotArea', v)} />
              <NumField label={isHe ? 'רוחב (מ\')' : 'Width (m)'} value={formState.plotWidth} onChange={v => update('plotWidth', v)} />
              <NumField label={isHe ? 'עומק (מ\')' : 'Depth (m)'} value={formState.plotDepth} onChange={v => update('plotDepth', v)} />
            </InputCard>

            <InputCard title={isHe ? 'זכויות בניה' : 'Building Rights'}>
              <NumField label={isHe ? 'מקדם בניה' : 'Coefficient'} value={formState.coefficient} onChange={v => update('coefficient', v)} step={0.1} />
              <NumField label={isHe ? 'קומות מקסימום' : 'Max Floors'} value={formState.maxFloors} onChange={v => update('maxFloors', v)} />
            </InputCard>

            <InputCard title={isHe ? 'נתוני שוק' : 'Market Data'}>
              <NumField label={isHe ? 'מחיר למ"ר (₪)' : 'Price/sqm (₪)'} value={formState.marketPrice} onChange={v => update('marketPrice', v)} step={1000} />
              <SelectField
                label={isHe ? 'אזור ביקוש' : 'Area Tier'}
                value={formState.areaTier}
                options={[
                  { value: 'periphery', label: isHe ? 'פריפריה' : 'Periphery' },
                  { value: 'mid', label: isHe ? 'ביניים' : 'Mid' },
                  { value: 'demand', label: isHe ? 'ביקוש' : 'Demand' },
                  { value: 'high_demand', label: isHe ? 'ביקוש גבוה' : 'High Demand' },
                ]}
                onChange={v => update('areaTier', v)}
              />
              <SelectField
                label={isHe ? 'רמת גימור' : 'Finish Level'}
                value={formState.finishLevel}
                options={[
                  { value: 'standard', label: isHe ? 'סטנדרט' : 'Standard' },
                  { value: 'high', label: isHe ? 'גבוה' : 'High' },
                  { value: 'luxury', label: isHe ? 'יוקרה' : 'Luxury' },
                ]}
                onChange={v => update('finishLevel', v)}
              />
            </InputCard>

            <InputCard title={isHe ? 'פרמטרים' : 'Parameters'}>
              <NumField label={isHe ? 'תקופת בניה (חודשים)' : 'Construction (months)'} value={formState.constructionMonths} onChange={v => update('constructionMonths', v)} />
              <NumField label={isHe ? 'תוספת לדייר (מ"ר)' : 'Tenant Upgrade (sqm)'} value={formState.tenantUpgrade} onChange={v => update('tenantUpgrade', v)} />
            </InputCard>

            <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-4">
              <button
                onClick={runAnalysis}
                disabled={loading || !formState.projectName || !formState.city}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-lg font-medium transition"
              >
                {loading
                  ? (isHe ? 'מחשב...' : 'Computing...')
                  : (isHe ? 'הפק תוכנית עסקית' : 'Generate Business Plan')}
              </button>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && plan && (
          <div className="space-y-6">
            {/* Feasibility Banner */}
            <div className={`p-6 rounded-lg border ${
              plan.feasibility === 'profitable'
                ? 'bg-green-900/20 border-green-700'
                : plan.feasibility === 'marginal'
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-red-900/20 border-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{plan.projectName}</h2>
                  <p className="text-gray-400">{plan.city}</p>
                </div>
                <div className="text-end">
                  <div className={`text-3xl font-bold ${
                    plan.feasibility === 'profitable' ? 'text-green-400'
                      : plan.feasibility === 'marginal' ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}>
                    {plan.feasibilityScore.toFixed(0)}/100
                  </div>
                  <div className="text-sm text-gray-400">
                    {plan.feasibility === 'profitable' ? (isHe ? 'כדאי' : 'Profitable')
                      : plan.feasibility === 'marginal' ? (isHe ? 'שולי' : 'Marginal')
                        : (isHe ? 'לא כדאי' : 'Not Feasible')}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label={isHe ? 'דירות קיימות' : 'Existing Units'} value={plan.existingSummary.totalUnits} />
              <MetricCard label={isHe ? 'דירות חדשות' : 'New Units'} value={plan.zoningGains.totalNewUnits} />
              <MetricCard label={isHe ? 'דירות חופשיות' : 'Free Units'} value={plan.revenueModel.freeUnits} />
              <MetricCard label={isHe ? 'יחס חופשי/דייר' : 'Free/Tenant'} value={plan.ratios.freeToTenantRatio.toFixed(2)} />
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard title={isHe ? 'עלויות' : 'Costs'}>
                <ResultRow label={isHe ? 'בניה ישירה' : 'Direct Construction'} value={fmtNis(plan.costSummary.directConstruction)} />
                <ResultRow label={isHe ? 'פיצוי דיירים' : 'Tenant Compensation'} value={fmtNis(plan.costSummary.tenantCompensation)} />
                <ResultRow label={isHe ? 'שכ"ט מקצועי' : 'Professional Fees'} value={fmtNis(plan.costSummary.professionalFees)} />
                <ResultRow label={isHe ? 'שיווק' : 'Marketing'} value={fmtNis(plan.costSummary.marketing)} />
                <ResultRow label={isHe ? 'מימון' : 'Financing'} value={fmtNis(plan.costSummary.financing)} />
                <ResultRow label={isHe ? 'בלת"מ' : 'Contingency'} value={fmtNis(plan.costSummary.contingency)} />
                <ResultRow label={isHe ? 'סה"כ עלות' : 'Total Cost'} value={fmtNis(plan.costSummary.totalProjectCost)} bold />
              </ResultCard>

              <ResultCard title={isHe ? 'הכנסות' : 'Revenue'}>
                <ResultRow label={isHe ? 'דירות למכירה' : 'Units for Sale'} value={String(plan.revenueModel.freeUnits)} />
                <ResultRow label={isHe ? 'שטח למכירה' : 'Area for Sale'} value={`${fmt(plan.revenueModel.totalFreeAreaSqm)} ${isHe ? 'מ"ר' : 'sqm'}`} />
                <ResultRow label={isHe ? 'הכנסה ברוטו' : 'Gross Revenue'} value={fmtNis(plan.revenueModel.grossRevenueNis)} />
                <ResultRow label={isHe ? 'מע"מ' : 'VAT'} value={fmtNis(plan.revenueModel.vatOnSalesNis)} />
                <ResultRow label={isHe ? 'הכנסה נטו' : 'Net Revenue'} value={fmtNis(plan.revenueModel.netRevenueNis)} bold />
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <ResultRow
                    label={isHe ? 'רווח נקי' : 'Net Profit'}
                    value={fmtNis(plan.developerOffer.estimatedProfitNis)}
                    bold
                    highlight={plan.developerOffer.estimatedProfitNis > 0 ? 'green' : 'red'}
                  />
                  <ResultRow label={isHe ? 'שיעור רווח' : 'Margin'} value={fmtPct(plan.developerOffer.profitMarginPct)} />
                </div>
              </ResultCard>
            </div>

            {/* Key Ratios */}
            <ResultCard title={isHe ? 'יחסים מרכזיים' : 'Key Ratios'}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RatioBox label={isHe ? 'עלות למ"ר בנוי' : 'Cost/sqm Built'} value={fmtNis(plan.ratios.costPerSqmBuilt)} />
                <RatioBox label={isHe ? 'הכנסה למ"ר חופשי' : 'Revenue/sqm Free'} value={fmtNis(plan.ratios.revenuePerSqmFree)} />
                <RatioBox label={isHe ? 'רווח למ"ר חופשי' : 'Profit/sqm Free'} value={fmtNis(plan.ratios.profitPerSqmFree)} />
                <RatioBox label={isHe ? 'מחיר איזון למ"ר' : 'Break-even/sqm'} value={fmtNis(plan.ratios.breakEvenPricePerSqm)} />
              </div>
            </ResultCard>

            {/* Calculation Steps */}
            <ResultCard title={isHe ? 'שלבי חישוב' : 'Calculation Steps'}>
              {plan.steps.map((step, i) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-mono text-sm">{step.step}.</span>
                    <span className="font-medium">{isHe ? step.titleHe : step.title}</span>
                  </div>
                  <div className="text-sm text-gray-400 ms-6">{step.calculation}</div>
                  <div className="text-sm text-green-400 ms-6">{step.result}</div>
                </div>
              ))}
            </ResultCard>
          </div>
        )}

        {/* Offer Tab */}
        {activeTab === 'offer' && offer && plan && (
          <div className="space-y-6">
            <ResultCard title={isHe ? 'הצעת יזם חלופי' : 'Alternative Developer Offer'}>
              {offer.baseOffer.canOffer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricCard label={isHe ? 'דירות ליזם' : 'Developer Units'} value={offer.baseOffer.freeUnitsForDeveloper} />
                    <MetricCard label={isHe ? 'רווח צפוי' : 'Expected Profit'} value={fmtNis(offer.baseOffer.estimatedProfitNis)} />
                    <MetricCard label={isHe ? 'הצעה מוצעת/דירה' : 'Suggested/Unit'} value={fmtNis(offer.baseOffer.suggestedOfferPerUnit)} />
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="font-medium mb-2">{isHe ? 'חבילת דייר' : 'Tenant Package'}</h4>
                    <ResultRow label={isHe ? 'דירה חדשה' : 'New Apartment'} value={`${offer.baseOffer.newApartmentSizeSqm} ${isHe ? 'מ"ר' : 'sqm'}`} />
                    <ResultRow label={isHe ? 'תוספת שטח' : 'Size Upgrade'} value={`+${offer.baseOffer.tenantUpgradeSqm} ${isHe ? 'מ"ר' : 'sqm'}`} />
                    <ResultRow label={isHe ? 'דיור חלופי' : 'Temp Housing'} value={`${offer.baseOffer.tempHousingMonths} ${isHe ? 'חודשים' : 'months'}`} />
                    <ResultRow label={isHe ? 'מענק הובלה' : 'Moving Grant'} value={fmtNis(offer.baseOffer.movingGrant)} />
                  </div>
                </div>
              ) : (
                <div className="text-red-400 p-4">
                  {isHe ? 'הפרויקט לא כדאי כלכלית' : 'Project not economically viable'}: {offer.baseOffer.reason}
                </div>
              )}
            </ResultCard>

            {offer.scenarios.length > 0 && (
              <ResultCard title={isHe ? 'תרחישים' : 'Scenarios'}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-start p-2">{isHe ? 'תרחיש' : 'Scenario'}</th>
                        <th className="text-start p-2">{isHe ? 'תוספת מ"ר' : 'Upgrade sqm'}</th>
                        <th className="text-start p-2">{isHe ? 'רווח' : 'Margin'}</th>
                        <th className="text-start p-2">{isHe ? 'רווח ₪' : 'Profit ₪'}</th>
                        <th className="text-start p-2">{isHe ? 'כדאיות' : 'Feasibility'}</th>
                        <th className="text-start p-2">{isHe ? 'ציון' : 'Score'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.scenarios.slice(0, 10).map((s, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-2">{isHe ? s.nameHe : s.name}</td>
                          <td className="p-2">{s.tenantUpgradeSqm}</td>
                          <td className="p-2">{fmtPct(s.marginPct)}</td>
                          <td className="p-2">{fmtNis(s.profitNis)}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              s.feasibility === 'profitable' ? 'bg-green-900/50 text-green-400'
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {s.feasibility === 'profitable' ? (isHe ? 'כדאי' : 'Profitable') : (isHe ? 'שולי' : 'Marginal')}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{s.score.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultCard>
            )}

            {offer.competitiveAdvantage.length > 0 && (
              <ResultCard title={isHe ? 'יתרונות תחרותיים' : 'Competitive Advantages'}>
                <ul className="space-y-2">
                  {offer.competitiveAdvantage.map((adv, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-400">
                      <span className="text-green-500">+</span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

// ── Reusable Components ──

function InputCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-3 text-blue-400">{title}</h3>
      {children}
    </div>
  );
}

function ResultRow({ label, value, bold, highlight }: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: 'green' | 'red';
}) {
  return (
    <div className={`flex justify-between py-1 ${bold ? 'font-bold text-white' : 'text-gray-300'}`}>
      <span>{label}</span>
      <span className={
        highlight === 'green' ? 'text-green-400'
          : highlight === 'red' ? 'text-red-400'
            : ''
      }>{value}</span>
    </div>
  );
}

function RatioBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-blue-300">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

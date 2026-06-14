'use client';

import { useState, useCallback, Suspense } from 'react';
import { useLang } from '@/lib/i18n';
import { buildBusinessPlan } from '@/lib/pinui-binui/business-plan';
import { calcCompetitiveOffer, estimateReplacementDeveloperValue } from '@/lib/pinui-binui/offer-calculator';
import type { BusinessPlanResult, ExistingBuilding, AreaTier, FinishLevel, PinuiBinuiInput } from '@/lib/pinui-binui/types';
import type { CompetitiveOffer } from '@/lib/pinui-binui/offer-calculator';
import type { CityPlanResult } from '@/data/plans/types';

type Step = 'input' | 'results' | 'offer';

function PinuiBinuiApp() {
  const { lang, toggle } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const [step, setStep] = useState<Step>('input');
  const [plan, setPlan] = useState<BusinessPlanResult | null>(null);
  const [offer, setOffer] = useState<CompetitiveOffer | null>(null);
  const [replacementVal, setReplacementVal] = useState<ReturnType<typeof estimateReplacementDeveloperValue> | null>(null);

  const [form, setForm] = useState({
    projectName: '',
    city: '',
    neighborhood: '',
    address: '',
    buildingCount: 1,
    floors: 4,
    unitsPerFloor: 4,
    avgUnitSize: 65,
    condition: 'fair' as ExistingBuilding['condition'],
    yearBuilt: 1970,
    hasElevator: false,
    hasParking: false,
    hasShelter: false,
    plotArea: 1500,
    plotWidth: 30,
    plotDepth: 50,
    coefficient: 3.5,
    maxFloors: 16,
    marketPrice: 35000,
    areaTier: 'demand' as AreaTier,
    finishLevel: 'high' as FinishLevel,
    constructionMonths: 36,
    tenantUpgrade: 12,
    existingDeveloper: '',
    stage: 'declared' as PinuiBinuiInput['stage'],
  });

  const set = useCallback(<K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const canRun = form.projectName.trim() && form.city.trim() && form.plotArea > 0;

  const run = () => {
    const building: ExistingBuilding = {
      address: form.address || form.projectName,
      floors: form.floors,
      unitsPerFloor: form.unitsPerFloor,
      avgUnitSizeSqm: form.avgUnitSize,
      condition: form.condition,
      yearBuilt: form.yearBuilt,
      hasElevator: form.hasElevator,
      hasParking: form.hasParking,
      hasShelter: form.hasShelter,
    };

    const buildings: ExistingBuilding[] = Array.from(
      { length: form.buildingCount },
      (_, i) => ({ ...building, address: `${building.address}${form.buildingCount > 1 ? ` (${i + 1})` : ''}` }),
    );

    const totalExisting = form.floors * form.unitsPerFloor * form.buildingCount;
    const residentialRights = form.plotArea * form.coefficient;
    const maxUnits = Math.floor(residentialRights / 75);

    const zoningRights: CityPlanResult = {
      coveragePct: 40,
      coverageArea: form.plotArea * 0.4,
      coefficient: form.coefficient,
      maxFloorsLabel: String(form.maxFloors),
      baseRights: residentialRights,
      bonusBreakdown: [],
      totalBonusPct: 0,
      bonusRights: 0,
      residentialRights,
      publicUse: residentialRights * 0.05,
      sharedAreas: maxUnits * 8,
      totalAboveGround: residentialRights + maxUnits * 8,
      maxUnitsByArea: maxUnits,
      maxUnitsByDensity: Math.floor((form.plotArea / 1000) * 40),
      maxUnits,
      smallUnits: Math.floor(maxUnits * 0.3),
      largeUnits: maxUnits - Math.floor(maxUnits * 0.3),
      balconies: maxUnits * 12,
      undergroundPerLevel: form.plotArea * 0.6,
      maxUndergroundLevels: 2,
      storage: maxUnits * 4.5,
      maxCommercial: residentialRights * 0.2,
      setbacks: { front: 5, side: 3, rear: 4 },
      buildableWidth: form.plotWidth - 6,
      buildableDepth: form.plotDepth - 9,
      buildableFootprint: (form.plotWidth - 6) * (form.plotDepth - 9),
      unitGain: maxUnits - totalExisting,
      areaRatio: totalExisting > 0 ? residentialRights / (totalExisting * form.avgUnitSize) : 0,
      steps: [],
    };

    const input: PinuiBinuiInput = {
      projectName: form.projectName,
      city: form.city,
      neighborhood: form.neighborhood || undefined,
      existingBuildings: buildings,
      plotArea: form.plotArea,
      plotWidth: form.plotWidth,
      plotDepth: form.plotDepth,
      zoningRights,
      marketPricePerSqm: form.marketPrice,
      areaTier: form.areaTier,
      finishLevel: form.finishLevel,
      constructionPeriodMonths: form.constructionMonths,
      tenantUpgradeSqm: form.tenantUpgrade,
      stage: form.stage,
      existingDeveloper: form.existingDeveloper || undefined,
    };

    const result = buildBusinessPlan(input);
    const comp = calcCompetitiveOffer(input);
    const rep = estimateReplacementDeveloperValue(result);
    setPlan(result);
    setOffer(comp);
    setReplacementVal(rep);
    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fmt = (n: number) => n.toLocaleString(isHe ? 'he-IL' : 'en-US');
  const nis = (n: number) => `₪${fmt(Math.round(n))}`;
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">PB</div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                {t('ניתוח פינוי-בינוי', 'Pinui-Binui Analyzer')}
              </h1>
              <p className="text-[11px] text-gray-500 leading-none mt-0.5">
                {t('תוכנית עסקית אוטומטית', 'Automated Business Plan')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              {(['input', 'results', 'offer'] as const).map((s, i) => (
                <button
                  key={s}
                  onClick={() => { if (s === 'input' || plan) setStep(s); }}
                  disabled={s !== 'input' && !plan}
                  className={`px-2.5 py-1 rounded-full transition ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : plan || s === 'input'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {i + 1}. {s === 'input' ? t('נתונים', 'Input') : s === 'results' ? t('תוכנית', 'Plan') : t('הצעה', 'Offer')}
                </button>
              ))}
            </div>
            <button onClick={toggle} className="text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-2 py-1">
              {isHe ? 'EN' : 'עב'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ────────────────── INPUT ────────────────── */}
        {step === 'input' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Project Details */}
            <Section title={t('פרטי הפרויקט', 'Project Details')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Txt label={t('שם הפרויקט / מתחם', 'Project / Complex Name')} value={form.projectName} onChange={v => set('projectName', v)} placeholder={t('למשל: מתחם הרצל', 'e.g. Herzl Complex')} required />
                <Txt label={t('עיר', 'City')} value={form.city} onChange={v => set('city', v)} placeholder={t('בת ים', 'Bat Yam')} required />
                <Txt label={t('שכונה', 'Neighborhood')} value={form.neighborhood} onChange={v => set('neighborhood', v)} />
                <Txt label={t('כתובת', 'Address')} value={form.address} onChange={v => set('address', v)} placeholder={t('רחוב הרצל 10-14', 'Herzl St. 10-14')} />
              </div>
            </Section>

            {/* Existing Building */}
            <Section title={t('מבנים קיימים', 'Existing Buildings')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Num label={t('מס\' בניינים', 'Buildings')} value={form.buildingCount} onChange={v => set('buildingCount', v)} min={1} max={20} />
                <Num label={t('קומות', 'Floors')} value={form.floors} onChange={v => set('floors', v)} min={1} max={20} />
                <Num label={t('דירות לקומה', 'Units / Floor')} value={form.unitsPerFloor} onChange={v => set('unitsPerFloor', v)} min={1} max={12} />
                <Num label={t('גודל ממוצע (מ"ר)', 'Avg Unit (sqm)')} value={form.avgUnitSize} onChange={v => set('avgUnitSize', v)} min={20} max={200} />
                <Num label={t('שנת בניה', 'Year Built')} value={form.yearBuilt} onChange={v => set('yearBuilt', v)} min={1920} max={2010} />
                <Sel label={t('מצב מבנה', 'Condition')} value={form.condition} options={[
                  { v: 'poor', l: t('גרוע', 'Poor') },
                  { v: 'fair', l: t('בינוני', 'Fair') },
                  { v: 'good', l: t('טוב', 'Good') },
                ]} onChange={v => set('condition', v as ExistingBuilding['condition'])} />
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <Toggle label={t('מעלית', 'Elevator')} checked={form.hasElevator} onChange={v => set('hasElevator', v)} />
                <Toggle label={t('חניה', 'Parking')} checked={form.hasParking} onChange={v => set('hasParking', v)} />
                <Toggle label={t('ממ"ד', 'Shelter')} checked={form.hasShelter} onChange={v => set('hasShelter', v)} />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {t('סה"כ', 'Total')}: <span className="text-white font-medium">{form.buildingCount * form.floors * form.unitsPerFloor}</span> {t('דירות', 'units')} | <span className="text-white font-medium">{fmt(form.buildingCount * form.floors * form.unitsPerFloor * form.avgUnitSize)}</span> {t('מ"ר', 'sqm')}
              </div>
            </Section>

            {/* Plot & Zoning */}
            <Section title={t('מגרש וזכויות בניה', 'Plot & Building Rights')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Num label={t('שטח מגרש (מ"ר)', 'Plot Area (sqm)')} value={form.plotArea} onChange={v => set('plotArea', v)} min={200} step={50} />
                <Num label={t('רוחב (מ\')', 'Width (m)')} value={form.plotWidth} onChange={v => set('plotWidth', v)} min={5} />
                <Num label={t('עומק (מ\')', 'Depth (m)')} value={form.plotDepth} onChange={v => set('plotDepth', v)} min={5} />
                <Num label={t('מקדם בניה', 'Coefficient')} value={form.coefficient} onChange={v => set('coefficient', v)} min={0.5} max={10} step={0.1} />
                <Num label={t('קומות מקס\'', 'Max Floors')} value={form.maxFloors} onChange={v => set('maxFloors', v)} min={1} max={50} />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {t('זכויות בניה', 'Building Rights')}: <span className="text-white font-medium">{fmt(form.plotArea * form.coefficient)}</span> {t('מ"ר', 'sqm')} | {t('דירות חדשות (אומדן)', 'New Units (est.)')}: <span className="text-white font-medium">{Math.floor(form.plotArea * form.coefficient / 75)}</span>
              </div>
            </Section>

            {/* Market & Costs */}
            <Section title={t('נתוני שוק ופרמטרים', 'Market & Parameters')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Num label={t('מחיר שוק למ"ר (₪)', 'Market ₪/sqm')} value={form.marketPrice} onChange={v => set('marketPrice', v)} min={5000} step={1000} />
                <Sel label={t('אזור ביקוש', 'Area Tier')} value={form.areaTier} options={[
                  { v: 'periphery', l: t('פריפריה', 'Periphery') },
                  { v: 'mid', l: t('ביניים', 'Mid') },
                  { v: 'demand', l: t('ביקוש', 'Demand') },
                  { v: 'high_demand', l: t('ביקוש גבוה', 'High Demand') },
                ]} onChange={v => set('areaTier', v as AreaTier)} />
                <Sel label={t('רמת גימור', 'Finish Level')} value={form.finishLevel} options={[
                  { v: 'standard', l: t('סטנדרט', 'Standard') },
                  { v: 'high', l: t('גבוה', 'High') },
                  { v: 'luxury', l: t('יוקרה', 'Luxury') },
                ]} onChange={v => set('finishLevel', v as FinishLevel)} />
                <Num label={t('תקופת בניה (חודשים)', 'Construction (mo.)')} value={form.constructionMonths} onChange={v => set('constructionMonths', v)} min={12} max={72} />
                <Num label={t('תוספת לדייר (מ"ר)', 'Tenant Upgrade (sqm)')} value={form.tenantUpgrade} onChange={v => set('tenantUpgrade', v)} min={0} max={50} />
                <Sel label={t('שלב פרויקט', 'Project Stage')} value={form.stage!} options={[
                  { v: 'pre_declaration', l: t('לפני הכרזה', 'Pre-Declaration') },
                  { v: 'declared', l: t('הוכרז', 'Declared') },
                  { v: 'plan_submitted', l: t('תב"ע הוגשה', 'Plan Submitted') },
                  { v: 'plan_approved', l: t('תב"ע אושרה', 'Plan Approved') },
                  { v: 'permit_issued', l: t('היתר בניה', 'Permit Issued') },
                  { v: 'under_construction', l: t('בביצוע', 'Under Construction') },
                ]} onChange={v => set('stage', v as PinuiBinuiInput['stage'])} />
                <Txt label={t('יזם קיים', 'Current Developer')} value={form.existingDeveloper} onChange={v => set('existingDeveloper', v)} placeholder={t('שם החברה', 'Company name')} />
              </div>
            </Section>

            {/* Run Button */}
            <div className="flex justify-center pt-2 pb-8">
              <button
                onClick={run}
                disabled={!canRun}
                className="px-10 py-3.5 rounded-xl text-base font-semibold transition-all
                  bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400
                  disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
                  shadow-lg shadow-blue-900/30 hover:shadow-blue-800/40"
              >
                {t('הפק תוכנית עסקית', 'Generate Business Plan')}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────── RESULTS ────────────────── */}
        {step === 'results' && plan && (
          <div className="space-y-5 animate-in fade-in">
            {/* Feasibility Header */}
            <div className={`rounded-xl p-5 border ${
              plan.feasibility === 'profitable' ? 'bg-emerald-950/30 border-emerald-700/50' :
              plan.feasibility === 'marginal' ? 'bg-amber-950/30 border-amber-700/50' :
              'bg-red-950/30 border-red-700/50'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{plan.projectName}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{plan.city}{form.neighborhood ? ` — ${form.neighborhood}` : ''}</p>
                </div>
                <div className="text-end shrink-0">
                  <div className={`text-4xl font-black leading-none ${
                    plan.feasibility === 'profitable' ? 'text-emerald-400' :
                    plan.feasibility === 'marginal' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {plan.feasibilityScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">/100</div>
                  <div className={`text-xs mt-1 font-medium ${
                    plan.feasibility === 'profitable' ? 'text-emerald-400' :
                    plan.feasibility === 'marginal' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {plan.feasibility === 'profitable' ? t('כדאי', 'Profitable') :
                     plan.feasibility === 'marginal' ? t('שולי', 'Marginal') :
                     t('לא כדאי', 'Not Feasible')}
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPI label={t('דירות קיימות', 'Existing')} value={plan.existingSummary.totalUnits} sub={`${fmt(plan.existingSummary.totalExistingAreaSqm)} ${t('מ"ר', 'sqm')}`} />
              <KPI label={t('דירות חדשות', 'New')} value={plan.zoningGains.totalNewUnits} sub={`+${plan.zoningGains.unitGain}`} color="blue" />
              <KPI label={t('דירות חופשיות', 'Free (Dev.)')} value={plan.revenueModel.freeUnits} sub={t('למכירה', 'for sale')} color="cyan" />
              <KPI label={t('יחס חופשי/דייר', 'Free/Tenant')} value={plan.ratios.freeToTenantRatio.toFixed(2)} sub={plan.ratios.freeToTenantRatio >= 1.5 ? t('מצוין', 'Excellent') : plan.ratios.freeToTenantRatio >= 1 ? t('טוב', 'Good') : t('נמוך', 'Low')} color={plan.ratios.freeToTenantRatio >= 1 ? 'green' : 'red'} />
            </div>

            {/* Costs vs Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title={t('עלויות פרויקט', 'Project Costs')}>
                <Row l={t('בניה ישירה', 'Direct Construction')} r={nis(plan.costSummary.directConstruction)} />
                <Row l={t('פיצוי דיירים', 'Tenant Compensation')} r={nis(plan.costSummary.tenantCompensation)} />
                <Row l={t('שכ"ט מקצועי', 'Professional Fees')} r={nis(plan.costSummary.professionalFees)} />
                <Row l={t('שיווק', 'Marketing')} r={nis(plan.costSummary.marketing)} />
                <Row l={t('מימון', 'Financing')} r={nis(plan.costSummary.financing)} />
                <Row l={t('בלת"מ', 'Contingency')} r={nis(plan.costSummary.contingency)} />
                <div className="border-t border-gray-700/50 mt-2 pt-2">
                  <Row l={t('סה"כ עלות', 'Total Cost')} r={nis(plan.costSummary.totalProjectCost)} bold />
                </div>
              </Card>

              <Card title={t('הכנסות', 'Revenue')}>
                <Row l={t('דירות למכירה', 'Units for Sale')} r={String(plan.revenueModel.freeUnits)} />
                <Row l={t('שטח למכירה', 'Sellable Area')} r={`${fmt(plan.revenueModel.totalFreeAreaSqm)} ${t('מ"ר', 'sqm')}`} />
                <Row l={t('מחיר למ"ר', 'Price/sqm')} r={nis(plan.revenueModel.pricePerSqm)} />
                <Row l={t('הכנסה ברוטו', 'Gross Revenue')} r={nis(plan.revenueModel.grossRevenueNis)} />
                <Row l={t('מע"מ', 'VAT')} r={`-${nis(plan.revenueModel.vatOnSalesNis)}`} dim />
                <div className="border-t border-gray-700/50 mt-2 pt-2">
                  <Row l={t('הכנסה נטו', 'Net Revenue')} r={nis(plan.revenueModel.netRevenueNis)} bold />
                </div>
                <div className="border-t border-gray-700/50 mt-2 pt-2">
                  <Row
                    l={t('רווח גולמי', 'Gross Profit')}
                    r={nis(plan.developerOffer.estimatedProfitNis)}
                    bold
                    color={plan.developerOffer.estimatedProfitNis > 0 ? 'green' : 'red'}
                  />
                  <Row l={t('שיעור רווח', 'Profit Margin')} r={pct(plan.developerOffer.profitMarginPct)} color={plan.developerOffer.profitMarginPct > 0.15 ? 'green' : plan.developerOffer.profitMarginPct > 0 ? 'yellow' : 'red'} />
                </div>
              </Card>
            </div>

            {/* Ratios */}
            <Card title={t('יחסי מפתח', 'Key Ratios')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <RatioCell label={t('עלות / מ"ר בנוי', 'Cost / sqm Built')} value={nis(plan.ratios.costPerSqmBuilt)} />
                <RatioCell label={t('הכנסה / מ"ר חופשי', 'Rev / sqm Free')} value={nis(plan.ratios.revenuePerSqmFree)} />
                <RatioCell label={t('רווח / מ"ר חופשי', 'Profit / sqm Free')} value={nis(plan.ratios.profitPerSqmFree)} />
                <RatioCell label={t('מחיר איזון / מ"ר', 'Break-even / sqm')} value={nis(plan.ratios.breakEvenPricePerSqm)} />
              </div>
            </Card>

            {/* Tenant Compensation Detail */}
            <Card title={t('פיצוי דיירים — פירוט', 'Tenant Compensation — Detail')}>
              <Row l={t('מס\' דיירים', 'Tenants')} r={String(plan.tenantCompensation.totalTenants)} />
              <Row l={t('דירה חדשה (מ"ר)', 'New Apartment (sqm)')} r={String(plan.tenantCompensation.newApartmentSizeSqm)} />
              <Row l={t('שטח לדיירים', 'Tenant Area')} r={`${fmt(plan.tenantCompensation.totalTenantAreaSqm)} ${t('מ"ר', 'sqm')}`} />
              <Row l={t('דיור חלופי', 'Temp Housing')} r={nis(plan.tenantCompensation.tempHousingTotalNis)} />
              <Row l={t('הובלות', 'Moving Costs')} r={nis(plan.tenantCompensation.movingCostsTotalNis)} />
              <Row l={t('עו"ד לדיירים', 'Legal Fees')} r={nis(plan.tenantCompensation.legalFeesTotalNis)} />
              <div className="border-t border-gray-700/50 mt-2 pt-2">
                <Row l={t('סה"כ פיצוי', 'Total Compensation')} r={nis(plan.tenantCompensation.totalCompensationNis)} bold />
                <Row l={t('פיצוי לדייר', 'Per Tenant')} r={nis(plan.tenantCompensation.compensationPerTenantNis)} />
              </div>
            </Card>

            {/* Calculation Steps */}
            <Card title={t('שלבי חישוב', 'Calculation Steps')}>
              <div className="space-y-2">
                {plan.steps.map(s => (
                  <div key={s.step} className="py-1.5 border-b border-gray-800/50 last:border-0">
                    <div className="flex gap-2 items-baseline">
                      <span className="text-blue-400 font-mono text-xs shrink-0">{s.step}.</span>
                      <span className="font-medium text-sm">{isHe ? s.titleHe : s.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 ms-5 mt-0.5">{s.calculation}</p>
                    <p className="text-xs text-emerald-400/80 ms-5">{s.result}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between pt-2 pb-8">
              <button onClick={() => setStep('input')} className="px-5 py-2 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">
                {t('חזרה לנתונים', 'Back to Input')}
              </button>
              <button onClick={() => setStep('offer')} className="px-6 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium">
                {t('הצעת יזם חלופי', 'Developer Offer')}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────── OFFER ────────────────── */}
        {step === 'offer' && plan && offer && (
          <div className="space-y-5 animate-in fade-in">
            {/* Offer Summary */}
            <Card title={t('הצעת יזם חלופי', 'Alternative Developer Offer')}>
              {offer.baseOffer.canOffer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KPI label={t('דירות ליזם', 'Dev. Units')} value={offer.baseOffer.freeUnitsForDeveloper} color="cyan" />
                    <KPI label={t('רווח צפוי', 'Est. Profit')} value={nis(offer.baseOffer.estimatedProfitNis)} color="green" />
                    <KPI label={t('הצעה מקסימלית/דירה', 'Max Offer/Unit')} value={nis(offer.baseOffer.maxOfferPerUnit)} />
                    <KPI label={t('הצעה מוצעת/דירה', 'Suggested/Unit')} value={nis(offer.baseOffer.suggestedOfferPerUnit)} color="blue" />
                  </div>

                  <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('חבילת דייר', 'Tenant Package')}</h4>
                    <Row l={t('דירה חדשה', 'New Apartment')} r={`${offer.baseOffer.newApartmentSizeSqm} ${t('מ"ר', 'sqm')}`} />
                    <Row l={t('תוספת שטח', 'Size Upgrade')} r={`+${offer.baseOffer.tenantUpgradeSqm} ${t('מ"ר', 'sqm')}`} />
                    <Row l={t('דיור חלופי', 'Temp Housing')} r={`${offer.baseOffer.tempHousingMonths} ${t('חודשים', 'months')}`} />
                    <Row l={t('מענק הובלה', 'Moving Grant')} r={nis(offer.baseOffer.movingGrant)} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-red-400 text-lg font-semibold">{t('פרויקט לא כדאי', 'Not Feasible')}</div>
                  <p className="text-gray-500 text-sm mt-1">{offer.baseOffer.reason}</p>
                </div>
              )}
            </Card>

            {/* Replacement Developer Value */}
            {replacementVal && (
              <Card title={t('הערכת רכישת יזם קיים', 'Existing Developer Acquisition')}>
                <Row l={t('עלות שקועה משוערת', 'Est. Sunk Cost')} r={nis(replacementVal.existingDeveloperSunkCost)} />
                <Row l={t('עלות רכישה משוערת', 'Acquisition Cost')} r={nis(replacementVal.acquisitionCostEstimate)} />
                <Row l={t('ערך נטו לאחר רכישה', 'Net Value After Acq.')} r={nis(replacementVal.netValueAfterAcquisition)} bold color={replacementVal.worthAcquiring ? 'green' : 'red'} />
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${replacementVal.worthAcquiring ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                    {replacementVal.worthAcquiring ? t('שווה לרכוש', 'Worth Acquiring') : t('לא שווה', 'Not Worth It')}
                  </span>
                </div>
              </Card>
            )}

            {/* Scenarios Table */}
            {offer.scenarios.length > 0 && (
              <Card title={t('תרחישים', 'Scenarios')}>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-gray-500 border-b border-gray-700/50 uppercase tracking-wider">
                        <th className="text-start py-2 pe-3">{t('תרחיש', 'Scenario')}</th>
                        <th className="text-start py-2 pe-3">{t('תוספת', 'Upgrade')}</th>
                        <th className="text-start py-2 pe-3">{t('רווח %', 'Margin')}</th>
                        <th className="text-start py-2 pe-3">{t('רווח ₪', 'Profit')}</th>
                        <th className="text-start py-2 pe-3">{t('סטטוס', 'Status')}</th>
                        <th className="text-end py-2">{t('ציון', 'Score')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.scenarios.slice(0, 15).map((s, i) => (
                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                          <td className="py-1.5 pe-3 text-gray-300">{isHe ? s.nameHe : s.name}</td>
                          <td className="py-1.5 pe-3">{s.tenantUpgradeSqm} {t('מ"ר', 'sqm')}</td>
                          <td className="py-1.5 pe-3">{pct(s.marginPct)}</td>
                          <td className="py-1.5 pe-3 font-mono">{nis(s.profitNis)}</td>
                          <td className="py-1.5 pe-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              s.feasibility === 'profitable' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
                            }`}>
                              {s.feasibility === 'profitable' ? t('כדאי', 'Good') : t('שולי', 'Marginal')}
                            </span>
                          </td>
                          <td className="py-1.5 text-end font-mono text-blue-300">{s.score.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Competitive Advantages */}
            {offer.competitiveAdvantage.length > 0 && (
              <Card title={t('יתרונות תחרותיים', 'Competitive Advantages')}>
                <div className="space-y-1.5">
                  {offer.competitiveAdvantage.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400 shrink-0">+</span>
                      <span className="text-gray-300">{a}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2 pb-8">
              <button onClick={() => setStep('results')} className="px-5 py-2 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">
                {t('חזרה לתוכנית', 'Back to Plan')}
              </button>
              <button onClick={() => { setPlan(null); setOffer(null); setReplacementVal(null); setStep('input'); window.scrollTo({ top: 0 }); }} className="px-6 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300">
                {t('ניתוח חדש', 'New Analysis')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/40 py-4 text-center text-[11px] text-gray-600">
        PROPCHECK Pinui-Binui Analyzer
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    }>
      <PinuiBinuiApp />
    </Suspense>
  );
}

/* ═══ Form Components ═══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Txt({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 mb-1 block">{label}{required && <span className="text-red-400"> *</span>}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none transition" />
    </label>
  );
}

function Num({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 mb-1 block">{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/60 focus:outline-none transition" />
    </label>
  );
}

function Sel({ label, value, options, onChange }: {
  label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 mb-1 block">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/60 focus:outline-none transition">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className={`w-8 h-4.5 rounded-full relative transition ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
        onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${checked ? 'start-[calc(100%-0.5rem-0.125rem)]' : 'start-0.5'}`} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </label>
  );
}

/* ═══ Display Components ═══ */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-blue-400/90 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: 'blue' | 'green' | 'red' | 'cyan' | 'yellow' }) {
  const cls = color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : color === 'cyan' ? 'text-cyan-400' : color === 'yellow' ? 'text-amber-400' : 'text-white';
  return (
    <div className="bg-gray-800/40 rounded-lg p-3 text-center border border-gray-700/30">
      <div className={`text-xl font-bold leading-tight ${cls}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function Row({ l, r, bold, dim, color }: { l: string; r: string; bold?: boolean; dim?: boolean; color?: 'green' | 'red' | 'yellow' }) {
  const rCls = color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-amber-400' : '';
  return (
    <div className={`flex justify-between py-0.5 text-sm ${bold ? 'font-semibold text-white' : dim ? 'text-gray-500' : 'text-gray-300'}`}>
      <span>{l}</span>
      <span className={`font-mono ${rCls}`}>{r}</span>
    </div>
  );
}

function RatioCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold text-blue-300/90">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

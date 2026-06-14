import type {
  PinuiBinuiInput,
  BusinessPlanResult,
  BusinessPlanStep,
  CostSummary,
  DeveloperOffer,
  ProjectStage,
  BuildingCondition,
} from './types';
import { calcTenantCompensation } from './tenant-compensation';
import { calcConstructionCosts } from './construction-costs';
import { calcRevenue } from './revenue-model';
import { stageRiskMultiplier } from './project-stage';
import {
  PROFESSIONAL_FEES_PCT,
  MARKETING_PCT,
  FINANCING_RATE_PCT,
  CONTINGENCY_PCT,
  TARGET_DEVELOPER_MARGIN_PCT,
  FINANCING_DRAW_SCHEDULE,
  MIN_FREE_TO_TENANT_RATIO,
  MARGINAL_FREE_TO_TENANT_RATIO,
  GOOD_FREE_TO_TENANT_RATIO,
  FEASIBILITY_SCORE_THRESHOLDS,
} from './constants';

export function buildBusinessPlan(input: PinuiBinuiInput): BusinessPlanResult {
  const steps: BusinessPlanStep[] = [];
  let stepNum = 0;

  const addStep = (
    title: string,
    titleHe: string,
    calculation: string,
    result: string,
  ) => {
    steps.push({ step: ++stepNum, title, titleHe, calculation, result });
  };

  // ── Step 1: Existing Building Summary ──

  const totalUnits = input.existingBuildings.reduce(
    (sum, b) => sum + b.floors * b.unitsPerFloor,
    0,
  );
  const totalExistingAreaSqm = input.existingBuildings.reduce(
    (sum, b) => sum + b.floors * b.unitsPerFloor * b.avgUnitSizeSqm,
    0,
  );
  const avgUnitSizeSqm = totalUnits > 0 ? totalExistingAreaSqm / totalUnits : 0;
  const avgCondition = getDominantCondition(input.existingBuildings);

  addStep(
    'Existing Buildings Analysis',
    'ניתוח מבנים קיימים',
    `${input.existingBuildings.length} buildings × units/building → ${totalUnits} total units, ${totalExistingAreaSqm.toLocaleString()} sqm`,
    `${totalUnits} units, avg ${avgUnitSizeSqm.toFixed(0)} sqm/unit`,
  );

  // ── Step 2: Zoning Gains ──

  const zoning = input.zoningRights;
  const totalNewUnits = zoning.maxUnits;
  const totalNewAreaSqm = zoning.residentialRights;
  const unitGain = totalNewUnits - totalUnits;
  const areaMultiplier = totalExistingAreaSqm > 0
    ? totalNewAreaSqm / totalExistingAreaSqm
    : 0;

  addStep(
    'Zoning Rights Calculation',
    'חישוב זכויות בניה',
    `Residential rights: ${totalNewAreaSqm.toLocaleString()} sqm, Max units: ${totalNewUnits}`,
    `Unit gain: +${unitGain}, Area multiplier: ×${areaMultiplier.toFixed(1)}`,
  );

  // ── Step 3: Tenant Compensation ──

  const tenantComp = calcTenantCompensation(
    input.existingBuildings,
    input.tenantUpgradeSqm,
    input.constructionPeriodMonths,
    input.areaTier,
    {
      tempHousingMonthly: input.overrides?.tempHousingMonthly,
      movingCostPerFamily: input.overrides?.movingCostPerFamily,
    },
  );

  addStep(
    'Tenant Compensation',
    'פיצוי דיירים',
    `${tenantComp.totalTenants} tenants × (${tenantComp.newApartmentSizeSqm.toFixed(0)} sqm new apt + temp housing + moving)`,
    `Total: ₪${tenantComp.totalCompensationNis.toLocaleString()}, ₪${tenantComp.compensationPerTenantNis.toLocaleString()}/tenant`,
  );

  // ── Step 4: Construction Costs ──

  const construction = calcConstructionCosts(
    input.existingBuildings,
    totalNewAreaSqm,
    totalNewUnits,
    input.finishLevel,
    {
      constructionCostPerSqm: input.overrides?.constructionCostPerSqm,
      demolitionCostPerSqm: input.overrides?.demolitionCostPerSqm,
    },
  );

  addStep(
    'Construction Costs',
    'עלויות בניה',
    `Demolition: ${construction.demolitionSqm.toLocaleString()} sqm, New: ${totalNewAreaSqm.toLocaleString()} sqm × ₪${construction.constructionCostPerSqm.toLocaleString()}/sqm`,
    `Total direct: ₪${construction.totalDirectCostNis.toLocaleString()}`,
  );

  // ── Step 5: Revenue ──

  const revenue = calcRevenue(
    totalNewUnits,
    tenantComp.totalTenants,
    totalNewAreaSqm,
    tenantComp.totalTenantAreaSqm,
    input.marketPricePerSqm,
  );

  addStep(
    'Revenue Model',
    'מודל הכנסות',
    `${revenue.freeUnits} free units × ${revenue.freeUnitAvgSizeSqm.toFixed(0)} sqm × ₪${input.marketPricePerSqm.toLocaleString()}/sqm`,
    `Gross: ₪${revenue.grossRevenueNis.toLocaleString()}, Net (after VAT): ₪${revenue.netRevenueNis.toLocaleString()}`,
  );

  // ── Step 6: Cost Summary ──

  const profFeesPct = input.overrides?.professionalFeesPct ?? PROFESSIONAL_FEES_PCT;
  const marketingPct = input.overrides?.marketingPct ?? MARKETING_PCT;
  const financingRatePct = input.overrides?.financingRatePct ?? FINANCING_RATE_PCT;
  const contingencyPct = input.overrides?.contingencyPct ?? CONTINGENCY_PCT;

  const baseCost = construction.totalDirectCostNis + tenantComp.totalCompensationNis;
  const professionalFees = baseCost * profFeesPct;
  const marketing = revenue.grossRevenueNis * marketingPct;
  const financing = calcFinancingCost(
    baseCost,
    input.constructionPeriodMonths,
    financingRatePct,
  );
  const contingency = baseCost * contingencyPct;
  const totalProjectCost =
    baseCost + professionalFees + marketing + financing + contingency;

  const costSummary: CostSummary = {
    directConstruction: construction.totalDirectCostNis,
    tenantCompensation: tenantComp.totalCompensationNis,
    professionalFees,
    marketing,
    financing,
    contingency,
    totalProjectCost,
  };

  addStep(
    'Total Project Cost',
    'סה"כ עלות פרויקט',
    `Direct: ₪${baseCost.toLocaleString()} + fees ${(profFeesPct * 100).toFixed(0)}% + marketing ${(marketingPct * 100).toFixed(1)}% + financing + contingency ${(contingencyPct * 100).toFixed(0)}%`,
    `₪${totalProjectCost.toLocaleString()}`,
  );

  // ── Step 7: Developer Offer ──

  const stage = input.stage ?? 'pre_declaration';
  const riskMult = stageRiskMultiplier(stage);
  const marginPct = input.overrides?.developerMarginPct ?? TARGET_DEVELOPER_MARGIN_PCT;
  const estimatedProfitNis = revenue.netRevenueNis - totalProjectCost;
  const profitMarginPct = revenue.netRevenueNis > 0
    ? estimatedProfitNis / revenue.netRevenueNis
    : 0;

  const costPerExistingUnit = totalUnits > 0
    ? totalProjectCost / totalUnits
    : 0;
  const freeToTenantRatio = tenantComp.totalTenants > 0
    ? revenue.freeUnits / tenantComp.totalTenants
    : 0;

  const canOffer = profitMarginPct >= marginPct * 0.5 && freeToTenantRatio >= MIN_FREE_TO_TENANT_RATIO;
  const maxOfferPerUnit = canOffer
    ? Math.max(0, estimatedProfitNis / totalUnits)
    : 0;
  const suggestedOfferPerUnit = maxOfferPerUnit * 0.7 / riskMult;

  const developerOffer: DeveloperOffer = {
    canOffer,
    reason: canOffer
      ? undefined
      : profitMarginPct < marginPct * 0.5
        ? 'Insufficient profit margin'
        : 'Free-to-tenant ratio too low',
    tenantUpgradeSqm: input.tenantUpgradeSqm,
    newApartmentSizeSqm: tenantComp.newApartmentSizeSqm,
    tempHousingMonths: input.constructionPeriodMonths,
    movingGrant: input.overrides?.movingCostPerFamily ?? 18_000,
    freeUnitsForDeveloper: revenue.freeUnits,
    estimatedProfitNis,
    profitMarginPct,
    costPerExistingUnit,
    maxOfferPerUnit,
    suggestedOfferPerUnit,
  };

  addStep(
    'Developer Offer Analysis',
    'ניתוח הצעת יזם',
    `Profit: ₪${estimatedProfitNis.toLocaleString()}, Margin: ${(profitMarginPct * 100).toFixed(1)}%, Free/Tenant ratio: ${freeToTenantRatio.toFixed(2)}`,
    canOffer
      ? `Can offer up to ₪${maxOfferPerUnit.toLocaleString()}/unit, suggested: ₪${suggestedOfferPerUnit.toLocaleString()}/unit`
      : `Not feasible: ${developerOffer.reason}`,
  );

  // ── Ratios & Feasibility ──

  const costPerSqmBuilt = totalNewAreaSqm > 0
    ? totalProjectCost / totalNewAreaSqm
    : 0;
  const revenuePerSqmFree = revenue.totalFreeAreaSqm > 0
    ? revenue.netRevenueNis / revenue.totalFreeAreaSqm
    : 0;
  const profitPerSqmFree = revenue.totalFreeAreaSqm > 0
    ? estimatedProfitNis / revenue.totalFreeAreaSqm
    : 0;
  const breakEvenPricePerSqm = revenue.totalFreeAreaSqm > 0
    ? totalProjectCost / revenue.totalFreeAreaSqm / (1 - 0.18)
    : 0;

  const feasibilityScore = calcFeasibilityScore(
    profitMarginPct,
    freeToTenantRatio,
    riskMult,
  );

  const feasibility: BusinessPlanResult['feasibility'] =
    feasibilityScore >= FEASIBILITY_SCORE_THRESHOLDS.marginal
      ? 'profitable'
      : feasibilityScore >= FEASIBILITY_SCORE_THRESHOLDS.not_feasible
        ? 'marginal'
        : 'not_feasible';

  addStep(
    'Feasibility Assessment',
    'הערכת כדאיות',
    `Score: margin ${(profitMarginPct * 100).toFixed(1)}% × ratio ${freeToTenantRatio.toFixed(2)} × risk ${riskMult.toFixed(2)}`,
    `${feasibility} (score: ${feasibilityScore.toFixed(0)}/100)`,
  );

  return {
    projectName: input.projectName,
    city: input.city,
    stage,
    existingSummary: {
      totalBuildings: input.existingBuildings.length,
      totalUnits,
      totalExistingAreaSqm,
      avgUnitSizeSqm,
      avgCondition,
    },
    zoningGains: {
      totalNewAreaSqm,
      totalNewUnits,
      unitGain,
      areaMultiplier,
    },
    tenantCompensation: tenantComp,
    constructionCosts: construction,
    revenueModel: revenue,
    costSummary,
    developerOffer,
    ratios: {
      freeToTenantRatio,
      costPerSqmBuilt,
      revenuePerSqmFree,
      profitPerSqmFree,
      breakEvenPricePerSqm,
    },
    feasibility,
    feasibilityScore,
    steps,
  };
}

function calcFinancingCost(
  baseCost: number,
  constructionMonths: number,
  annualRate: number,
): number {
  let totalInterest = 0;
  for (let i = 0; i < FINANCING_DRAW_SCHEDULE.length - 1; i++) {
    const seg = FINANCING_DRAW_SCHEDULE[i];
    const next = FINANCING_DRAW_SCHEDULE[i + 1];
    const segMonths = (next.monthPct - seg.monthPct) * constructionMonths;
    const avgDrawn = (seg.drawnPct + next.drawnPct) / 2;
    const principal = baseCost * avgDrawn;
    totalInterest += principal * (annualRate / 12) * segMonths;
  }
  return totalInterest;
}

function calcFeasibilityScore(
  profitMarginPct: number,
  freeToTenantRatio: number,
  riskMultiplier: number,
): number {
  const marginScore = Math.min(40, (profitMarginPct / 0.25) * 40);

  let ratioScore: number;
  if (freeToTenantRatio >= GOOD_FREE_TO_TENANT_RATIO) {
    ratioScore = 40;
  } else if (freeToTenantRatio >= MARGINAL_FREE_TO_TENANT_RATIO) {
    ratioScore = 25 + ((freeToTenantRatio - MARGINAL_FREE_TO_TENANT_RATIO) /
      (GOOD_FREE_TO_TENANT_RATIO - MARGINAL_FREE_TO_TENANT_RATIO)) * 15;
  } else if (freeToTenantRatio >= MIN_FREE_TO_TENANT_RATIO) {
    ratioScore = 10 + ((freeToTenantRatio - MIN_FREE_TO_TENANT_RATIO) /
      (MARGINAL_FREE_TO_TENANT_RATIO - MIN_FREE_TO_TENANT_RATIO)) * 15;
  } else {
    ratioScore = (freeToTenantRatio / MIN_FREE_TO_TENANT_RATIO) * 10;
  }

  const riskScore = 20 / riskMultiplier;

  return Math.min(100, Math.max(0, marginScore + ratioScore + riskScore));
}

function getDominantCondition(
  buildings: { condition: BuildingCondition; floors: number; unitsPerFloor: number }[],
): BuildingCondition {
  const counts = { poor: 0, fair: 0, good: 0 };
  for (const b of buildings) {
    counts[b.condition] += b.floors * b.unitsPerFloor;
  }
  if (counts.poor >= counts.fair && counts.poor >= counts.good) return 'poor';
  if (counts.fair >= counts.good) return 'fair';
  return 'good';
}

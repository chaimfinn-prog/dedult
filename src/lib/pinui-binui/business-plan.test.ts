import { describe, it, expect } from 'vitest';
import { buildBusinessPlan } from './business-plan';
import { calcTenantCompensation } from './tenant-compensation';
import { calcConstructionCosts } from './construction-costs';
import { calcRevenue } from './revenue-model';
import {
  parseProjectStage,
  isStageAtLeast,
  stageRiskMultiplier,
  estimateTimeToCompletionMonths,
} from './project-stage';
import { calcCompetitiveOffer, estimateReplacementDeveloperValue } from './offer-calculator';
import type { PinuiBinuiInput, ExistingBuilding } from './types';
import type { CityPlanResult } from '@/data/plans/types';

const MOCK_BUILDING: ExistingBuilding = {
  address: 'רחוב הרצל 10',
  floors: 4,
  unitsPerFloor: 4,
  avgUnitSizeSqm: 65,
  condition: 'fair',
  yearBuilt: 1970,
  hasElevator: false,
  hasParking: false,
  hasShelter: false,
};

const MOCK_ZONING: CityPlanResult = {
  coveragePct: 40,
  coverageArea: 600,
  coefficient: 3.5,
  maxFloorsLabel: '16',
  baseRights: 4200,
  bonusBreakdown: [],
  totalBonusPct: 0,
  bonusRights: 0,
  residentialRights: 4200,
  publicUse: 200,
  sharedAreas: 400,
  totalAboveGround: 4800,
  maxUnitsByArea: 56,
  maxUnitsByDensity: 60,
  maxUnits: 56,
  smallUnits: 17,
  largeUnits: 39,
  balconies: 672,
  undergroundPerLevel: 900,
  maxUndergroundLevels: 2,
  storage: 252,
  maxCommercial: 840,
  setbacks: { front: 5, side: 3, rear: 4 },
  buildableWidth: 24,
  buildableDepth: 41,
  buildableFootprint: 984,
  unitGain: 40,
  areaRatio: 4.0,
  steps: [],
};

function makeInput(overrides?: Partial<PinuiBinuiInput>): PinuiBinuiInput {
  return {
    projectName: 'הרצל 10 בת ים',
    city: 'בת ים',
    existingBuildings: [MOCK_BUILDING],
    plotArea: 1500,
    plotWidth: 30,
    plotDepth: 50,
    zoningRights: MOCK_ZONING,
    marketPricePerSqm: 35_000,
    areaTier: 'demand',
    finishLevel: 'high',
    constructionPeriodMonths: 36,
    tenantUpgradeSqm: 12,
    stage: 'declared',
    ...overrides,
  };
}

describe('Project Stage', () => {
  it('parses Hebrew status text', () => {
    expect(parseProjectStage('הוכרז')).toBe('declared');
    expect(parseProjectStage('אושרה תב"ע')).toBe('plan_approved');
    expect(parseProjectStage('בביצוע')).toBe('under_construction');
    expect(parseProjectStage('unknown')).toBe('pre_declaration');
  });

  it('compares stages correctly', () => {
    expect(isStageAtLeast('plan_approved', 'declared')).toBe(true);
    expect(isStageAtLeast('declared', 'plan_approved')).toBe(false);
    expect(isStageAtLeast('declared', 'declared')).toBe(true);
  });

  it('returns risk multiplier', () => {
    expect(stageRiskMultiplier('pre_declaration')).toBe(1.25);
    expect(stageRiskMultiplier('permit_issued')).toBe(1.0);
    expect(stageRiskMultiplier('completed')).toBe(0.90);
  });

  it('estimates time to completion', () => {
    expect(estimateTimeToCompletionMonths('declared')).toBe(72);
    expect(estimateTimeToCompletionMonths('completed')).toBe(0);
  });
});

describe('Tenant Compensation', () => {
  it('calculates for single building', () => {
    const result = calcTenantCompensation(
      [MOCK_BUILDING],
      12,
      36,
      'demand',
    );

    expect(result.totalTenants).toBe(16);
    expect(result.newApartmentSizeSqm).toBe(77);
    expect(result.totalTenantAreaSqm).toBe(77 * 16);
    expect(result.tempHousingTotalNis).toBeGreaterThan(0);
    expect(result.movingCostsTotalNis).toBe(18_000 * 2 * 16);
    expect(result.legalFeesTotalNis).toBe(25_000 * 16);
    expect(result.compensationPerTenantNis).toBeGreaterThan(0);
  });

  it('includes buffer months in temp housing', () => {
    const result = calcTenantCompensation([MOCK_BUILDING], 12, 36, 'demand');
    const expectedMonths = 36 + 6;
    expect(result.tempHousingTotalNis).toBe(6_500 * expectedMonths * 16);
  });
});

describe('Construction Costs', () => {
  it('calculates all cost components', () => {
    const result = calcConstructionCosts(
      [MOCK_BUILDING],
      4200,
      56,
      'high',
    );

    expect(result.demolitionSqm).toBe(4 * 4 * 65);
    expect(result.constructionCostPerSqm).toBe(11_000);
    expect(result.constructionCostNis).toBe(4200 * 11_000);
    expect(result.parkingCostNis).toBe(Math.ceil(56 * 1.2) * 180_000);
    expect(result.shelterCostNis).toBe(56 * 4.5 * 12_000);
    expect(result.totalDirectCostNis).toBeGreaterThan(0);
  });

  it('uses override costs when provided', () => {
    const result = calcConstructionCosts(
      [MOCK_BUILDING],
      4200,
      56,
      'high',
      { constructionCostPerSqm: 9_000 },
    );

    expect(result.constructionCostPerSqm).toBe(9_000);
    expect(result.constructionCostNis).toBe(4200 * 9_000);
  });
});

describe('Revenue Model', () => {
  it('calculates free units and revenue', () => {
    const result = calcRevenue(56, 16, 4200, 77 * 16, 35_000);

    expect(result.freeUnits).toBe(40);
    expect(result.tenantUnits).toBe(16);
    expect(result.totalFreeAreaSqm).toBe(4200 - 77 * 16);
    expect(result.grossRevenueNis).toBe(result.totalFreeAreaSqm * 35_000);
    expect(result.vatOnSalesNis).toBe(result.grossRevenueNis * 0.18);
    expect(result.netRevenueNis).toBe(
      result.grossRevenueNis - result.vatOnSalesNis,
    );
  });
});

describe('Business Plan Builder', () => {
  it('produces complete business plan', () => {
    const input = makeInput();
    const plan = buildBusinessPlan(input);

    expect(plan.projectName).toBe('הרצל 10 בת ים');
    expect(plan.city).toBe('בת ים');
    expect(plan.stage).toBe('declared');

    expect(plan.existingSummary.totalUnits).toBe(16);
    expect(plan.existingSummary.totalExistingAreaSqm).toBe(1040);
    expect(plan.existingSummary.avgUnitSizeSqm).toBe(65);

    expect(plan.zoningGains.totalNewUnits).toBe(56);
    expect(plan.zoningGains.unitGain).toBe(40);

    expect(plan.revenueModel.freeUnits).toBe(40);
    expect(plan.revenueModel.tenantUnits).toBe(16);

    expect(plan.costSummary.totalProjectCost).toBeGreaterThan(0);
    expect(plan.developerOffer.estimatedProfitNis).toBeDefined();

    expect(plan.ratios.freeToTenantRatio).toBe(40 / 16);
    expect(plan.ratios.breakEvenPricePerSqm).toBeGreaterThan(0);

    expect(['profitable', 'marginal', 'not_feasible']).toContain(plan.feasibility);
    expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
    expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

    expect(plan.steps.length).toBeGreaterThanOrEqual(7);
  });

  it('handles periphery low-value project', () => {
    const plan = buildBusinessPlan(makeInput({
      marketPricePerSqm: 15_000,
      areaTier: 'periphery',
      finishLevel: 'standard',
    }));

    expect(plan.developerOffer.profitMarginPct).toBeLessThan(
      buildBusinessPlan(makeInput()).developerOffer.profitMarginPct,
    );
  });

  it('handles high-demand area', () => {
    const plan = buildBusinessPlan(makeInput({
      marketPricePerSqm: 60_000,
      areaTier: 'high_demand',
    }));

    expect(plan.feasibility).toBe('profitable');
    expect(plan.developerOffer.canOffer).toBe(true);
  });

  it('applies cost overrides', () => {
    const plan = buildBusinessPlan(makeInput({
      overrides: {
        constructionCostPerSqm: 7_000,
        contingencyPct: 0.03,
        developerMarginPct: 0.15,
      },
    }));

    expect(plan.constructionCosts.constructionCostPerSqm).toBe(7_000);
  });

  it('multiple buildings aggregate correctly', () => {
    const secondBuilding: ExistingBuilding = {
      address: 'הרצל 12',
      floors: 3,
      unitsPerFloor: 3,
      avgUnitSizeSqm: 55,
      condition: 'poor',
      yearBuilt: 1965,
      hasElevator: false,
      hasParking: false,
      hasShelter: false,
    };

    const plan = buildBusinessPlan(makeInput({
      existingBuildings: [MOCK_BUILDING, secondBuilding],
    }));

    expect(plan.existingSummary.totalBuildings).toBe(2);
    expect(plan.existingSummary.totalUnits).toBe(16 + 9);
    expect(plan.existingSummary.totalExistingAreaSqm).toBe(16 * 65 + 9 * 55);
  });
});

describe('Competitive Offer', () => {
  it('generates multiple scenarios', () => {
    const result = calcCompetitiveOffer(makeInput());

    expect(result.scenarios.length).toBeGreaterThan(0);
    expect(result.baseOffer).toBeDefined();

    for (const s of result.scenarios) {
      expect(s.feasibility).not.toBe('not_feasible');
      expect(s.tenantUpgradeSqm).toBeGreaterThan(0);
    }
  });

  it('sorts scenarios by score descending', () => {
    const result = calcCompetitiveOffer(makeInput());

    for (let i = 1; i < result.scenarios.length; i++) {
      expect(result.scenarios[i - 1].score).toBeGreaterThanOrEqual(
        result.scenarios[i].score,
      );
    }
  });

  it('best scenario has highest score', () => {
    const result = calcCompetitiveOffer(makeInput());

    if (result.bestScenario && result.scenarios.length > 1) {
      expect(result.bestScenario.score).toBe(result.scenarios[0].score);
    }
  });
});

describe('Replacement Developer Value', () => {
  it('estimates sunk cost by stage', () => {
    const earlyPlan = buildBusinessPlan(makeInput({ stage: 'declared' }));
    const latePlan = buildBusinessPlan(makeInput({ stage: 'plan_approved' }));

    const earlyVal = estimateReplacementDeveloperValue(earlyPlan);
    const lateVal = estimateReplacementDeveloperValue(latePlan);

    expect(lateVal.existingDeveloperSunkCost).toBeGreaterThan(
      earlyVal.existingDeveloperSunkCost,
    );
    expect(lateVal.acquisitionCostEstimate).toBeGreaterThan(
      earlyVal.acquisitionCostEstimate,
    );
  });
});

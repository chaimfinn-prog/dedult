import type { BusinessPlanResult, DeveloperOffer, PinuiBinuiInput } from './types';
import { buildBusinessPlan } from './business-plan';
import { TARGET_DEVELOPER_MARGIN_PCT, DEFAULT_TENANT_UPGRADE_SQM } from './constants';

export interface CompetitiveOffer {
  baseOffer: DeveloperOffer;
  scenarios: OfferScenario[];
  bestScenario: OfferScenario | null;
  competitiveAdvantage: string[];
}

export interface OfferScenario {
  name: string;
  nameHe: string;
  tenantUpgradeSqm: number;
  marginPct: number;
  profitNis: number;
  feasibility: BusinessPlanResult['feasibility'];
  score: number;
}

export function calcCompetitiveOffer(
  input: PinuiBinuiInput,
): CompetitiveOffer {
  const basePlan = buildBusinessPlan(input);
  const baseOffer = basePlan.developerOffer;

  const scenarios: OfferScenario[] = [];

  const upgrades = [10, 12, 15, 20, 25];
  const margins = [0.12, 0.15, 0.18, 0.20, 0.25];

  for (const upgrade of upgrades) {
    for (const margin of margins) {
      const plan = buildBusinessPlan({
        ...input,
        tenantUpgradeSqm: upgrade,
        overrides: {
          ...input.overrides,
          developerMarginPct: margin,
        },
      });

      if (plan.feasibility !== 'not_feasible') {
        scenarios.push({
          name: `+${upgrade}sqm @ ${(margin * 100).toFixed(0)}% margin`,
          nameHe: `+${upgrade} מ"ר @ ${(margin * 100).toFixed(0)}% רווח`,
          tenantUpgradeSqm: upgrade,
          marginPct: plan.developerOffer.profitMarginPct,
          profitNis: plan.developerOffer.estimatedProfitNis,
          feasibility: plan.feasibility,
          score: plan.feasibilityScore,
        });
      }
    }
  }

  scenarios.sort((a, b) => b.score - a.score);

  const bestScenario = scenarios.length > 0 ? scenarios[0] : null;

  const competitiveAdvantage = buildAdvantageList(basePlan);

  return {
    baseOffer,
    scenarios,
    bestScenario,
    competitiveAdvantage,
  };
}

function buildAdvantageList(plan: BusinessPlanResult): string[] {
  const advantages: string[] = [];

  if (plan.developerOffer.profitMarginPct > TARGET_DEVELOPER_MARGIN_PCT) {
    advantages.push('Room to offer larger apartments to tenants');
  }

  if (plan.ratios.freeToTenantRatio > 1.5) {
    advantages.push('High free-to-tenant ratio allows premium tenant packages');
  }

  if (plan.zoningGains.areaMultiplier > 3) {
    advantages.push('Strong zoning multiplier creates significant value');
  }

  if (plan.existingSummary.avgCondition === 'poor') {
    advantages.push('Poor building condition strengthens tenant motivation');
  }

  if (plan.tenantCompensation.totalTenants <= 40) {
    advantages.push('Manageable tenant count reduces coordination risk');
  }

  if (plan.tenantCompensation.totalTenants > 60) {
    advantages.push('Large scale project offers economies of scale');
  }

  return advantages;
}

export function estimateReplacementDeveloperValue(
  plan: BusinessPlanResult,
): {
  existingDeveloperSunkCost: number;
  acquisitionCostEstimate: number;
  netValueAfterAcquisition: number;
  worthAcquiring: boolean;
} {
  const sunkCostPct = stageToSunkCostPct(plan.stage);
  const existingDeveloperSunkCost = plan.costSummary.totalProjectCost * sunkCostPct;

  const acquisitionCostEstimate = existingDeveloperSunkCost * 1.15;

  const netValueAfterAcquisition =
    plan.developerOffer.estimatedProfitNis - acquisitionCostEstimate;

  return {
    existingDeveloperSunkCost,
    acquisitionCostEstimate,
    netValueAfterAcquisition,
    worthAcquiring: netValueAfterAcquisition > 0,
  };
}

function stageToSunkCostPct(stage: BusinessPlanResult['stage']): number {
  switch (stage) {
    case 'pre_declaration': return 0.02;
    case 'declared': return 0.05;
    case 'plan_submitted': return 0.10;
    case 'plan_approved': return 0.15;
    case 'permit_issued': return 0.20;
    case 'under_construction': return 0.50;
    case 'completed': return 1.0;
  }
}

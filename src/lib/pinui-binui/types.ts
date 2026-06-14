import type { CityPlanResult } from '@/data/plans/types';

// ── Project Stage ──

export type ProjectStage =
  | 'pre_declaration'     // לפני הכרזה
  | 'declared'            // הוכרז
  | 'plan_submitted'      // תב"ע הוגשה
  | 'plan_approved'       // תב"ע אושרה
  | 'permit_issued'       // היתר בניה
  | 'under_construction'  // בביצוע
  | 'completed';          // הושלם

export type BuildingCondition = 'poor' | 'fair' | 'good';
export type FinishLevel = 'standard' | 'high' | 'luxury';
export type AreaTier = 'periphery' | 'mid' | 'demand' | 'high_demand';

// ── Inputs ──

export interface PinuiBinuiInput {
  projectName: string;
  city: string;
  neighborhood?: string;

  existingBuildings: ExistingBuilding[];

  plotArea: number;        // sqm
  plotWidth: number;       // m
  plotDepth: number;       // m

  zoningRights: CityPlanResult;

  marketPricePerSqm: number;
  areaTier: AreaTier;
  finishLevel: FinishLevel;

  constructionPeriodMonths: number;
  tenantUpgradeSqm: number;

  stage?: ProjectStage;
  existingDeveloper?: string;

  overrides?: Partial<CostOverrides>;
}

export interface ExistingBuilding {
  address: string;
  floors: number;
  unitsPerFloor: number;
  avgUnitSizeSqm: number;
  condition: BuildingCondition;
  yearBuilt?: number;
  hasElevator: boolean;
  hasParking: boolean;
  hasShelter: boolean;
}

export interface CostOverrides {
  constructionCostPerSqm: number;
  demolitionCostPerSqm: number;
  tempHousingMonthly: number;
  movingCostPerFamily: number;
  professionalFeesPct: number;
  marketingPct: number;
  financingRatePct: number;
  contingencyPct: number;
  developerMarginPct: number;
}

// ── Tenant Compensation ──

export interface TenantCompensation {
  totalTenants: number;
  newApartmentSizeSqm: number;
  totalTenantAreaSqm: number;
  tempHousingTotalNis: number;
  movingCostsTotalNis: number;
  legalFeePerTenantNis: number;
  legalFeesTotalNis: number;
  totalCompensationNis: number;
  compensationPerTenantNis: number;
}

// ── Construction Costs ──

export interface ConstructionCosts {
  demolitionSqm: number;
  demolitionCostNis: number;
  newConstructionSqm: number;
  constructionCostPerSqm: number;
  constructionCostNis: number;
  infrastructureCostNis: number;
  parkingCostNis: number;
  shelterCostNis: number;
  totalDirectCostNis: number;
}

// ── Revenue Model ──

export interface RevenueModel {
  totalNewUnits: number;
  tenantUnits: number;
  freeUnits: number;
  freeUnitAvgSizeSqm: number;
  totalFreeAreaSqm: number;
  pricePerSqm: number;
  grossRevenueNis: number;
  vatOnSalesNis: number;
  netRevenueNis: number;
}

// ── Cost Summary ──

export interface CostSummary {
  directConstruction: number;
  tenantCompensation: number;
  professionalFees: number;
  marketing: number;
  financing: number;
  contingency: number;
  totalProjectCost: number;
}

// ── Developer Offer ──

export interface DeveloperOffer {
  canOffer: boolean;
  reason?: string;

  tenantUpgradeSqm: number;
  newApartmentSizeSqm: number;
  tempHousingMonths: number;
  movingGrant: number;

  freeUnitsForDeveloper: number;
  estimatedProfitNis: number;
  profitMarginPct: number;
  costPerExistingUnit: number;

  maxOfferPerUnit: number;
  suggestedOfferPerUnit: number;
}

// ── Full Business Plan Output ──

export interface BusinessPlanResult {
  projectName: string;
  city: string;
  stage: ProjectStage;

  existingSummary: {
    totalBuildings: number;
    totalUnits: number;
    totalExistingAreaSqm: number;
    avgUnitSizeSqm: number;
    avgCondition: BuildingCondition;
  };

  zoningGains: {
    totalNewAreaSqm: number;
    totalNewUnits: number;
    unitGain: number;
    areaMultiplier: number;
  };

  tenantCompensation: TenantCompensation;
  constructionCosts: ConstructionCosts;
  revenueModel: RevenueModel;
  costSummary: CostSummary;
  developerOffer: DeveloperOffer;

  ratios: {
    freeToTenantRatio: number;
    costPerSqmBuilt: number;
    revenuePerSqmFree: number;
    profitPerSqmFree: number;
    breakEvenPricePerSqm: number;
  };

  feasibility: 'profitable' | 'marginal' | 'not_feasible';
  feasibilityScore: number;

  steps: BusinessPlanStep[];
}

export interface BusinessPlanStep {
  step: number;
  title: string;
  titleHe: string;
  calculation: string;
  result: string;
}

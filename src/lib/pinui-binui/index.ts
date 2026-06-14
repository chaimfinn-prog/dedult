export type {
  PinuiBinuiInput,
  ExistingBuilding,
  BusinessPlanResult,
  BusinessPlanStep,
  TenantCompensation,
  ConstructionCosts,
  RevenueModel,
  CostSummary,
  DeveloperOffer,
  CostOverrides,
  ProjectStage,
  BuildingCondition,
  FinishLevel,
  AreaTier,
} from './types';

export { buildBusinessPlan } from './business-plan';
export { calcTenantCompensation } from './tenant-compensation';
export { calcConstructionCosts } from './construction-costs';
export { calcRevenue } from './revenue-model';
export { calcCompetitiveOffer, estimateReplacementDeveloperValue } from './offer-calculator';
export type { CompetitiveOffer, OfferScenario } from './offer-calculator';

export {
  parseProjectStage,
  getStageLabel,
  getStageIndex,
  isStageAtLeast,
  stageRiskMultiplier,
  estimateTimeToCompletionMonths,
} from './project-stage';

import type { AreaTier, BuildingCondition, FinishLevel } from './types';

// ── Construction Costs (NIS/sqm, 2026 market rates) ──

export const CONSTRUCTION_COST_PER_SQM: Record<FinishLevel, number> = {
  standard: 8_500,
  high: 11_000,
  luxury: 14_000,
};

export const DEMOLITION_COST_PER_SQM: Record<BuildingCondition, number> = {
  poor: 450,
  fair: 550,
  good: 650,
};

export const INFRASTRUCTURE_COST_PER_SQM = 1_200;
export const PARKING_COST_PER_SPOT = 180_000;
export const SHELTER_COST_PER_SQM = 12_000;
export const SHELTER_SQM_PER_UNIT = 4.5;

// ── Tenant Compensation ──

export const TEMP_HOUSING_MONTHLY: Record<AreaTier, number> = {
  periphery: 3_500,
  mid: 5_000,
  demand: 6_500,
  high_demand: 8_500,
};

export const MOVING_COST_PER_FAMILY = 18_000;
export const LEGAL_FEE_PER_TENANT = 25_000;
export const DEFAULT_TENANT_UPGRADE_SQM = 12;
export const TEMP_HOUSING_BUFFER_MONTHS = 6;

// ── Professional Fees ──

export const PROFESSIONAL_FEES_PCT = 0.04;
export const MARKETING_PCT = 0.025;
export const FINANCING_RATE_PCT = 0.055;
export const CONTINGENCY_PCT = 0.07;
export const TARGET_DEVELOPER_MARGIN_PCT = 0.20;

// ── Tax & VAT ──

export const VAT_RATE = 0.18;
export const PINUI_BINUI_PURCHASE_TAX_EXEMPT_CEILING = 2_253_000;
export const BETTERMENT_LEVY_EXEMPT = true;

// ── Feasibility Thresholds ──

export const MIN_FREE_TO_TENANT_RATIO = 0.6;
export const MARGINAL_FREE_TO_TENANT_RATIO = 1.0;
export const GOOD_FREE_TO_TENANT_RATIO = 1.5;

export const FEASIBILITY_SCORE_THRESHOLDS = {
  not_feasible: 40,
  marginal: 60,
};

// ── Financing Assumptions ──

export const FINANCING_DRAW_SCHEDULE = [
  { monthPct: 0.0, drawnPct: 0.15 },
  { monthPct: 0.25, drawnPct: 0.40 },
  { monthPct: 0.50, drawnPct: 0.70 },
  { monthPct: 0.75, drawnPct: 0.90 },
  { monthPct: 1.0, drawnPct: 1.0 },
];

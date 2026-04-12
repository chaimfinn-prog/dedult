// ── City Plan Config — config-driven rights calculator ──────
// Each city plan is a JSON file conforming to this interface.
// Adding a new city = adding a JSON file + one registry line.

export interface CityPlanConfig {
  id: string;
  planNumber: string;
  planName: string;
  city: string;
  citySlug: string;

  coefficientTable: CoefficientEntry[];
  coverage: CoverageRule[];
  bonuses: BonusConfig[];
  setbacks: SetbackRule[];
  constants: PlanConstants;
  unitSizes: UnitSizeConfig;
  extraRules: ExtraRuleConfig[];
}

export interface CoefficientEntry {
  existingFloors: number;
  coefficient: number;
  maxFloorsLabel: string;
}

export interface CoverageRule {
  maxArea: number | null; // null = no upper bound (JSON lacks Infinity)
  coveragePct: number;
}

export interface BonusConfig {
  id: string;
  label: string;
  description: string;
  pct: number;
  linkedInputId?: string; // auto-toggle when this input is truthy
}

export interface SetbackRule {
  maxWidth: number | null; // null = no upper bound
  side: number;
  rear: number;
}

export interface PlanConstants {
  publicUseSqm: number;
  publicUseThreshold: number;
  sharedAreasSqm: number;
  balconySqmPerUnit: number;
  storageSqmPerUnit: number;
  undergroundCoveragePct: number;
  maxUndergroundLevels: number;
  maxCommercialPct: number;
  densityUnitsPerDunam: number;
  frontSetbackM: number;
  minBuildingDistanceM: number;
  maxMergePlotArea: number;
}

export interface UnitSizeConfig {
  smallMaxSqm: number;
  smallAvgSqm: number;
  largeAvgSqm: number;
  smallPctMin: number;
  smallPctMax: number;
  smallPctDefault: number;
}

export interface ExtraRuleConfig {
  id: string;
  title: string;
  description: string;
  value: string;
  valueType: 'sqm' | 'text' | 'badge';
}

// ── Calculator Input / Output ───────────────────────────────

export interface CityPlanInput {
  plotArea: number;
  plotWidth: number;
  plotDepth: number;
  existingFloors: number;
  existingBuiltArea: number;
  existingUnits: number;
  existingAvgUnitSize: number;
  smallApartmentPct: number;
  hasRoofApartment: boolean;
  selectedBonusIds: string[];
}

export interface BonusLineItem {
  id: string;
  label: string;
  pct: number;
  area: number;
}

export interface CityPlanResult {
  coveragePct: number;
  coverageArea: number;

  coefficient: number;
  maxFloorsLabel: string;

  baseRights: number;
  bonusBreakdown: BonusLineItem[];
  totalBonusPct: number;
  bonusRights: number;
  residentialRights: number;
  publicUse: number;
  sharedAreas: number;
  totalAboveGround: number;

  maxUnitsByArea: number;
  maxUnitsByDensity: number;
  maxUnits: number;
  smallUnits: number;
  largeUnits: number;

  balconies: number;
  undergroundPerLevel: number;
  maxUndergroundLevels: number;
  storage: number;
  maxCommercial: number;

  setbacks: { front: number; side: number; rear: number } | null;
  buildableWidth: number;
  buildableDepth: number;
  buildableFootprint: number;

  unitGain: number | null;
  areaRatio: number | null;

  steps: CalculationStep[];
}

export interface CalculationStep {
  step: number;
  title: string;
  calculation: string;
  result: string;
}

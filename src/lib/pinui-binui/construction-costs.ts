import type {
  ExistingBuilding,
  ConstructionCosts,
  FinishLevel,
} from './types';
import {
  CONSTRUCTION_COST_PER_SQM,
  DEMOLITION_COST_PER_SQM,
  INFRASTRUCTURE_COST_PER_SQM,
  PARKING_COST_PER_SPOT,
  SHELTER_COST_PER_SQM,
  SHELTER_SQM_PER_UNIT,
} from './constants';

export function calcConstructionCosts(
  buildings: ExistingBuilding[],
  totalNewAreaSqm: number,
  totalNewUnits: number,
  finishLevel: FinishLevel,
  overrides?: {
    constructionCostPerSqm?: number;
    demolitionCostPerSqm?: number;
  },
): ConstructionCosts {
  const demolitionSqm = buildings.reduce(
    (sum, b) => sum + b.floors * b.unitsPerFloor * b.avgUnitSizeSqm,
    0,
  );

  const avgCondition = dominantCondition(buildings);
  const demoCostPerSqm =
    overrides?.demolitionCostPerSqm ?? DEMOLITION_COST_PER_SQM[avgCondition];
  const demolitionCostNis = demolitionSqm * demoCostPerSqm;

  const constructionCostPerSqm =
    overrides?.constructionCostPerSqm ?? CONSTRUCTION_COST_PER_SQM[finishLevel];
  const constructionCostNis = totalNewAreaSqm * constructionCostPerSqm;

  const infrastructureCostNis = totalNewAreaSqm * INFRASTRUCTURE_COST_PER_SQM;

  const parkingSpots = Math.ceil(totalNewUnits * 1.2);
  const parkingCostNis = parkingSpots * PARKING_COST_PER_SPOT;

  const shelterSqm = totalNewUnits * SHELTER_SQM_PER_UNIT;
  const shelterCostNis = shelterSqm * SHELTER_COST_PER_SQM;

  const totalDirectCostNis =
    demolitionCostNis +
    constructionCostNis +
    infrastructureCostNis +
    parkingCostNis +
    shelterCostNis;

  return {
    demolitionSqm,
    demolitionCostNis,
    newConstructionSqm: totalNewAreaSqm,
    constructionCostPerSqm,
    constructionCostNis,
    infrastructureCostNis,
    parkingCostNis,
    shelterCostNis,
    totalDirectCostNis,
  };
}

function dominantCondition(
  buildings: ExistingBuilding[],
): ExistingBuilding['condition'] {
  const counts = { poor: 0, fair: 0, good: 0 };
  for (const b of buildings) {
    const units = b.floors * b.unitsPerFloor;
    counts[b.condition] += units;
  }
  if (counts.poor >= counts.fair && counts.poor >= counts.good) return 'poor';
  if (counts.fair >= counts.good) return 'fair';
  return 'good';
}

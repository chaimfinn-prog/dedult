import type { ExistingBuilding, TenantCompensation, AreaTier } from './types';
import {
  TEMP_HOUSING_MONTHLY,
  MOVING_COST_PER_FAMILY,
  LEGAL_FEE_PER_TENANT,
  TEMP_HOUSING_BUFFER_MONTHS,
} from './constants';

export function calcTenantCompensation(
  buildings: ExistingBuilding[],
  tenantUpgradeSqm: number,
  constructionPeriodMonths: number,
  areaTier: AreaTier,
  overrides?: {
    tempHousingMonthly?: number;
    movingCostPerFamily?: number;
  },
): TenantCompensation {
  const totalTenants = buildings.reduce(
    (sum, b) => sum + b.floors * b.unitsPerFloor,
    0,
  );

  const avgExistingSize =
    buildings.reduce(
      (sum, b) => sum + b.avgUnitSizeSqm * b.floors * b.unitsPerFloor,
      0,
    ) / totalTenants;

  const newApartmentSizeSqm = avgExistingSize + tenantUpgradeSqm;
  const totalTenantAreaSqm = newApartmentSizeSqm * totalTenants;

  const monthlyRate = overrides?.tempHousingMonthly ?? TEMP_HOUSING_MONTHLY[areaTier];
  const totalMonths = constructionPeriodMonths + TEMP_HOUSING_BUFFER_MONTHS;
  const tempHousingTotalNis = monthlyRate * totalMonths * totalTenants;

  const movingCost = overrides?.movingCostPerFamily ?? MOVING_COST_PER_FAMILY;
  const movingCostsTotalNis = movingCost * 2 * totalTenants;

  const legalFeePerTenantNis = LEGAL_FEE_PER_TENANT;
  const legalFeesTotalNis = legalFeePerTenantNis * totalTenants;

  const totalCompensationNis =
    tempHousingTotalNis + movingCostsTotalNis + legalFeesTotalNis;

  return {
    totalTenants,
    newApartmentSizeSqm,
    totalTenantAreaSqm,
    tempHousingTotalNis,
    movingCostsTotalNis,
    legalFeePerTenantNis,
    legalFeesTotalNis,
    totalCompensationNis,
    compensationPerTenantNis: totalTenants > 0
      ? totalCompensationNis / totalTenants
      : 0,
  };
}

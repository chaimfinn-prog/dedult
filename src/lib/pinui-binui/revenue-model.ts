import type { RevenueModel } from './types';
import { VAT_RATE } from './constants';

export function calcRevenue(
  totalNewUnits: number,
  tenantUnits: number,
  totalNewAreaSqm: number,
  tenantAreaSqm: number,
  marketPricePerSqm: number,
): RevenueModel {
  const freeUnits = totalNewUnits - tenantUnits;
  const totalFreeAreaSqm = totalNewAreaSqm - tenantAreaSqm;
  const freeUnitAvgSizeSqm = freeUnits > 0 ? totalFreeAreaSqm / freeUnits : 0;

  const grossRevenueNis = totalFreeAreaSqm * marketPricePerSqm;
  const vatOnSalesNis = grossRevenueNis * VAT_RATE;
  const netRevenueNis = grossRevenueNis - vatOnSalesNis;

  return {
    totalNewUnits,
    tenantUnits,
    freeUnits,
    freeUnitAvgSizeSqm,
    totalFreeAreaSqm,
    pricePerSqm: marketPricePerSqm,
    grossRevenueNis,
    vatOnSalesNis,
    netRevenueNis,
  };
}

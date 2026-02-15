import { RENT_EXEMPTION_CEILING } from './constants';
import type { RentalTrack } from './types';

export function calcRentalTax(
  monthlyRentNis: number,
  rentalTrack: RentalTrack,
  marginalTaxRatePct: number,
  deductibleExpensesAnnualNis: number
) {
  const annualGrossRentNis = monthlyRentNis * 12;

  if (rentalTrack === 'flat10') {
    return { annualGrossRentNis, rentalTaxAnnualNis: annualGrossRentNis * 0.1 };
  }

  if (rentalTrack === 'marginal') {
    const taxable = Math.max(annualGrossRentNis - deductibleExpensesAnnualNis, 0);
    return { annualGrossRentNis, rentalTaxAnnualNis: taxable * (marginalTaxRatePct / 100) };
  }

  const excess = Math.max(monthlyRentNis - RENT_EXEMPTION_CEILING, 0);
  const adjustedExemption = Math.max(RENT_EXEMPTION_CEILING - excess, 0);
  const monthlyTaxable = Math.max(monthlyRentNis - adjustedExemption, 0);

  return {
    annualGrossRentNis,
    rentalTaxAnnualNis: monthlyTaxable * 12 * (marginalTaxRatePct / 100),
  };
}

export function calcOperatingCosts(
  annualGrossRentNis: number,
  managementFeePct: number,
  annualArnonaNis: number,
  vacancyPct: number,
  repairReservePct: number,
  contractPriceNis: number
) {
  const management = annualGrossRentNis * (managementFeePct / 100);
  const vacancy = annualGrossRentNis * (vacancyPct / 100);
  const repairs = contractPriceNis * (repairReservePct / 100);
  return management + annualArnonaNis + vacancy + repairs;
}

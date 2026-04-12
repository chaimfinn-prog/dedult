import { describe, it, expect } from 'vitest';
import { runFeasibility } from './simulation';
import type { FeasibilityInputs } from './types';

function makeInputs(overrides: Partial<FeasibilityInputs> = {}): FeasibilityInputs {
  return {
    contractPriceNis: 2_000_000,
    buyerStatus: 'single_home_resident',
    resident: true,
    propertyType: 'second_hand',
    legalFeeNis: 10_000,
    brokerFeeNis: 20_000,
    downPaymentPct: 30,
    additionalSecuredDebtNis: 0,
    loanPurpose: 'single_home',
    borrowerMonthlyDisposableIncomeNis: 25_000,
    mortgageYears: 25,
    fixedRateAnnualPct: 4,
    primeRateAnnualPct: 5,
    variableIndexedAnnualPct: 3,
    annualConstructionIndexPct: 3,
    paymentSchedule: [
      { date: '2025-01-01', amountNis: 600_000 },
      { date: '2025-06-01', amountNis: 400_000 },
    ],
    contractualDeliveryDate: '2027-01-01',
    monthlyRentNis: 5_000,
    rentalTrack: 'flat10',
    marginalTaxRatePct: 30,
    deductibleExpensesAnnualNis: 0,
    managementFeePct: 8,
    annualArnonaNis: 5_000,
    vacancyPct: 5,
    repairReservePct: 1,
    distanceToTransitMeters: 300,
    annualAppreciationPct: 3,
    ...overrides,
  };
}

describe('runFeasibility', () => {
  it('computes all output fields', () => {
    const result = runFeasibility(makeInputs());
    expect(result.purchaseTaxNis).toBeGreaterThanOrEqual(0);
    expect(result.totalAcquisitionCostNis).toBeGreaterThan(0);
    expect(result.monthlyMortgagePaymentNis).toBeGreaterThan(0);
    expect(result.annualGrossRentNis).toBe(60_000);
    expect(result.rentalTaxAnnualNis).toBe(6_000);
    expect(result.projected10ySaleValueNis).toBeGreaterThan(2_000_000);
    expect(result.sensitivity).toHaveLength(3);
    expect(result.sensitivity[0]).toHaveLength(3);
    expect(result.waterfall.annualPrincipalNis).toBeGreaterThan(0);
  });

  it('passes financing constraints for standard inputs', () => {
    const result = runFeasibility(makeInputs());
    expect(result.maxAllowedLtvPct).toBe(75);
    expect(result.financingConstraintsPassed).toBe(true);
  });

  it('fails financing for investor with low down payment', () => {
    const result = runFeasibility(makeInputs({
      buyerStatus: 'investor_resident',
      loanPurpose: 'investment',
      downPaymentPct: 20,
    }));
    expect(result.financingConstraintsPassed).toBe(false);
  });

  it('applies transit uplift to projected sale value', () => {
    const near = runFeasibility(makeInputs({ distanceToTransitMeters: 100 }));
    const far = runFeasibility(makeInputs({ distanceToTransitMeters: 5000 }));
    expect(near.transitUpliftPct).toBeGreaterThan(far.transitUpliftPct);
    expect(near.projected10ySaleValueNis).toBeGreaterThan(far.projected10ySaleValueNis);
  });

  it('charges VAT for new developer property', () => {
    const result = runFeasibility(makeInputs({ propertyType: 'new_from_developer' }));
    expect(result.vatOnPropertyNis).toBeGreaterThan(0);
  });

  it('no VAT on property for second hand', () => {
    const result = runFeasibility(makeInputs({ propertyType: 'second_hand' }));
    expect(result.vatOnPropertyNis).toBe(0);
  });

  it('computes XIRR as a percentage', () => {
    const result = runFeasibility(makeInputs());
    expect(typeof result.xirr10yPct).toBe('number');
    expect(Number.isFinite(result.xirr10yPct)).toBe(true);
  });
});

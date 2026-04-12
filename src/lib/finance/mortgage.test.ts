import { describe, it, expect } from 'vitest';
import { calcMortgage } from './mortgage';

describe('calcMortgage', () => {
  it('calculates LTV correctly for single home resident', () => {
    const result = calcMortgage(1_000_000, 30, 0, 'single_home', true, 20_000, 25, 4);
    expect(result.maxAllowedLtvPct).toBe(75);
    expect(result.aggregateLtvPct).toBe(70); // 70% loan
    expect(result.financingConstraintsPassed).toBe(true);
  });

  it('caps LTV at 50% for non-resident', () => {
    const result = calcMortgage(1_000_000, 30, 0, 'single_home', false, 20_000, 25, 4);
    expect(result.maxAllowedLtvPct).toBe(50);
    expect(result.financingConstraintsPassed).toBe(false); // 70% > 50%
  });

  it('caps LTV at 70% for replacement home', () => {
    const result = calcMortgage(1_000_000, 35, 0, 'replacement_home', true, 20_000, 25, 4);
    expect(result.maxAllowedLtvPct).toBe(70);
    expect(result.aggregateLtvPct).toBe(65);
    expect(result.financingConstraintsPassed).toBe(true);
  });

  it('caps LTV at 50% for investment', () => {
    const result = calcMortgage(1_000_000, 55, 0, 'investment', true, 20_000, 25, 4);
    expect(result.maxAllowedLtvPct).toBe(50);
    expect(result.aggregateLtvPct).toBeCloseTo(45, 10);
    expect(result.financingConstraintsPassed).toBe(true);
  });

  it('includes additional secured debt in aggregate LTV', () => {
    const result = calcMortgage(1_000_000, 50, 200_000, 'single_home', true, 20_000, 25, 4);
    // primary loan = 500,000, aggregate = 700,000, LTV = 70%
    expect(result.aggregateLtvPct).toBe(70);
  });

  it('flags PTI risk premium above 40%', () => {
    const result = calcMortgage(1_000_000, 20, 0, 'single_home', true, 5_000, 25, 4);
    expect(result.ptiRiskPremiumFlag).toBe(true);
  });

  it('fails constraints if mortgage years > 30', () => {
    const result = calcMortgage(1_000_000, 30, 0, 'single_home', true, 50_000, 35, 4);
    expect(result.financingConstraintsPassed).toBe(false);
  });

  it('handles zero interest rate', () => {
    const result = calcMortgage(1_200_000, 0, 0, 'single_home', true, 50_000, 25, 0);
    // 0% rate: monthly = principal / months = 1,200,000 / 300 = 4,000
    expect(result.monthlyMortgagePaymentNis).toBe(4_000);
  });

  it('returns 0 monthly payment when 100% down', () => {
    const result = calcMortgage(1_000_000, 100, 0, 'single_home', true, 20_000, 25, 4);
    expect(result.monthlyMortgagePaymentNis).toBe(0);
    expect(result.primaryLoanNis).toBe(0);
  });

  it('fails PTI if no disposable income', () => {
    const result = calcMortgage(1_000_000, 30, 0, 'single_home', true, 0, 25, 4);
    expect(result.ptiPct).toBe(100);
    expect(result.financingConstraintsPassed).toBe(false);
  });
});

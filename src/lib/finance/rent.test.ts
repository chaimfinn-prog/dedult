import { describe, it, expect } from 'vitest';
import { calcRentalTax, calcOperatingCosts } from './rent';

describe('calcRentalTax', () => {
  it('applies flat 10% for flat10 track', () => {
    const result = calcRentalTax(5_000, 'flat10', 30, 0);
    expect(result.annualGrossRentNis).toBe(60_000);
    expect(result.rentalTaxAnnualNis).toBe(6_000);
  });

  it('applies marginal rate with deductions', () => {
    const result = calcRentalTax(5_000, 'marginal', 35, 20_000);
    expect(result.annualGrossRentNis).toBe(60_000);
    // taxable = 60,000 - 20,000 = 40,000
    expect(result.rentalTaxAnnualNis).toBe(40_000 * 0.35);
  });

  it('does not go negative for marginal with large deductions', () => {
    const result = calcRentalTax(1_000, 'marginal', 35, 50_000);
    expect(result.rentalTaxAnnualNis).toBe(0);
  });

  it('applies exemption track for rent below ceiling', () => {
    const result = calcRentalTax(5_000, 'exemption', 30, 0);
    // 5,000 < 6,360 ceiling, excess = 0, adjustedExemption = 6,360, taxable = 0
    expect(result.rentalTaxAnnualNis).toBe(0);
  });

  it('applies exemption track phase-out for rent above ceiling', () => {
    const result = calcRentalTax(8_000, 'exemption', 30, 0);
    // excess = 8,000 - 6,360 = 1,640
    // adjustedExemption = max(6,360 - 1,640, 0) = 4,720
    // monthlyTaxable = max(8,000 - 4,720, 0) = 3,280
    expect(result.rentalTaxAnnualNis).toBeCloseTo(3_280 * 12 * 0.3, 2);
  });

  it('handles zero rent', () => {
    const result = calcRentalTax(0, 'flat10', 30, 0);
    expect(result.annualGrossRentNis).toBe(0);
    expect(result.rentalTaxAnnualNis).toBe(0);
  });
});

describe('calcOperatingCosts', () => {
  it('calculates all operating cost components', () => {
    const result = calcOperatingCosts(60_000, 8, 5_000, 5, 1, 1_000_000);
    // management: 60,000 * 0.08 = 4,800
    // vacancy: 60,000 * 0.05 = 3,000
    // repairs: 1,000,000 * 0.01 = 10,000
    // total: 4,800 + 5,000 + 3,000 + 10,000 = 22,800
    expect(result).toBe(22_800);
  });

  it('handles zero values', () => {
    const result = calcOperatingCosts(0, 0, 0, 0, 0, 0);
    expect(result).toBe(0);
  });
});

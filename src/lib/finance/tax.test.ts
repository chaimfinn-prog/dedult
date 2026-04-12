import { describe, it, expect } from 'vitest';
import { calcPurchaseTax, calcVat } from './tax';

describe('calcPurchaseTax', () => {
  it('returns 0 for single home resident below first bracket', () => {
    expect(calcPurchaseTax(1_000_000, 'single_home_resident')).toBe(0);
  });

  it('applies progressive brackets for single home resident', () => {
    const tax = calcPurchaseTax(3_000_000, 'single_home_resident');
    // 0 up to 1,978,745
    // 3.5% on (2,347,040 - 1,978,745) = 368,295 * 0.035 = 12,890.325
    // 5% on (3,000,000 - 2,347,040) = 652,960 * 0.05 = 32,648
    const expected = 0 + 368_295 * 0.035 + 652_960 * 0.05;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it('applies investor brackets (8% from first shekel)', () => {
    const tax = calcPurchaseTax(2_000_000, 'investor_resident');
    expect(tax).toBe(2_000_000 * 0.08);
  });

  it('treats new_immigrant as single home eligible', () => {
    const tax = calcPurchaseTax(1_500_000, 'new_immigrant');
    expect(tax).toBe(0);
  });

  it('treats foreigner as investor', () => {
    const tax = calcPurchaseTax(2_000_000, 'foreigner');
    expect(tax).toBe(2_000_000 * 0.08);
  });

  it('handles 10% top bracket for investor', () => {
    const price = 10_000_000;
    const tax = calcPurchaseTax(price, 'investor_resident');
    const expected = 6_055_070 * 0.08 + (price - 6_055_070) * 0.1;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it('returns 0 for price of 0', () => {
    expect(calcPurchaseTax(0, 'single_home_resident')).toBe(0);
  });
});

describe('calcVat', () => {
  it('charges VAT on property for new_from_developer', () => {
    const result = calcVat(1_000_000, 10_000, 20_000, 'new_from_developer');
    expect(result.vatOnPropertyNis).toBe(1_000_000 * 0.18);
    expect(result.vatOnServicesNis).toBe(30_000 * 0.18);
  });

  it('does not charge VAT on property for second_hand', () => {
    const result = calcVat(1_000_000, 10_000, 20_000, 'second_hand');
    expect(result.vatOnPropertyNis).toBe(0);
    expect(result.vatOnServicesNis).toBe(30_000 * 0.18);
  });

  it('handles zero fees', () => {
    const result = calcVat(500_000, 0, 0, 'new_from_developer');
    expect(result.vatOnPropertyNis).toBe(500_000 * 0.18);
    expect(result.vatOnServicesNis).toBe(0);
  });
});

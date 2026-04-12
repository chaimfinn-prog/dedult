import { describe, it, expect } from 'vitest';
import { calcLinkageSurcharge } from './linkage';

describe('calcLinkageSurcharge', () => {
  it('returns 0 for empty payment schedule', () => {
    expect(calcLinkageSurcharge(1_000_000, 3, [], '2027-01-01')).toBe(0);
  });

  it('protects first 20% of contract price from linkage', () => {
    const schedule = [
      { date: '2025-01-01', amountNis: 200_000 },
    ];
    const result = calcLinkageSurcharge(1_000_000, 3, schedule, '2027-01-01');
    // 200,000 fits within 20% protected (200,000), nothing exposed
    expect(result).toBe(0);
  });

  it('applies linkage to exposed amounts beyond 20% protection', () => {
    const schedule = [
      { date: '2025-01-01', amountNis: 300_000 },
      { date: '2026-01-01', amountNis: 200_000 },
    ];
    const result = calcLinkageSurcharge(1_000_000, 3, schedule, '2027-01-01');
    // First payment: 200k protected, 100k exposed at year 0 → growth = 0
    // Second payment: 200k exposed at year 1 → growth = 1.03^1 - 1 = 0.03
    // surcharge = 100k * 0 + 200k * 0.03 = 6,000
    expect(result).toBeCloseTo(6_000, 0);
  });

  it('caps exposed amount at 40% of contract price', () => {
    const schedule = [
      { date: '2025-01-01', amountNis: 800_000 },
    ];
    const result = calcLinkageSurcharge(1_000_000, 5, schedule, '2027-01-01');
    // 200k protected, 400k exposed (capped), remaining 200k ignored
    // All at year 0, growth factor = 0
    expect(result).toBe(0);
  });

  it('ignores payments after delivery date', () => {
    const schedule = [
      { date: '2025-01-01', amountNis: 300_000 },
      { date: '2028-01-01', amountNis: 300_000 }, // after delivery
    ];
    const result = calcLinkageSurcharge(1_000_000, 3, schedule, '2027-01-01');
    // Only first payment counts: 200k protected, 100k exposed at year 0
    expect(result).toBe(0);
  });
});

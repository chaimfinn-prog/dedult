import { describe, it, expect } from 'vitest';
import { solveXirr } from './xirr';

describe('solveXirr', () => {
  it('returns 0 for fewer than 2 cashflows', () => {
    expect(solveXirr([{ date: '2025-01-01', amountNis: -100 }])).toBe(0);
    expect(solveXirr([])).toBe(0);
  });

  it('computes ~100% IRR for doubling in 1 year', () => {
    const result = solveXirr([
      { date: '2025-01-01', amountNis: -1000 },
      { date: '2026-01-01', amountNis: 2000 },
    ]);
    expect(result).toBeCloseTo(100, 0);
  });

  it('computes ~0% IRR for break-even', () => {
    const result = solveXirr([
      { date: '2025-01-01', amountNis: -1000 },
      { date: '2026-01-01', amountNis: 1000 },
    ]);
    expect(result).toBeCloseTo(0, 0);
  });

  it('handles multi-year cashflows', () => {
    const result = solveXirr([
      { date: '2025-01-01', amountNis: -10000 },
      { date: '2026-01-01', amountNis: 1000 },
      { date: '2027-01-01', amountNis: 1000 },
      { date: '2028-01-01', amountNis: 1000 },
      { date: '2029-01-01', amountNis: 1000 },
      { date: '2030-01-01', amountNis: 1000 },
      { date: '2035-01-01', amountNis: 12000 },
    ]);
    // Should return a positive IRR
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('handles negative IRR (loss scenario)', () => {
    const result = solveXirr([
      { date: '2025-01-01', amountNis: -10000 },
      { date: '2035-01-01', amountNis: 5000 },
    ]);
    expect(result).toBeLessThan(0);
  });

  it('handles unsorted cashflows', () => {
    const result = solveXirr([
      { date: '2026-01-01', amountNis: 2000 },
      { date: '2025-01-01', amountNis: -1000 },
    ]);
    expect(result).toBeCloseTo(100, 0);
  });
});

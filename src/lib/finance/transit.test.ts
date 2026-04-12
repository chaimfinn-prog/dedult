import { describe, it, expect } from 'vitest';
import { calcTransitUplift } from './transit';

describe('calcTransitUplift', () => {
  it('returns highest uplift for < 250m', () => {
    const result = calcTransitUplift(100);
    expect(result).toBe((6 + 12) / 2); // 9%
  });

  it('returns medium uplift for 250-500m', () => {
    const result = calcTransitUplift(400);
    expect(result).toBe((3 + 6) / 2); // 4.5%
  });

  it('returns low uplift for 500-1000m', () => {
    const result = calcTransitUplift(800);
    expect(result).toBe((1 + 3) / 2); // 2%
  });

  it('returns 0 uplift for > 1000m', () => {
    const result = calcTransitUplift(2000);
    expect(result).toBe(0);
  });

  it('handles boundary at exactly 250m', () => {
    const result = calcTransitUplift(250);
    expect(result).toBe(9);
  });

  it('handles boundary at exactly 500m', () => {
    const result = calcTransitUplift(500);
    expect(result).toBe(4.5);
  });

  it('handles boundary at exactly 1000m', () => {
    const result = calcTransitUplift(1000);
    expect(result).toBe(2);
  });
});

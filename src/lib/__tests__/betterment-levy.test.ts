import { describe, it, expect } from 'vitest';
import { calcBettermentLevy } from '../betterment-levy';

describe('calcBettermentLevy', () => {
  it('Metro zone, ₪1M value increase → levy = ₪600,000', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: 30_000,
      valueBeforePerSqm: 20_000,
      areaSqm: 100,
      isMetroZone: true,
      hasPlanApproval: true,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;
    // Delta = (30000 - 20000) × 100 = 1,000,000
    // Levy = 1,000,000 × 0.60 = 600,000
    expect(result.data.valueDelta).toBe(1_000_000);
    expect(result.data.levyAmount).toBe(600_000);
    expect(result.data.levyRate).toBe(0.60);
  });

  it('Standard zone, ₪500K increase → levy = ₪250,000', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: 25_000,
      valueBeforePerSqm: 20_000,
      areaSqm: 100,
      isMetroZone: false,
      hasPlanApproval: true,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;
    // Delta = 5000 × 100 = 500,000
    // Levy = 500,000 × 0.50 = 250,000
    expect(result.data.valueDelta).toBe(500_000);
    expect(result.data.levyAmount).toBe(250_000);
    expect(result.data.levyRate).toBe(0.50);
  });

  it('No plan → levy = ₪0', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: 30_000,
      valueBeforePerSqm: 20_000,
      areaSqm: 100,
      isMetroZone: true,
      hasPlanApproval: false,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;
    expect(result.data.levyAmount).toBe(0);
  });

  it('Unknown delta → status = ESTIMATE_ONLY', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: null,
      valueBeforePerSqm: null,
      areaSqm: 100,
      isMetroZone: true,
      hasPlanApproval: true,
    });
    expect(result.status).toBe('ESTIMATE_ONLY');
    if (result.status !== 'ESTIMATE_ONLY') return;
    expect(result.note).toContain('שמאי');
    expect(result.data.levyRate).toBe(0.60);
  });

  it('Partial ownership applies correctly', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: 30_000,
      valueBeforePerSqm: 20_000,
      areaSqm: 100,
      ownershipShare: 0.5,
      isMetroZone: false,
      hasPlanApproval: true,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;
    // Delta = 1,000,000
    // Betterment value = 1,000,000 × 0.5 = 500,000
    // Levy = 500,000 × 0.50 = 250,000
    expect(result.data.bettermentValue).toBe(500_000);
    expect(result.data.levyAmount).toBe(250_000);
  });

  it('Negative delta (value decrease) → levy = 0', () => {
    const result = calcBettermentLevy({
      valueAfterPerSqm: 15_000,
      valueBeforePerSqm: 20_000,
      areaSqm: 100,
      isMetroZone: false,
      hasPlanApproval: true,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;
    expect(result.data.valueDelta).toBe(0);
    expect(result.data.levyAmount).toBe(0);
  });
});

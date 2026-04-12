import { describe, it, expect } from 'vitest';
import { calculateBuildingEnvelope, validateAreaFitsEnvelope } from './envelope-calculator';
import type { EnvelopeInput } from './envelope-calculator';

function makeInput(overrides: Partial<EnvelopeInput> = {}): EnvelopeInput {
  return {
    plotWidth: 30,
    plotDepth: 40,
    plotArea: 1200,
    frontSetback: 5,
    rearSetback: 4,
    sideSetback: 3,
    maxCoverage: 50,
    maxFloors: 8,
    maxHeight: 27,
    floorHeight: 3,
    ...overrides,
  };
}

describe('calculateBuildingEnvelope', () => {
  it('calculates net dimensions after setbacks', () => {
    const result = calculateBuildingEnvelope(makeInput());
    // netWidth = 30 - 2*3 = 24
    // netDepth = 40 - 5 - 4 = 31
    expect(result.netWidth).toBe(24);
    expect(result.netDepth).toBe(31);
    expect(result.netFootprint).toBe(744);
  });

  it('applies coverage constraint', () => {
    const result = calculateBuildingEnvelope(makeInput());
    // maxCoverage = 50% of 1200 = 600
    // effectiveFootprint = min(744, 600) = 600
    expect(result.maxCoverageArea).toBe(600);
    expect(result.effectiveFootprint).toBe(600);
    expect(result.coverageExceeded).toBe(true);
  });

  it('applies height constraint', () => {
    const result = calculateBuildingEnvelope(makeInput());
    // maxHeightFloors = 27 / 3 = 9, but maxFloors = 8
    // effectiveFloors = min(8, 9) = 8
    expect(result.maxHeightFloors).toBe(8);
    expect(result.heightConstraintBinding).toBe(false);
  });

  it('detects height constraint binding', () => {
    const result = calculateBuildingEnvelope(makeInput({ maxHeight: 18, maxFloors: 8 }));
    // maxHeightFloors = 18 / 3 = 6 < 8
    expect(result.maxHeightFloors).toBe(6);
    expect(result.heightConstraintBinding).toBe(true);
  });

  it('calculates total volume', () => {
    const result = calculateBuildingEnvelope(makeInput());
    expect(result.totalVolume).toBe(600 * 8); // 4800
  });

  it('handles zero plot dimensions', () => {
    const result = calculateBuildingEnvelope(makeInput({ plotWidth: 0, plotDepth: 0 }));
    expect(result.netFootprint).toBe(0);
    expect(result.fitsInPlot).toBe(false);
  });

  it('handles setbacks larger than plot', () => {
    const result = calculateBuildingEnvelope(makeInput({ plotWidth: 4, sideSetback: 3 }));
    // netWidth = max(0, 4 - 6) = 0
    expect(result.netWidth).toBe(0);
    expect(result.netFootprint).toBe(0);
  });

  it('defaults floorHeight to 3.0', () => {
    const result = calculateBuildingEnvelope(makeInput({ floorHeight: 0 }));
    // floorHeight fallback = 3.0
    expect(result.maxHeightFloors).toBe(Math.min(8, Math.floor(27 / 3)));
  });

  it('generates audit steps', () => {
    const result = calculateBuildingEnvelope(makeInput());
    expect(result.steps).toHaveLength(5);
    expect(result.steps[0].step).toBe(1);
    expect(result.steps[4].step).toBe(5);
  });
});

describe('validateAreaFitsEnvelope', () => {
  it('returns fits=true when area fits', () => {
    const envelope = calculateBuildingEnvelope(makeInput());
    const result = validateAreaFitsEnvelope(3000, envelope);
    expect(result.fits).toBe(true);
    expect(result.utilizationPercent).toBeLessThanOrEqual(100);
  });

  it('returns fits=false when area exceeds envelope', () => {
    const envelope = calculateBuildingEnvelope(makeInput());
    const result = validateAreaFitsEnvelope(10000, envelope);
    expect(result.fits).toBe(false);
    expect(result.utilizationPercent).toBeGreaterThan(100);
  });

  it('calculates utilization percentage', () => {
    const envelope = calculateBuildingEnvelope(makeInput());
    const result = validateAreaFitsEnvelope(2400, envelope);
    // totalVolume = 4800, utilization = 2400/4800 = 50%
    expect(result.utilizationPercent).toBe(50);
  });
});

import { describe, it, expect } from 'vitest';
import { computeAreaFromWkt, parseWkt, shoelaceArea, parseRing } from './polygon-area';

describe('parseRing', () => {
  it('parses coordinate pairs', () => {
    const ring = parseRing('100 200, 300 400, 500 600');
    expect(ring).toEqual([[100, 200], [300, 400], [500, 600]]);
  });

  it('handles extra whitespace', () => {
    const ring = parseRing('  100  200 , 300  400 ');
    expect(ring).toEqual([[100, 200], [300, 400]]);
  });
});

describe('parseWkt', () => {
  it('parses POLYGON', () => {
    const rings = parseWkt('POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))');
    expect(rings).toHaveLength(1);
    expect(rings[0]).toHaveLength(5);
  });

  it('parses MULTIPOLYGON', () => {
    const rings = parseWkt('MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0)))');
    expect(rings).toHaveLength(1);
  });

  it('returns empty for invalid WKT', () => {
    expect(parseWkt('')).toHaveLength(0);
  });
});

describe('shoelaceArea', () => {
  it('computes area of a square', () => {
    const ring: [number, number][] = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]];
    expect(shoelaceArea(ring)).toBe(10000);
  });

  it('computes area of a triangle', () => {
    const ring: [number, number][] = [[0, 0], [100, 0], [50, 100], [0, 0]];
    expect(shoelaceArea(ring)).toBe(5000);
  });
});

describe('computeAreaFromWkt', () => {
  it('returns 0 for empty input', () => {
    expect(computeAreaFromWkt('')).toBe(0);
  });

  it('computes reasonable area from MULTIPOLYGON near Israel', () => {
    const wkt = 'MULTIPOLYGON(((3884178 3778648, 3884186 3778647, 3883967 3778417, 3883836 3778547, 3884178 3778648)))';
    const area = computeAreaFromWkt(wkt);
    expect(area).toBeGreaterThan(100);
    expect(area).toBeLessThan(500000);
  });
});

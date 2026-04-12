import { describe, it, expect } from 'vitest';
import { parseFloorName, analyzeDeals, estimateDimensionsFromWkt, type DealRecord } from './parcel-analysis';

describe('parseFloorName', () => {
  it('parses Hebrew floor names', () => {
    expect(parseFloorName('ראשונה')).toBe(1);
    expect(parseFloorName('שניה')).toBe(2);
    expect(parseFloorName('שלישית')).toBe(3);
    expect(parseFloorName('רביעית')).toBe(4);
    expect(parseFloorName('חמישית')).toBe(5);
    expect(parseFloorName('שישית')).toBe(6);
    expect(parseFloorName('שביעית')).toBe(7);
    expect(parseFloorName('שמינית')).toBe(8);
    expect(parseFloorName('תשיעית')).toBe(9);
    expect(parseFloorName('עשירית')).toBe(10);
  });

  it('parses shorthand forms', () => {
    expect(parseFloorName("א'")).toBe(1);
    expect(parseFloorName("ב'")).toBe(2);
    expect(parseFloorName("ג'")).toBe(3);
  });

  it('parses ground and basement', () => {
    expect(parseFloorName('קרקע')).toBe(0);
    expect(parseFloorName('מרתף')).toBe(-1);
  });

  it('parses compound numbers', () => {
    expect(parseFloorName('עשרים ושמונה')).toBe(28);
    expect(parseFloorName('עשרים')).toBe(20);
  });

  it('returns null for unknown', () => {
    expect(parseFloorName(null)).toBeNull();
    expect(parseFloorName('')).toBeNull();
    expect(parseFloorName('unknown')).toBeNull();
  });

  it('parses numeric strings', () => {
    expect(parseFloorName('5')).toBe(5);
    expect(parseFloorName('12')).toBe(12);
  });
});

describe('analyzeDeals', () => {
  const makeDeal = (floor: string | null, area: number, subParcel: number, type = 'דירה'): DealRecord => ({
    floorNo: floor,
    assetArea: area,
    assetRoomNum: 3,
    subParcelNum: subParcel,
    propertyTypeDescription: type,
  });

  it('extracts max floor as existingFloors', () => {
    const deals = [
      makeDeal('ראשונה', 80, 1),
      makeDeal('שלישית', 80, 2),
      makeDeal('שניה', 80, 3),
    ];
    const result = analyzeDeals(deals);
    expect(result.existingFloors).toBe(3);
  });

  it('counts unique subparcels as units', () => {
    const deals = [
      makeDeal('ראשונה', 80, 1),
      makeDeal('ראשונה', 80, 1), // duplicate
      makeDeal('שניה', 90, 2),
      makeDeal('שלישית', 85, 3),
    ];
    const result = analyzeDeals(deals);
    expect(result.existingUnits).toBe(3);
  });

  it('computes average unit size', () => {
    const deals = [
      makeDeal('ראשונה', 80, 1),
      makeDeal('שניה', 100, 2),
      makeDeal('שלישית', 120, 3),
    ];
    const result = analyzeDeals(deals);
    expect(result.avgUnitSize).toBe(100); // (80+100+120)/3
  });

  it('filters out non-apartment areas', () => {
    const deals = [
      makeDeal('ראשונה', 80, 1),
      makeDeal(null, 1, 10, 'קרקע'),     // land, area=1
      makeDeal(null, 39364, 11, 'קרקע'),  // land, huge area
    ];
    const result = analyzeDeals(deals);
    expect(result.avgUnitSize).toBe(80); // only the apartment
    expect(result.existingUnits).toBe(1);
  });

  it('returns nulls for empty deals', () => {
    const result = analyzeDeals([]);
    expect(result.existingFloors).toBeNull();
    expect(result.existingUnits).toBeNull();
    expect(result.avgUnitSize).toBeNull();
  });

  it('estimates built area from units × avg size', () => {
    const deals = [
      makeDeal('ראשונה', 80, 1),
      makeDeal('שניה', 80, 2),
      makeDeal('שלישית', 80, 3),
    ];
    const result = analyzeDeals(deals);
    expect(result.estimatedBuiltArea).toBe(240); // 3 * 80
  });

  it('handles 8+ floor buildings', () => {
    const deals = [
      makeDeal('שמינית', 78, 49),
      makeDeal('תשיעית', 147, 53),
    ];
    const result = analyzeDeals(deals);
    expect(result.existingFloors).toBe(9);
  });
});

describe('estimateDimensionsFromWkt', () => {
  it('returns null for empty input', () => {
    expect(estimateDimensionsFromWkt('')).toBeNull();
  });

  it('estimates width and depth from polygon', () => {
    // Create a roughly 30m x 40m rectangle near Israel (EPSG:3857)
    const x = 3884000, y = 3778000;
    // In mercator at lat ~32°, 1 real meter ≈ 1/cos(32°) ≈ 1.18 mercator units
    const wMerc = 35.4; // ~30m real
    const dMerc = 47.2; // ~40m real
    const wkt = `POLYGON((${x} ${y}, ${x + wMerc} ${y}, ${x + wMerc} ${y + dMerc}, ${x} ${y + dMerc}, ${x} ${y}))`;
    const dims = estimateDimensionsFromWkt(wkt);
    expect(dims).not.toBeNull();
    expect(dims!.width).toBeGreaterThan(20);
    expect(dims!.width).toBeLessThan(40);
    expect(dims!.depth).toBeGreaterThan(30);
    expect(dims!.depth).toBeLessThan(50);
    expect(dims!.width).toBeLessThan(dims!.depth);
  });

  it('returns null for degenerate polygon', () => {
    expect(estimateDimensionsFromWkt('POLYGON((0 0, 0 0))')).toBeNull();
  });
});

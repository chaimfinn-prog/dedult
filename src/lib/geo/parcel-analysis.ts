/**
 * Analyze deal data from GovMap street-deals API to extract
 * building characteristics for auto-filling the calculator.
 */

// ── Hebrew floor name → number mapping ──────────────────────

const FLOOR_MAP: Record<string, number> = {
  'קרקע': 0, 'קומת קרקע': 0,
  'ראשונה': 1, "א'": 1, 'א': 1,
  'שניה': 2, 'שנייה': 2, "ב'": 2, 'ב': 2,
  'שלישית': 3, "ג'": 3, 'ג': 3,
  'רביעית': 4, "ד'": 4, 'ד': 4,
  'חמישית': 5, "ה'": 5, 'ה': 5,
  'שישית': 6, "ו'": 6, 'ו': 6,
  'שביעית': 7, "ז'": 7, 'ז': 7,
  'שמינית': 8, "ח'": 8, 'ח': 8,
  'תשיעית': 9, "ט'": 9, 'ט': 9,
  'עשירית': 10, "י'": 10, 'י': 10,
  'אחת עשרה': 11, 'שתים עשרה': 12, 'שלוש עשרה': 13,
  'ארבע עשרה': 14, 'חמש עשרה': 15, 'שש עשרה': 16,
  'שבע עשרה': 17, 'שמונה עשרה': 18, 'תשע עשרה': 19,
  'עשרים': 20, 'עשרים ואחת': 21, 'עשרים ושתיים': 22,
  'עשרים ושלוש': 23, 'עשרים וארבע': 24, 'עשרים וחמש': 25,
  'עשרים ושש': 26, 'עשרים ושבע': 27, 'עשרים ושמונה': 28,
  'עשרים ותשע': 29, 'שלושים': 30,
  'מרתף': -1, 'מרתף ראשון': -1, 'מרתף שני': -2,
};

export function parseFloorName(name: string | null | undefined): number | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (FLOOR_MAP[trimmed] !== undefined) return FLOOR_MAP[trimmed];

  // Try numeric parsing
  const num = parseInt(trimmed);
  if (!isNaN(num)) return num;

  return null;
}

// ── Deal analysis ───────────────────────────────────────────

export interface DealRecord {
  floorNo: string | null;
  assetArea: number | null;
  assetRoomNum: number | null;
  subParcelNum: number | null;
  propertyTypeDescription: string | null;
}

export interface ParcelAnalysis {
  existingFloors: number | null;
  existingUnits: number | null;
  avgUnitSize: number | null;
  estimatedBuiltArea: number | null;
}

const MIN_APARTMENT_AREA = 20;
const MAX_APARTMENT_AREA = 500;

export function analyzeDeals(deals: DealRecord[]): ParcelAnalysis {
  // Filter to residential apartments only
  const apartments = deals.filter(d =>
    d.propertyTypeDescription === 'דירה' ||
    (d.assetArea && d.assetArea >= MIN_APARTMENT_AREA && d.assetArea <= MAX_APARTMENT_AREA),
  );

  if (apartments.length === 0) {
    return { existingFloors: null, existingUnits: null, avgUnitSize: null, estimatedBuiltArea: null };
  }

  // Max floor number → existing floors
  let maxFloor = 0;
  for (const deal of apartments) {
    const floor = parseFloorName(deal.floorNo);
    if (floor !== null && floor > maxFloor) {
      maxFloor = floor;
    }
  }
  const existingFloors = maxFloor > 0 ? maxFloor : null;

  // Unique sub-parcels → unit count estimate
  const subParcels = new Set<number>();
  for (const deal of apartments) {
    if (deal.subParcelNum && deal.subParcelNum > 0) {
      subParcels.add(deal.subParcelNum);
    }
  }
  const existingUnits = subParcels.size > 0 ? subParcels.size : null;

  // Average apartment area (filter outliers)
  const areas = apartments
    .map(d => d.assetArea)
    .filter((a): a is number => a !== null && a >= MIN_APARTMENT_AREA && a <= MAX_APARTMENT_AREA);
  const avgUnitSize = areas.length > 0
    ? Math.round(areas.reduce((s, a) => s + a, 0) / areas.length)
    : null;

  // Estimated built area
  const estimatedBuiltArea = existingUnits && avgUnitSize
    ? existingUnits * avgUnitSize
    : null;

  return { existingFloors, existingUnits, avgUnitSize, estimatedBuiltArea };
}

// ── Bounding box dimensions from polygon ────────────────────

const EARTH_RADIUS = 6378137;

function mercatorYToLatRad(y: number): number {
  return 2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2;
}

export function estimateDimensionsFromWkt(wkt: string): { width: number; depth: number } | null {
  // Extract coordinates from WKT
  const ringPattern = /\(([^()]+)\)/g;
  let match;
  const coords: [number, number][] = [];

  while ((match = ringPattern.exec(wkt)) !== null) {
    const pairs = match[1].trim().split(',');
    for (const pair of pairs) {
      const [x, y] = pair.trim().split(/\s+/).map(Number);
      if (!isNaN(x) && !isNaN(y)) coords.push([x, y]);
    }
    if (coords.length > 0) break; // use first ring only
  }

  if (coords.length < 3) return null;

  // Bounding box in mercator
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Convert mercator meters to real-world meters using latitude correction
  const centerY = (minY + maxY) / 2;
  const latRad = mercatorYToLatRad(centerY);
  const cosLat = Math.cos(latRad);

  const dxMeters = (maxX - minX) * cosLat;
  const dyMeters = (maxY - minY) * cosLat;

  // Width = shorter dimension, Depth = longer dimension
  const width = Math.round(Math.min(dxMeters, dyMeters) * 10) / 10;
  const depth = Math.round(Math.max(dxMeters, dyMeters) * 10) / 10;

  return width > 0 && depth > 0 ? { width, depth } : null;
}

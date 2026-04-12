/**
 * Compute area from WKT MULTIPOLYGON in Web Mercator (EPSG:3857).
 * Converts to approximate real-world sqm using latitude correction.
 */

const EARTH_RADIUS = 6378137; // meters (WGS84)

/** Convert Web Mercator Y to latitude in radians */
function mercatorYToLatRad(y: number): number {
  return 2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2;
}

/** Shoelace formula for polygon area (unsigned) */
export function shoelaceArea(ring: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}

/** Parse WKT coordinate string "x1 y1,x2 y2,..." into array of [x, y] */
export function parseRing(coordStr: string): [number, number][] {
  return coordStr
    .trim()
    .split(',')
    .map(pair => {
      const [x, y] = pair.trim().split(/\s+/).map(Number);
      return [x, y] as [number, number];
    })
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));
}

/** Parse WKT MULTIPOLYGON or POLYGON into arrays of rings */
export function parseWkt(wkt: string): [number, number][][] {
  const rings: [number, number][][] = [];
  const ringPattern = /\(([^()]+)\)/g;
  let match;
  while ((match = ringPattern.exec(wkt)) !== null) {
    const ring = parseRing(match[1]);
    if (ring.length >= 3) {
      rings.push(ring);
    }
  }
  return rings;
}

/**
 * Compute real-world area in sqm from a WKT MULTIPOLYGON/POLYGON in EPSG:3857.
 */
export function computeAreaFromWkt(wkt: string): number {
  const rings = parseWkt(wkt);
  if (rings.length === 0) return 0;

  const outerRing = rings[0];
  const mercatorArea = shoelaceArea(outerRing);

  const centroidY = outerRing.reduce((s, p) => s + p[1], 0) / outerRing.length;
  const latRad = mercatorYToLatRad(centroidY);
  const correctionFactor = Math.cos(latRad) * Math.cos(latRad);

  return Math.round(mercatorArea * correctionFactor);
}

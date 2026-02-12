import { NextRequest, NextResponse } from 'next/server';
import { MITCHAMIM, type MitchamimRecord } from '@/data/mitchamim';

/**
 * API route for querying מתחמי התחדשות עירונית (Urban Renewal Complexes)
 * declared by הרשות להתחדשות עירונית.
 *
 * Query params:
 *   city      – filter by city name (exact or partial match)
 *   q         – general search across complexName, neighborhood, complexNumber
 *   developer – filter by developer name (partial match)
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') ?? '';
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const developer = req.nextUrl.searchParams.get('developer') ?? '';

  if (!city && !q && !developer) {
    return NextResponse.json(
      { error: 'Missing query parameter (city, q, or developer)' },
      { status: 400 },
    );
  }

  let results: MitchamimRecord[] = [...MITCHAMIM];

  // ── Filter by city (exact or partial, case-insensitive) ──
  if (city) {
    const normalizedCity = city.trim();
    results = results.filter((r) => {
      // Exact match first
      if (r.city === normalizedCity) return true;
      // Partial / includes match (handles variations like "תל אביב" matching "תל אביב-יפו")
      if (r.city.includes(normalizedCity) || normalizedCity.includes(r.city)) return true;
      return false;
    });
  }

  // ── Filter by general query (search complexName, neighborhood, complexNumber) ──
  if (q) {
    const normalizedQ = q.trim();
    results = results.filter((r) => {
      if (r.complexName.includes(normalizedQ)) return true;
      if (r.neighborhood && r.neighborhood.includes(normalizedQ)) return true;
      if (r.complexNumber && r.complexNumber.includes(normalizedQ)) return true;
      // Also try individual words for more flexible matching
      const words = normalizedQ.split(/\s+/).filter((w) => w.length > 1);
      if (words.length > 1) {
        return words.every(
          (word) =>
            r.complexName.includes(word) ||
            (r.neighborhood && r.neighborhood.includes(word)) ||
            (r.complexNumber && r.complexNumber.includes(word)),
        );
      }
      return false;
    });
  }

  // ── Filter by developer name (partial match) ──
  if (developer) {
    const normalizedDev = developer.trim();
    results = results.filter((r) => {
      if (!r.developerName) return false;
      if (r.developerName.includes(normalizedDev) || normalizedDev.includes(r.developerName))
        return true;
      // Word-level match for compound names (e.g. "רוטשטיין" matching "רוטשטיין נדל"ן")
      const words = normalizedDev.split(/\s+/).filter((w) => w.length > 1);
      return words.some((word) => r.developerName!.includes(word));
    });
  }

  return NextResponse.json({
    records: results.slice(0, 20),
    total: results.length,
    source: 'הרשות להתחדשות עירונית',
  });
}

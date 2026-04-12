import { NextRequest, NextResponse } from 'next/server';
import { MITCHAMIM, type MitchamimRecord } from '@/data/mitchamim';
import {
  normalize,
  levenshtein,
  cityMatch,
  scoreRecord,
} from '@/lib/planning/address';

/**
 * API route for querying מתחמי התחדשות עירונית (Urban Renewal Complexes)
 * declared by הרשות להתחדשות עירונית.
 */

function scoreMitchamimRecord(r: MitchamimRecord, query: string): number {
  return scoreRecord(
    [r.complexName, r.neighborhood ?? '', r.complexNumber ?? '', r.developerName ?? ''],
    query,
  );
}

function scoreStreetMatch(r: MitchamimRecord, normStreet: string, streetWords: string[]): number {
  const complexNorm = normalize(r.complexName);
  const hoodNorm = normalize(r.neighborhood ?? '');
  let score = 0;

  if (complexNorm.includes(normStreet) || normStreet.includes(complexNorm)) score += 50;
  if (hoodNorm && (hoodNorm.includes(normStreet) || normStreet.includes(hoodNorm))) score += 40;

  for (const w of streetWords) {
    if (complexNorm.includes(w)) score += 15;
    if (hoodNorm.includes(w)) score += 12;
    const complexWords = complexNorm.split(/\s+/).filter(cw => cw.length > 1);
    const hoodWords = hoodNorm.split(/\s+/).filter(hw => hw.length > 1);
    for (const cw of complexWords) {
      if (w.length >= 3 && cw.length >= 3 && levenshtein(w, cw) <= 2) score += 8;
    }
    for (const hw of hoodWords) {
      if (w.length >= 3 && hw.length >= 3 && levenshtein(w, hw) <= 2) score += 6;
    }
  }
  return score;
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') ?? '';
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const developer = req.nextUrl.searchParams.get('developer') ?? '';
  const street = req.nextUrl.searchParams.get('street') ?? '';

  if (!city && !q && !developer && !street) {
    return NextResponse.json(
      { error: 'Missing query parameter (city, q, developer, or street)' },
      { status: 400 },
    );
  }

  let results: MitchamimRecord[] = [...MITCHAMIM];

  // ── Filter by city (fuzzy, alias-aware) ──
  if (city) {
    results = results.filter((r) => cityMatch(r.city, city));
  }

  // ── Filter by general query (fuzzy search across all fields) ──
  if (q) {
    const scored = results
      .map(r => ({ record: r, score: scoreMitchamimRecord(r, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    results = scored.map(x => x.record);
  }

  // ── Street-based spatial overlap ──
  if (street && !q) {
    const normStreet = normalize(street);
    const streetWords = normStreet.split(/\s+/).filter(w => w.length > 1);

    const scored = results
      .map(r => ({ record: r, score: scoreStreetMatch(r, normStreet, streetWords) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    results = scored.map(x => x.record);
  }

  // ── Filter by developer name (fuzzy) ──
  if (developer) {
    const normDev = normalize(developer);
    const devWords = normDev.split(/\s+/).filter(w => w.length > 1);

    results = results.filter((r) => {
      if (!r.developerName) return false;
      const rDev = normalize(r.developerName);
      if (rDev.includes(normDev) || normDev.includes(rDev)) return true;
      if (devWords.some(w => rDev.includes(w))) return true;
      const rWords = rDev.split(/\s+/).filter(w => w.length > 1);
      return devWords.some(dw =>
        dw.length >= 3 && rWords.some(rw => rw.length >= 3 && levenshtein(dw, rw) <= 2)
      );
    });
  }

  return NextResponse.json({
    records: results.slice(0, 20),
    total: results.length,
    source: 'הרשות להתחדשות עירונית',
  });
}

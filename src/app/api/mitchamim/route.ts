import { NextRequest, NextResponse } from 'next/server';
import { MITCHAMIM, type MitchamimRecord } from '@/data/mitchamim';

/**
 * API route for querying מתחמי התחדשות עירונית (Urban Renewal Complexes)
 * declared by הרשות להתחדשות עירונית.
 *
 * Query params:
 *   city      – filter by city name (fuzzy match)
 *   q         – general search across complexName, neighborhood, complexNumber
 *   developer – filter by developer name (fuzzy match)
 *   street    – street name for spatial overlap (cross-match against complex names)
 */

// ── Hebrew fuzzy matching utilities ──

/** Levenshtein distance for short Hebrew strings */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Normalize Hebrew text: strip niqqud, quotes, dashes, normalize whitespace */
function normalize(s: string): string {
  return s
    .replace(/[\u0591-\u05C7]/g, '')     // strip niqqud & cantillation
    .replace(/["\-–—׳'"״]/g, '')          // strip quotes & dashes
    .replace(/\s+/g, ' ')
    .trim();
}

/** City name aliases for common variations */
const CITY_ALIASES: Record<string, string[]> = {
  'תל אביב': ['תל אביב יפו', 'תל אביב-יפו', 'תא', 'ת"א'],
  'פתח תקווה': ['פתח תקוה', 'פ"ת'],
  'ראשון לציון': ['ראשל"צ'],
  'רמת גן': ['ר"ג'],
  'בני ברק': ['בנ"ב', 'ב"ב'],
  'גבעתיים': ['גבעתים'],
  'הרצליה': ['הרצלייה'],
  'קריית אונו': ['קרית אונו'],
  'קריית ים': ['קרית ים'],
  'קריית אתא': ['קרית אתא'],
  'קריית ביאליק': ['קרית ביאליק'],
  'קריית מוצקין': ['קרית מוצקין'],
  'קריית גת': ['קרית גת'],
  'קריית שמונה': ['קרית שמונה'],
  'קריית מלאכי': ['קרית מלאכי'],
};

/** Resolve city alias to canonical name, or return as-is */
function resolveCity(input: string): string[] {
  const norm = normalize(input);
  const candidates = [norm];
  // Check if input matches any alias → return canonical
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (normalize(canonical) === norm || aliases.some(a => normalize(a) === norm)) {
      candidates.push(normalize(canonical));
      candidates.push(...aliases.map(normalize));
    }
  }
  return [...new Set(candidates)];
}

/** Check if two city names are a fuzzy match (allows edit distance 1-2 for typos) */
function cityMatch(recordCity: string, queryCity: string): boolean {
  const rc = normalize(recordCity);
  const candidates = resolveCity(queryCity);
  for (const qc of candidates) {
    if (rc === qc) return true;
    if (rc.includes(qc) || qc.includes(rc)) return true;
  }
  // Allow Levenshtein distance ≤ 2 for short Hebrew city names (typo tolerance)
  const qcMain = normalize(queryCity);
  if (qcMain.length >= 3 && levenshtein(rc, qcMain) <= 2) return true;
  return false;
}

/** Score a record against a search query for relevance ranking */
function scoreRecord(r: MitchamimRecord, query: string): number {
  const q = normalize(query);
  const fields = [r.complexName, r.neighborhood ?? '', r.complexNumber ?? '', r.developerName ?? ''];
  let score = 0;

  for (const field of fields) {
    const f = normalize(field);
    if (!f) continue;
    if (f === q) { score += 100; continue; }
    if (f.includes(q)) { score += 60; continue; }
    if (q.includes(f)) { score += 40; continue; }
    // Word-level overlap
    const qWords = q.split(/\s+/).filter(w => w.length > 1);
    const fWords = f.split(/\s+/).filter(w => w.length > 1);
    const overlap = qWords.filter(w => fWords.some(fw => fw.includes(w) || w.includes(fw))).length;
    if (overlap > 0) score += overlap * 15;
    // Fuzzy per-word matching (levenshtein ≤ 2)
    for (const qw of qWords) {
      for (const fw of fWords) {
        if (qw.length >= 3 && fw.length >= 3 && levenshtein(qw, fw) <= 2) {
          score += 10;
        }
      }
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
      .map(r => ({ record: r, score: scoreRecord(r, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    results = scored.map(x => x.record);
  }

  // ── Street-based spatial overlap (cross-match street against complex names) ──
  if (street && !q) {
    const normStreet = normalize(street);
    const streetWords = normStreet.split(/\s+/).filter(w => w.length > 1);

    const scored = results
      .map(r => {
        const complexNorm = normalize(r.complexName);
        const hoodNorm = normalize(r.neighborhood ?? '');
        let score = 0;

        // Direct inclusion
        if (complexNorm.includes(normStreet) || normStreet.includes(complexNorm)) score += 50;
        if (hoodNorm && (hoodNorm.includes(normStreet) || normStreet.includes(hoodNorm))) score += 40;

        // Word-level overlap
        for (const w of streetWords) {
          if (complexNorm.includes(w)) score += 15;
          if (hoodNorm.includes(w)) score += 12;
          // Fuzzy word match
          const complexWords = complexNorm.split(/\s+/).filter(cw => cw.length > 1);
          const hoodWords = hoodNorm.split(/\s+/).filter(hw => hw.length > 1);
          for (const cw of complexWords) {
            if (w.length >= 3 && cw.length >= 3 && levenshtein(w, cw) <= 2) score += 8;
          }
          for (const hw of hoodWords) {
            if (w.length >= 3 && hw.length >= 3 && levenshtein(w, hw) <= 2) score += 6;
          }
        }
        return { record: r, score };
      })
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
      // Direct match
      if (rDev.includes(normDev) || normDev.includes(rDev)) return true;
      // Word-level match
      if (devWords.some(w => rDev.includes(w))) return true;
      // Fuzzy match (levenshtein ≤ 2 per word)
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

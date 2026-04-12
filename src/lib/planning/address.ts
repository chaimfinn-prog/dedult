/**
 * Address parsing and city canonicalization utilities.
 * Extracted from API routes so they can be tested and reused
 * regardless of storage backend (IndexedDB, Postgres, etc.)
 */

// ── City Names ────────────────────────────────────────────────

export const CITY_NAMES = [
  'תל אביב-יפו', 'תל אביב יפו', 'תל-אביב-יפו', 'תל אביב',
  'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'פתח תקוה',
  'אשדוד', 'נתניה', 'חולון', 'בני ברק', 'רמת גן', 'בת ים', 'אשקלון',
  'הרצליה', 'הרצלייה', 'כפר סבא', 'רעננה', 'הוד השרון', 'גבעתיים', 'גבעתים', 'ראש העין',
  'לוד', 'רמלה', 'נהריה', 'עכו', 'קריית אתא', 'קרית אתא', 'קריית ים', 'קרית ים',
  'קריית מוצקין', 'קרית מוצקין', 'קריית ביאליק', 'קרית ביאליק',
  'קריית גת', 'קרית גת', 'נצרת', 'עפולה', 'יבנה', 'אור יהודה',
  'רחובות', 'נס ציונה', 'מודיעין', 'רמת השרון', 'גבעת שמואל', 'יהוד',
  'טבריה', 'צפת', 'דימונה', 'ערד', 'אילת', 'כרמיאל',
  'קריית אונו', 'קרית אונו', 'קריית שמונה', 'קרית שמונה',
  'מגדל העמק', 'טירת כרמל', 'טירת הכרמל',
  'נשר', 'קריית מלאכי', 'קרית מלאכי', 'אופקים', 'שדרות', 'נתיבות',
];

export const CITY_CANONICAL: Record<string, string> = {
  'תל אביב': 'תל אביב-יפו',
  'תל אביב יפו': 'תל אביב-יפו',
  'פתח תקוה': 'פתח תקווה',
  'גבעתים': 'גבעתיים',
  'הרצלייה': 'הרצליה',
  'קרית אתא': 'קריית אתא',
  'קרית ים': 'קריית ים',
  'קרית מוצקין': 'קריית מוצקין',
  'קרית ביאליק': 'קריית ביאליק',
  'קרית גת': 'קריית גת',
  'קרית אונו': 'קריית אונו',
  'קרית שמונה': 'קריית שמונה',
  'קרית מלאכי': 'קריית מלאכי',
  'טירת הכרמל': 'טירת כרמל',
};

export const NEIGHBORHOOD_PREFIXES = [
  'שכונת', 'שכ׳', 'שכ\'', 'נווה', 'נוה', 'גבעת', 'רמת', 'תל', 'קרית', 'קריית',
];

// ── City Aliases (for mitchamim fuzzy matching) ───────────────

export const CITY_ALIASES: Record<string, string[]> = {
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

// ── Pure Functions ────────────────────────────────────────────

/** Resolve city name to canonical form for API queries */
export function canonicalCity(city: string): string {
  const trimmed = city.trim();
  return CITY_CANONICAL[trimmed] ?? trimmed;
}

/** Normalize Hebrew text: strip niqqud, quotes, dashes, normalize whitespace */
export function normalize(s: string): string {
  return s
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/["\-–—׳'"״]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance for short Hebrew strings */
export function levenshtein(a: string, b: string): number {
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

export interface ParsedAddress {
  street: string;
  city: string;
  words: string[];
}

/** Parse a combined Hebrew address string into street, city, and word components */
export function parseAddress(address: string): ParsedAddress {
  let street = address.trim();
  let city = '';

  const sortedCities = [...CITY_NAMES].sort((a, b) => b.length - a.length);
  for (const c of sortedCities) {
    if (street.includes(c)) {
      city = canonicalCity(c);
      street = street.replace(c, '').trim();
      break;
    }
  }

  street = street.replace(/\d+/g, '').trim();
  street = street.replace(/[,\-–]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = street.split(/\s+/).filter(w => w.length > 1);

  return { street, city, words };
}

/** Extract neighborhood-like term from street name */
export function extractNeighborhood(street: string): string | null {
  for (const prefix of NEIGHBORHOOD_PREFIXES) {
    if (street.startsWith(prefix)) return street;
  }
  return null;
}

/** Resolve city alias to all canonical variants */
export function resolveCity(input: string): string[] {
  const norm = normalize(input);
  const candidates = [norm];
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (normalize(canonical) === norm || aliases.some(a => normalize(a) === norm)) {
      candidates.push(normalize(canonical));
      candidates.push(...aliases.map(normalize));
    }
  }
  return [...new Set(candidates)];
}

/** Check if two city names are a fuzzy match (allows edit distance 1-2 for typos) */
export function cityMatch(recordCity: string, queryCity: string): boolean {
  const rc = normalize(recordCity);
  const candidates = resolveCity(queryCity);
  for (const qc of candidates) {
    if (rc === qc) return true;
    if (rc.includes(qc) || qc.includes(rc)) return true;
  }
  const qcMain = normalize(queryCity);
  if (qcMain.length >= 3 && levenshtein(rc, qcMain) <= 2) return true;
  return false;
}

export interface PlanningRecord {
  id: number | string;
  complexNumber: string;
  city: string;
  complexName: string;
  existingUnits: number;
  addedUnits: number;
  proposedUnits: number;
  declarationDate: string;
  planNumber: string;
  mavatLink: string;
  govmapLink: string;
  totalPermits: number;
  track: string;
  approvalYear: string;
  inExecution: string;
  status: string;
}

/** Map raw data.gov.il record to our planning record shape */
export function mapPlanningRecord(r: Record<string, string | number>): PlanningRecord {
  return {
    id: r._id,
    complexNumber: r.MisparMitham as string ?? '',
    city: typeof r.Yeshuv === 'string' ? r.Yeshuv.trim() : '',
    complexName: typeof r.ShemMitcham === 'string' ? r.ShemMitcham.trim() : '',
    existingUnits: (r.YachadKayam as number) ?? 0,
    addedUnits: (r.YachadTosafti as number) ?? 0,
    proposedUnits: (r.YachadMutza as number) ?? 0,
    declarationDate: r.TaarichHachraza as string ?? '',
    planNumber: typeof r.MisparTochnit === 'string' ? r.MisparTochnit.trim() : '',
    mavatLink: typeof r.KishurLatar === 'string' ? r.KishurLatar.trim() : '',
    govmapLink: typeof r.KishurLaMapa === 'string' ? r.KishurLaMapa.trim() : '',
    totalPermits: (r.SachHeterim as number) ?? 0,
    track: typeof r.Maslul === 'string' ? r.Maslul.trim() : '',
    approvalYear: r.ShnatMatanTokef as string ?? '',
    inExecution: typeof r.Bebitzua === 'string' ? r.Bebitzua.trim() : '',
    status: typeof r.Status === 'string' ? r.Status.trim() : '',
  };
}

/** Score a mitchamim record against a search query for relevance ranking */
export function scoreRecord(
  fields: string[],
  query: string,
): number {
  const q = normalize(query);
  let score = 0;

  for (const field of fields) {
    const f = normalize(field);
    if (!f) continue;
    if (f === q) { score += 100; continue; }
    if (f.includes(q)) { score += 60; continue; }
    if (q.includes(f)) { score += 40; continue; }

    const qWords = q.split(/\s+/).filter(w => w.length > 1);
    const fWords = f.split(/\s+/).filter(w => w.length > 1);
    const overlap = qWords.filter(w => fWords.some(fw => fw.includes(w) || w.includes(fw))).length;
    if (overlap > 0) score += overlap * 15;

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

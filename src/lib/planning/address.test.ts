import { describe, it, expect } from 'vitest';
import {
  canonicalCity,
  normalize,
  levenshtein,
  parseAddress,
  extractNeighborhood,
  resolveCity,
  cityMatch,
  mapPlanningRecord,
  scoreRecord,
} from './address';

// ── canonicalCity ──────────────────────────────────────────────

describe('canonicalCity', () => {
  it('resolves "תל אביב" to "תל אביב-יפו"', () => {
    expect(canonicalCity('תל אביב')).toBe('תל אביב-יפו');
  });

  it('resolves "תל אביב יפו" to "תל אביב-יפו"', () => {
    expect(canonicalCity('תל אביב יפו')).toBe('תל אביב-יפו');
  });

  it('resolves "פתח תקוה" to "פתח תקווה"', () => {
    expect(canonicalCity('פתח תקוה')).toBe('פתח תקווה');
  });

  it('resolves "גבעתים" to "גבעתיים"', () => {
    expect(canonicalCity('גבעתים')).toBe('גבעתיים');
  });

  it('resolves "קרית אתא" to "קריית אתא"', () => {
    expect(canonicalCity('קרית אתא')).toBe('קריית אתא');
  });

  it('returns the input unchanged if not in the mapping', () => {
    expect(canonicalCity('ירושלים')).toBe('ירושלים');
    expect(canonicalCity('חיפה')).toBe('חיפה');
  });

  it('trims whitespace', () => {
    expect(canonicalCity('  תל אביב  ')).toBe('תל אביב-יפו');
  });
});

// ── normalize ─────────────────────────────────────────────────

describe('normalize', () => {
  it('strips niqqud', () => {
    expect(normalize('שָׁלוֹם')).toBe('שלום');
  });

  it('strips quotes and dashes', () => {
    // Dashes are stripped entirely (not replaced with space)
    expect(normalize('תל-אביב "יפו"')).toBe('תלאביב יפו');
    expect(normalize('"hello" world')).toBe('hello world');
  });

  it('collapses whitespace', () => {
    expect(normalize('  hello   world  ')).toBe('hello world');
  });

  it('strips Hebrew special punctuation', () => {
    expect(normalize('תמ"א 38')).toBe('תמא 38');
    expect(normalize("שכ' נווה")).toBe('שכ נווה');
  });
});

// ── levenshtein ───────────────────────────────────────────────

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('חיפה', 'חיפה')).toBe(0);
  });

  it('returns string length for empty vs non-empty', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('returns 1 for single character difference', () => {
    expect(levenshtein('abc', 'axc')).toBe(1);
  });

  it('returns 2 for two character differences', () => {
    expect(levenshtein('abcd', 'axcx')).toBe(2);
  });

  it('handles Hebrew strings', () => {
    // קרית vs קריית — one letter difference
    expect(levenshtein('קרית', 'קריית')).toBeLessThanOrEqual(2);
  });
});

// ── parseAddress ──────────────────────────────────────────────

describe('parseAddress', () => {
  it('parses city from combined address', () => {
    const result = parseAddress('רחוב הרצל 5 תל אביב');
    expect(result.city).toBe('תל אביב-יפו');
    expect(result.street).toBe('רחוב הרצל');
  });

  it('strips house numbers from street', () => {
    const result = parseAddress('רחוב ויצמן 42 חיפה');
    expect(result.street).toBe('רחוב ויצמן');
    expect(result.words).toContain('רחוב');
    expect(result.words).toContain('ויצמן');
  });

  it('handles address with only city', () => {
    const result = parseAddress('ירושלים');
    expect(result.city).toBe('ירושלים');
    expect(result.street).toBe('');
  });

  it('handles address with no recognized city', () => {
    const result = parseAddress('רחוב אלמוני 7');
    expect(result.city).toBe('');
    expect(result.street).toBe('רחוב אלמוני');
  });

  it('prefers longest city match (תל אביב-יפו over תל אביב)', () => {
    const result = parseAddress('תל אביב-יפו רחוב דיזנגוף');
    expect(result.city).toBe('תל אביב-יפו');
  });

  it('cleans up separators', () => {
    const result = parseAddress('רחוב הרצל, חיפה');
    expect(result.city).toBe('חיפה');
    expect(result.street).not.toContain(',');
  });

  it('filters out short words', () => {
    const result = parseAddress('א רחוב הרצל חיפה');
    // "א" is length 1, should be filtered from words
    expect(result.words).not.toContain('א');
  });
});

// ── extractNeighborhood ───────────────────────────────────────

describe('extractNeighborhood', () => {
  it('detects neighborhood prefixes', () => {
    expect(extractNeighborhood('שכונת נווה שאנן')).toBe('שכונת נווה שאנן');
    expect(extractNeighborhood('נווה גנים')).toBe('נווה גנים');
    expect(extractNeighborhood('גבעת שמואל')).toBe('גבעת שמואל');
    expect(extractNeighborhood('רמת אביב')).toBe('רמת אביב');
  });

  it('returns null for non-neighborhood strings', () => {
    expect(extractNeighborhood('רחוב הרצל')).toBeNull();
    expect(extractNeighborhood('דיזנגוף')).toBeNull();
  });
});

// ── resolveCity ───────────────────────────────────────────────

describe('resolveCity', () => {
  it('resolves ת"א to all Tel Aviv variants', () => {
    const result = resolveCity('ת"א');
    expect(result).toContain('תל אביב');
    expect(result).toContain('תל אביב יפו');
  });

  it('resolves פ"ת to פתח תקווה variants', () => {
    const result = resolveCity('פ"ת');
    expect(result).toContain('פתח תקווה');
  });

  it('returns input if no alias found', () => {
    const result = resolveCity('ירושלים');
    expect(result).toContain('ירושלים');
  });

  it('deduplicates results', () => {
    const result = resolveCity('תל אביב');
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });
});

// ── cityMatch ─────────────────────────────────────────────────

describe('cityMatch', () => {
  it('matches exact city name', () => {
    expect(cityMatch('תל אביב-יפו', 'תל אביב-יפו')).toBe(true);
  });

  it('matches alias to canonical', () => {
    expect(cityMatch('תל אביב-יפו', 'תל אביב')).toBe(true);
    expect(cityMatch('תל אביב-יפו', 'ת"א')).toBe(true);
  });

  it('matches with minor typo (levenshtein <= 2)', () => {
    expect(cityMatch('חיפה', 'חיפא')).toBe(true); // 1 char diff
  });

  it('rejects completely different cities', () => {
    expect(cityMatch('חיפה', 'ירושלים')).toBe(false);
  });

  it('handles קרית/קריית variations', () => {
    expect(cityMatch('קריית אתא', 'קרית אתא')).toBe(true);
  });
});

// ── mapPlanningRecord ─────────────────────────────────────────

describe('mapPlanningRecord', () => {
  it('maps all fields from raw data.gov.il record', () => {
    const raw = {
      _id: 42,
      MisparMitham: 'MC-001',
      Yeshuv: ' תל אביב ',
      ShemMitcham: ' מתחם פלורנטין ',
      YachadKayam: 180,
      YachadTosafti: 540,
      YachadMutza: 720,
      TaarichHachraza: '2018-01-15',
      MisparTochnit: ' TA/5000 ',
      KishurLatar: ' https://mavat.example ',
      KishurLaMapa: ' https://govmap.example ',
      SachHeterim: 5,
      Maslul: ' פינוי-בינוי ',
      ShnatMatanTokef: '2020',
      Bebitzua: ' כן ',
      Status: ' בביצוע ',
    };

    const result = mapPlanningRecord(raw);
    expect(result.id).toBe(42);
    expect(result.city).toBe('תל אביב'); // trimmed
    expect(result.complexName).toBe('מתחם פלורנטין'); // trimmed
    expect(result.existingUnits).toBe(180);
    expect(result.addedUnits).toBe(540);
    expect(result.proposedUnits).toBe(720);
    expect(result.planNumber).toBe('TA/5000'); // trimmed
    expect(result.track).toBe('פינוי-בינוי'); // trimmed
    expect(result.status).toBe('בביצוע'); // trimmed
  });

  it('handles missing optional fields with defaults', () => {
    const raw: Record<string, string | number> = { _id: 1 };
    const result = mapPlanningRecord(raw);
    expect(result.city).toBe('');
    expect(result.existingUnits).toBe(0);
    expect(result.complexName).toBe('');
    expect(result.planNumber).toBe('');
  });

  it('preserves numeric zero values (not treated as missing)', () => {
    const raw = { _id: 1, YachadKayam: 0, SachHeterim: 0 };
    const result = mapPlanningRecord(raw);
    expect(result.existingUnits).toBe(0);
    expect(result.totalPermits).toBe(0);
  });
});

// ── scoreRecord ───────────────────────────────────────────────

describe('scoreRecord', () => {
  it('returns 100 for exact field match', () => {
    const score = scoreRecord(['מתחם פלורנטין'], 'מתחם פלורנטין');
    expect(score).toBe(100);
  });

  it('returns 60 for field containing query', () => {
    const score = scoreRecord(['מתחם פלורנטין מזרח'], 'פלורנטין');
    expect(score).toBe(60);
  });

  it('returns 40 for query containing field', () => {
    const score = scoreRecord(['פלורנטין'], 'מתחם פלורנטין מזרח');
    expect(score).toBe(40);
  });

  it('scores word-level overlap', () => {
    const score = scoreRecord(['מתחם רחוב הרצל'], 'הרצל');
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 for no match', () => {
    const score = scoreRecord(['מתחם פלורנטין'], 'ירושלים');
    expect(score).toBe(0);
  });

  it('scores across multiple fields', () => {
    const score = scoreRecord(['מתחם פלורנטין', 'דרום', 'TA-001', 'אאורה'], 'פלורנטין');
    expect(score).toBeGreaterThan(0);
  });

  it('handles empty fields', () => {
    const score = scoreRecord(['', '', ''], 'test');
    expect(score).toBe(0);
  });

  it('gives fuzzy match points for close Hebrew words', () => {
    // "פלורנטן" is 1 edit from "פלורנטין"
    const score = scoreRecord(['פלורנטין'], 'פלורנטן');
    expect(score).toBeGreaterThan(0);
  });
});

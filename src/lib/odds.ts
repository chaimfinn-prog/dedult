// ============================================================
//  odds.ts — המרת יחסים (odds) להסתברות מובלעת + נרמול
// ============================================================

/**
 * יחס עשרוני (אירופי) → הסתברות מובלעת.
 * p = 1 / יחס_עשרוני
 */
export function probFromDecimal(decimalOdds: number): number {
  if (decimalOdds <= 1) {
    throw new Error("יחס עשרוני חייב להיות גדול מ-1");
  }
  return 1 / decimalOdds;
}

/**
 * יחס אמריקאי → הסתברות מובלעת.
 *  - חיובי (+X): p = 100 / (X + 100)
 *  - שלילי (-X): p = |X| / (|X| + 100)
 * דוגמה: +475 → 0.1739 (~17.4%)
 */
export function probFromAmerican(americanOdds: number): number {
  if (americanOdds === 0) {
    throw new Error("יחס אמריקאי לא יכול להיות 0");
  }
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  }
  const x = Math.abs(americanOdds);
  return x / (x + 100);
}

export type OddsFormat = "american" | "decimal";

export function probFromOdds(value: number, format: OddsFormat): number {
  return format === "american"
    ? probFromAmerican(value)
    : probFromDecimal(value);
}

/**
 * נרמול הסתברויות של שוק שלם כך שיסתכמו ל-1 (100%).
 * ביחסי בית הימורים סכום ההסתברויות גבוה מ-100% (מרווח הבית / "overround"),
 * ולכן חובה לנרמל לפני חישוב ניקוד.
 *
 * מקבל מערך הסתברויות גולמיות ומחזיר מערך מנורמל באותו סדר.
 */
export function normalizeProbabilities(rawProbs: number[]): number[] {
  const sum = rawProbs.reduce((acc, p) => acc + p, 0);
  if (sum <= 0) {
    throw new Error("סכום ההסתברויות חייב להיות חיובי");
  }
  return rawProbs.map((p) => p / sum);
}

/**
 * עזר נוח: מקבל רשומות של {id, label, odds} בפורמט נתון,
 * וממיר לרשימת אופציות עם הסתברות מנורמלת (מסתכמת ל-1).
 */
export function buildNormalizedMarket(
  entries: { id: string; label: string; odds: number }[],
  format: OddsFormat,
): { id: string; label: string; prob: number }[] {
  const raw = entries.map((e) => probFromOdds(e.odds, format));
  const normalized = normalizeProbabilities(raw);
  return entries.map((e, i) => ({
    id: e.id,
    label: e.label,
    prob: normalized[i],
  }));
}

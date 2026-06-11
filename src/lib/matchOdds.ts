// ============================================================
//  matchOdds.ts — מודל פואסון לתוצאות מדויקות
//  מתרגם את יחסי ה-1X2 (בית/תיקו/חוץ) להערכת קצב שערים (λ) לכל קבוצה,
//  וממנה גוזר את ההסתברות של כל תוצאה מדויקת — בדיוק כמו שוק
//  "Correct Score" באתרי הימורים. משמש לחישוב הבונוס על תוצאה מדויקת.
// ============================================================

import {
  EXACT_BONUS_MAX,
  EXACT_BONUS_MIN,
  EXACT_BONUS_WEIGHT,
} from "../config";

/** התפלגות פואסון: P(k גולים | λ) */
function poisson(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact;
}

/**
 * מאתר זוג קצבי-שערים (λ_בית, λ_חוץ) שמשחזר בקירוב את הסתברויות ה-1X2.
 * חיפוש פשוט על רשת ערכים (סך השערים הצפוי 0.5..4 לכל צד).
 */
export function lambdasFromDirProbs(
  pHome: number,
  pDraw: number,
  pAway: number,
): { home: number; away: number } {
  const target = [pHome, pDraw, pAway];
  let best = { home: 1.3, away: 1.1 };
  let bestErr = Infinity;
  const MAXG = 8;

  for (let lh = 0.4; lh <= 3.2; lh += 0.1) {
    for (let la = 0.3; la <= 3.0; la += 0.1) {
      let ph = 0, pd = 0, pa = 0;
      for (let i = 0; i <= MAXG; i++) {
        for (let j = 0; j <= MAXG; j++) {
          const p = poisson(i, lh) * poisson(j, la);
          if (i > j) ph += p;
          else if (i === j) pd += p;
          else pa += p;
        }
      }
      const s = ph + pd + pa || 1;
      const err =
        Math.abs(ph / s - target[0]) +
        Math.abs(pd / s - target[1]) +
        Math.abs(pa / s - target[2]);
      if (err < bestErr) {
        bestErr = err;
        best = { home: lh, away: la };
      }
    }
  }
  return best;
}

/** הסתברות של תוצאה מדויקת נתונה, לפי מודל הפואסון */
export function exactScoreProb(
  lambdas: { home: number; away: number },
  home: number,
  away: number,
): number {
  return poisson(home, lambdas.home) * poisson(away, lambdas.away);
}

/**
 * בונוס תוצאה מדויקת לפי נדירותה:
 *   round( EXACT_BONUS_WEIGHT × (1 / p) ), חתוך בין מינימום למקסימום.
 * p נמוך (תוצאה נדירה כמו 8:0) → בונוס גדול; p גבוה (1:0) → בונוס קטן.
 */
export function exactBonusFromProb(p: number): number {
  if (p <= 0) return EXACT_BONUS_MAX;
  const raw = Math.round(EXACT_BONUS_WEIGHT * (1 / p));
  return Math.max(EXACT_BONUS_MIN, Math.min(EXACT_BONUS_MAX, raw));
}

/** עזר נוח: בונוס ישירות מיחסי ה-1X2 ומהתוצאה המנוחשת */
export function exactBonusFor(
  pHome: number,
  pDraw: number,
  pAway: number,
  home: number,
  away: number,
): number {
  const lambdas = lambdasFromDirProbs(pHome, pDraw, pAway);
  return exactBonusFromProb(exactScoreProb(lambdas, home, away));
}

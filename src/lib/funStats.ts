// ============================================================
//  funStats.ts — סטטיסטיקות משעשעות/מעניינות לשיתוף (לא משפיעות על ניקוד).
//  פונקציות טהורות (נבדקות), בלי תלות ב-React/Supabase.
// ============================================================

import { directionOf } from "./scoring";
import type { RevealedMatchPick } from "./social";

export interface FunMatchRow {
  id: number;
  ext_id?: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}

export interface RankedItem {
  userId: string;
  value: number;
  extra?: number; // מידע נוסף (למשל כמה הימורים נספרו)
}

/**
 * "אם היה שם ₪X על כל משחק" — הימור וירטואלי על הכיוון שכל אחד ניחש,
 * ביחס העשרוני האמיתי של אותו כיוון. רווח = stake*(decimal-1), הפסד = -stake.
 * מחזיר טבלה ממוינת מהגבוה לנמוך (רשימת "מי היה מרוויח הכי הרבה").
 */
export function hypotheticalWinnings(
  picks: RevealedMatchPick[],
  matches: FunMatchRow[],
  decimalOf: (market: string, direction: "home" | "draw" | "away") => number | undefined,
  stake = 10,
): RankedItem[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const totals = new Map<string, RankedItem>();
  for (const p of picks) {
    const m = byId.get(p.match_id);
    if (!m || !m.finished || m.home_score == null || m.away_score == null) continue;
    const market = `match:${m.ext_id ?? m.id}`;
    const pickDir = directionOf(p.pred_home, p.pred_away);
    const actualDir = directionOf(m.home_score, m.away_score);
    const dec = decimalOf(market, pickDir);
    if (dec == null) continue;
    const t = totals.get(p.user_id) ?? { userId: p.user_id, value: 0, extra: 0 };
    t.extra = (t.extra ?? 0) + 1;
    t.value += pickDir === actualDir ? stake * (dec - 1) : -stake;
    totals.set(p.user_id, t);
  }
  return [...totals.values()].sort((a, b) => b.value - a.value);
}

/** כמה פעמים כל משתמש ניחש "תיקו" (בלי קשר לתוצאה בפועל). */
export function mostDraws(picks: RevealedMatchPick[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const p of picks) {
    if (p.pred_home === p.pred_away) {
      counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([userId, value]) => ({ userId, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * "הכי קרוב בלי לפגוע" — לכל ניחוש לא-מדויק במשחק שהסתיים, מרחק =
 * |pred_home-actual_home| + |pred_away-actual_away|. סופרים כמה פעמים
 * כל משתמש היה במרחק 1 בדיוק (הכי קרוב שאפשר בלי בינגו).
 */
export function closestMisses(picks: RevealedMatchPick[], matches: FunMatchRow[]): RankedItem[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const counts = new Map<string, number>();
  for (const p of picks) {
    const m = byId.get(p.match_id);
    if (!m || !m.finished || m.home_score == null || m.away_score == null) continue;
    const exact = p.pred_home === m.home_score && p.pred_away === m.away_score;
    if (exact) continue;
    const dist = Math.abs(p.pred_home - m.home_score) + Math.abs(p.pred_away - m.away_score);
    if (dist === 1) counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([userId, value]) => ({ userId, value }))
    .sort((a, b) => b.value - a.value);
}

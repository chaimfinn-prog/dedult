// ============================================================
//  prizes.ts — חלוקת קופת הפרסים לפי קטגוריות (פונקציה טהורה)
//  6 קטגוריות, כל אחת אחוז מהקופה. מנצח = הניקוד הגבוה ביותר בקטגוריה.
//  כלל: אדם לא זוכה ביותר מקטגוריה אחת — אם זכה ב-2, הפרס הקטן מביניהן
//  נמחק והאחוז שלו מתחלק מחדש (פרופורציונלית) על שאר הקטגוריות.
// ============================================================

import {
  PRIZE_LABELS,
  PRIZE_SHARES,
  type PrizeCategory,
} from "../config";
import type { LeaderRow } from "./leaderboard";

const CATEGORIES: PrizeCategory[] = [
  "overall",
  "second",
  "third",
  "groupStage",
  "knockout",
  "generalPicks",
];

/** הערך שלפיו מדרגים כל קטגוריה (מי המנצח בה) */
function categoryScore(row: LeaderRow, cat: PrizeCategory): number {
  switch (cat) {
    case "overall":
    case "second":
    case "third":
      return row.total;
    case "groupStage":
      return row.subtotals.groupStage;
    case "knockout":
      return row.subtotals.knockout;
    case "generalPicks":
      return row.subtotals.generalPicks;
  }
}

export interface PrizeResult {
  category: PrizeCategory;
  label: string;
  winnerId: string | null;
  winnerName: string | null;
  share: number; // אחוז סופי מהקופה (0..1) אחרי חלוקה מחדש
  amount: number; // סכום בש"ח
}

/**
 * מחשב את חלוקת הפרסים.
 * @param board  טבלת המובילים (ממוינת או לא)
 * @param pot    גודל הקופה בש"ח
 */
export function computePrizes(board: LeaderRow[], pot: number): PrizeResult[] {
  if (board.length === 0) {
    return CATEGORIES.map((c) => ({
      category: c,
      label: PRIZE_LABELS[c],
      winnerId: null,
      winnerName: null,
      share: PRIZE_SHARES[c],
      amount: Math.round(pot * PRIZE_SHARES[c]),
    }));
  }

  const sortedByTotal = [...board].sort((a, b) => b.total - a.total);

  // מנצח לכל קטגוריה
  function winnerOf(cat: PrizeCategory): LeaderRow | null {
    if (cat === "overall") return sortedByTotal[0] ?? null;
    if (cat === "second") return sortedByTotal[1] ?? null;
    if (cat === "third") return sortedByTotal[2] ?? null;
    // קטגוריות-משנה: הניקוד הגבוה ביותר בקטגוריה (אם >0)
    const best = [...board]
      .filter((r) => categoryScore(r, cat) > 0)
      .sort((a, b) => categoryScore(b, cat) - categoryScore(a, cat))[0];
    return best ?? null;
  }

  const winners: Record<PrizeCategory, LeaderRow | null> = {} as any;
  for (const c of CATEGORIES) winners[c] = winnerOf(c);

  // כלל "לא זוכים פעמיים": אם אדם זכה בכמה קטגוריות, משאירים לו את הגדולה,
  // והקטנות נפסלות (winnerId=null) — האחוז שלהן יתחלק מחדש.
  const shares: Record<PrizeCategory, number> = { ...PRIZE_SHARES };
  const finalWinner: Record<PrizeCategory, LeaderRow | null> = { ...winners };

  // קבץ קטגוריות לפי מזהה הזוכה
  const byWinner = new Map<string, PrizeCategory[]>();
  for (const c of CATEGORIES) {
    const w = winners[c];
    if (!w) continue;
    (byWinner.get(w.userId) ?? byWinner.set(w.userId, []).get(w.userId)!).push(c);
  }

  let redistributePool = 0;
  for (const [, cats] of byWinner) {
    if (cats.length <= 1) continue;
    // השאר את הקטגוריה עם האחוז הגדול ביותר; בטל את השאר
    const keep = cats.sort((a, b) => PRIZE_SHARES[b] - PRIZE_SHARES[a])[0];
    for (const c of cats) {
      if (c === keep) continue;
      redistributePool += shares[c];
      shares[c] = 0;
      finalWinner[c] = null;
    }
  }

  // חלק מחדש את הקופה שהתפנתה — פרופורציונלית לקטגוריות שעדיין פעילות
  if (redistributePool > 0) {
    const activeShareSum = CATEGORIES.reduce((s, c) => s + (shares[c] > 0 ? shares[c] : 0), 0);
    if (activeShareSum > 0) {
      for (const c of CATEGORIES) {
        if (shares[c] > 0) shares[c] += redistributePool * (shares[c] / activeShareSum);
      }
    }
  }

  return CATEGORIES.map((c) => ({
    category: c,
    label: PRIZE_LABELS[c],
    winnerId: finalWinner[c]?.userId ?? null,
    winnerName: finalWinner[c]?.name ?? null,
    share: shares[c],
    amount: Math.round(pot * shares[c]),
  }));
}

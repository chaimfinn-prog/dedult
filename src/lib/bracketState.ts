// ============================================================
//  bracketState.ts — מצב לוח העץ האינטראקטיבי + גזירת השלבים
//  המשתמש: (1) מדרג כל בית 1–4, (2) בוחר אילו שלישיות עולות (לכל משבצת),
//  (3) בוחר מנצח בכל משחק נוקאאוט. מכאן נגזר אוטומטית לאיזה שלב הגיעה כל נבחרת.
// ============================================================

import {
  BRACKET_ROUNDS,
  FINAL,
  QF,
  R16,
  R32,
  SF,
  type BracketMatch,
  type SlotRef,
} from "../data/bracket";
import { GROUPS, GROUP_LETTERS } from "../data/teams";
import type { Stage } from "./types";

export interface BracketPick {
  /** לכל בית: מערך 4 קודים מסודר — אינדקס 0 = מקום ראשון */
  groupRankings: Record<string, string[]>;
  /** לכל משבצת "שלישי" ב-R32 (לפי מספר משחק): מאיזה בית השלישי עולה */
  thirdSlots: Record<number, string>;
  /** לכל משחק נוקאאוט (לפי מספר): קוד הנבחרת שהמשתמש בחר כמנצחת */
  winners: Record<number, string>;
}

const ALL_MATCHES: BracketMatch[] = BRACKET_ROUNDS.flatMap((r) => r.matches);

/** דירוג ברירת מחדל לכל בית — לפי סדר ה-seeding שבנתוני הבתים */
export function defaultGroupRankings(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const g of GROUP_LETTERS) out[g] = GROUPS[g].map((t) => t.code);
  return out;
}

export function emptyBracketPick(): BracketPick {
  const pick: BracketPick = {
    groupRankings: defaultGroupRankings(),
    thirdSlots: {},
    winners: {},
  };
  autoAssignThirds(pick); // השלישיות נקבעות אוטומטית — אין בחירה ידנית
  return pick;
}

/**
 * מנרמל מצב לוח עץ שאולי חלקי/ריק (למשל {} מברירת המחדל של ה-DB),
 * כדי שכל הפונקציות יוכלו לקרוא ממנו בבטחה בלי לקרוס.
 */
export function normalizeBracket(raw: unknown): BracketPick {
  const r = (raw ?? {}) as Partial<BracketPick>;
  const hasRankings =
    r.groupRankings && Object.keys(r.groupRankings).length > 0;
  return {
    groupRankings: hasRankings ? r.groupRankings! : defaultGroupRankings(),
    thirdSlots: r.thirdSlots ?? {},
    winners: r.winners ?? {},
  };
}

/** מחזיר את קוד הנבחרת שיושבת ב-slot נתון, או null אם עדיין לא ידועה */
export function resolveSlot(
  slot: SlotRef,
  matchNum: number,
  pick: BracketPick,
): string | null {
  switch (slot.type) {
    case "winner":
      return pick.groupRankings[slot.group]?.[0] ?? null;
    case "runner":
      return pick.groupRankings[slot.group]?.[1] ?? null;
    case "third": {
      const g = pick.thirdSlots[matchNum];
      return g ? (pick.groupRankings[g]?.[2] ?? null) : null;
    }
    case "match":
      return pick.winners[slot.match] ?? null;
  }
}

export function matchTeams(m: BracketMatch, pick: BracketPick) {
  return {
    home: resolveSlot(m.home, m.match, pick),
    away: resolveSlot(m.away, m.match, pick),
  };
}

/**
 * שיבוץ אוטומטי של 8 השלישיות שעולות לנוקאאוט.
 * כל משבצת "שלישי" ב-R32 מקבלת שלישית מאחד הבתים הזכאים לה (לפי הלוח הרשמי),
 * כך שכל משבצת מקבלת בית שונה. נפתר בחיפוש (matching) — המשתמש לא צריך לבחור.
 * מחזיר מיפוי { מספר_משחק → אות_בית } ומעדכן אותו על ה-pick.
 */
export function autoAssignThirds(pick: BracketPick): Record<number, string> {
  // המשבצות עם דרישת "שלישי", כל אחת והבתים הזכאים לה
  const slots = R32.flatMap((m) => {
    const s = m.home.type === "third" ? m.home : m.away.type === "third" ? m.away : null;
    return s ? [{ match: m.match, groups: s.groups }] : [];
  });

  // נמיין משבצות לפי מעט אפשרויות קודם (יעיל יותר ל-backtracking)
  const ordered = [...slots].sort((a, b) => a.groups.length - b.groups.length);

  const assignment: Record<number, string> = {};
  const usedGroups = new Set<string>();

  function backtrack(i: number): boolean {
    if (i === ordered.length) return true;
    const slot = ordered[i];
    for (const g of slot.groups) {
      if (usedGroups.has(g)) continue;
      assignment[slot.match] = g;
      usedGroups.add(g);
      if (backtrack(i + 1)) return true;
      usedGroups.delete(g);
      delete assignment[slot.match];
    }
    return false;
  }

  backtrack(0);
  pick.thirdSlots = assignment;
  return assignment;
}

/**
 * גוזר לאיזה שלב הגיעה כל נבחרת, מתוך בחירות הלוח.
 * משתתפת ב-R32 → לפחות "r32"; מנצחת סיבוב → מקודמת לשלב הבא; מנצחת הגמר → "winner".
 * מי שלא עלתה כלל לנוקאאוט → "groups".
 */
export function stagesFromBracket(raw: BracketPick): Record<string, Stage> {
  const pick = normalizeBracket(raw);
  const stages: Record<string, Stage> = {};

  for (const m of R32) {
    const { home, away } = matchTeams(m, pick);
    if (home) stages[home] = "r32";
    if (away) stages[away] = "r32";
  }
  const promote = (matches: BracketMatch[], stage: Stage) => {
    for (const m of matches) {
      const w = pick.winners[m.match];
      if (w) stages[w] = stage;
    }
  };
  promote(R32, "r16");
  promote(R16, "qf");
  promote(QF, "sf");
  promote(SF, "final");
  if (pick.winners[FINAL.match]) stages[pick.winners[FINAL.match]] = "winner";

  return stages;
}

/** האלוף לפי הלוח = מנצח הגמר */
export function championFrom(raw: BracketPick): string | null {
  return normalizeBracket(raw).winners[FINAL.match] ?? null;
}

/** הסגנית לפי הלוח = הצד המפסיד בגמר */
export function runnerUpFrom(raw: BracketPick): string | null {
  const pick = normalizeBracket(raw);
  const champ = pick.winners[FINAL.match];
  if (!champ) return null;
  const { home, away } = matchTeams(FINAL, pick);
  if (home && home !== champ) return home;
  if (away && away !== champ) return away;
  return null;
}

export { ALL_MATCHES };

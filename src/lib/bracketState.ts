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
  return { groupRankings: defaultGroupRankings(), thirdSlots: {}, winners: {} };
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
 * גוזר לאיזה שלב הגיעה כל נבחרת, מתוך בחירות הלוח.
 * משתתפת ב-R32 → לפחות "r32"; מנצחת סיבוב → מקודמת לשלב הבא; מנצחת הגמר → "winner".
 * מי שלא עלתה כלל לנוקאאוט → "groups".
 */
export function stagesFromBracket(pick: BracketPick): Record<string, Stage> {
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
export function championFrom(pick: BracketPick): string | null {
  return pick.winners[FINAL.match] ?? null;
}

/** הסגנית לפי הלוח = הצד המפסיד בגמר */
export function runnerUpFrom(pick: BracketPick): string | null {
  const champ = pick.winners[FINAL.match];
  if (!champ) return null;
  const { home, away } = matchTeams(FINAL, pick);
  if (home && home !== champ) return home;
  if (away && away !== champ) return away;
  return null;
}

export { ALL_MATCHES };

// ===== טיפוסים משותפים לכל האפליקציה =====

/** שלבי הטורניר שאליהם נבחרת יכולה להגיע (מונדיאל 2026, 48 נבחרות) */
export type Stage =
  | "groups" // לא עברה את שלב הבתים
  | "r32" // עלתה לשמינית-של-32
  | "r16" // עלתה לשמינית הגמר (16)
  | "qf" // רבע גמר
  | "sf" // חצי גמר
  | "final" // הגיעה לגמר
  | "winner"; // זכתה

export const STAGE_ORDER: Stage[] = [
  "groups",
  "r32",
  "r16",
  "qf",
  "sf",
  "final",
  "winner",
];

export const STAGE_LABELS_HE: Record<Stage, string> = {
  groups: "עברה את הבתים",
  r32: "שמינית-של-32",
  r16: "שמינית גמר",
  qf: "רבע גמר",
  sf: "חצי גמר",
  final: "גמר",
  winner: "אלופה",
};

/** כיוון תוצאת משחק — 1X2 */
export type Direction = "home" | "draw" | "away";

export const DIRECTION_LABELS_HE: Record<Direction, string> = {
  home: "ניצחון בית",
  draw: "תיקו",
  away: "ניצחון חוץ",
};

/** קטגוריות הניחושים הכלליים (שלב 1) */
export type GeneralCategory =
  | "champion"
  | "runnerUp"
  | "topScorer"
  | "secondScorer"
  | "topAssists";

export interface Team {
  code: string; // קוד דו-תלת אותיות, למשל "ARG"
  nameHe: string;
  flag: string; // אימוג'י דגל
}

/** אופציה בודדת בשוק כלשהו, אחרי נרמול הסתברויות */
export interface MarketOption {
  /** מזהה האופציה (קוד נבחרת / שם שחקן / כיוון) */
  id: string;
  label: string;
  /** הסתברות מובלעת מנורמלת (0..1) — מסתכמת ל-1 בכל השוק */
  prob: number;
}

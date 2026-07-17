// ===== טיפוסים משותפים לכל האפליקציה =====

/** שלבי הטורניר שאליהם נבחרת יכולה להגיע (מונדיאל 2026, 48 נבחרות) */
export type Stage =
  | "groups" // לא עברה את שלב הבתים
  | "r32" // עלתה לשמינית-של-32
  | "r16" // עלתה לשמינית הגמר (16)
  | "qf" // רבע גמר
  | "sf" // חצי גמר
  | "third" // משחק מקום שלישי (לא חלק מסולם ההתקדמות)
  | "final" // הגיעה לגמר
  | "winner"; // זכתה

// "third" לא נכלל כאן — זה משחק ייעודי ולא שלב התקדמות
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
  groups: "שלב הבתים",
  r32: "שמינית-של-32",
  r16: "שמינית גמר",
  qf: "רבע גמר",
  sf: "חצי גמר",
  third: "מקום שלישי",
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
  | "topAssists"
  | "goldenGlove" // כפפת הזהב — השוער הטוב ביותר
  | "goldenBall" // כדור הזהב — שחקן המצטיין
  | "mostGoalsTeam" // הקבוצה שכובשת הכי הרבה
  | "bestDefenseTeam"; // הקבוצה שסופגת הכי מעט

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
  /** היחס העשרוני הגולמי מאתר ההימורים (2.53) — הנקודות על כיוון זה */
  decimal?: number;
  /** קוד נבחרת לשיוך דגל (אופציונלי — קיים לאלוף/סגנית/שחקנים) */
  code?: string;
}

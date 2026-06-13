// ============================================================
//  scoring.ts — מנוע הניקוד
//  עיקרון: הניקוד פרופורציונלי להסתברות האמיתית.
//  ניחוש מפתיע נכון (p נמוך) שווה הרבה יותר מניחוש בטוח.
//  נוסחה כללית: round( weight × (1 / p) ).
// ============================================================

import {
  CATEGORY_WEIGHTS,
  DECIMAL_ODDS_CAP,
  ODDS_POINTS_POWER,
  ODDS_POINTS_WEIGHT,
  MAX_POINTS_PER_PICK,
  STAGE_WEIGHTS,
} from "../config";
import type { Direction, GeneralCategory, Stage } from "./types";

/** מחיל תקרת נקודות אופציונלית (אם הוגדרה ב-config) */
function applyCap(points: number): number {
  if (MAX_POINTS_PER_PICK == null) return points;
  return Math.min(points, MAX_POINTS_PER_PICK);
}

/**
 * הנוסחה הבסיסית: round( weight × (1 / p) ).
 * p היא ההסתברות המנורמלת (0..1) של האופציה שנבחרה.
 */
export function pointsForProbability(weight: number, prob: number): number {
  if (prob <= 0 || prob > 1) {
    throw new Error(`הסתברות לא חוקית: ${prob} (צריכה להיות בטווח 0..1)`);
  }
  return applyCap(Math.round(weight * (1 / prob)));
}

/**
 * נקודות פוטנציאליות לניחוש כללי (אלוף / סגנית / מלך שערים וכו').
 * זהו גם המספר שמוצג למשתמש ליד כל אופציה (שקיפות).
 */
export function potentialGeneralPoints(
  category: GeneralCategory,
  prob: number,
): number {
  return pointsForProbability(CATEGORY_WEIGHTS[category], prob);
}

/** ניקוד בפועל לניחוש כללי: הנקודות אם צדק, 0 אם טעה. */
export function scoreGeneralPick(
  category: GeneralCategory,
  prob: number,
  correct: boolean,
): number {
  return correct ? potentialGeneralPoints(category, prob) : 0;
}

/** נקודות פוטנציאליות לניחוש "לאיזה שלב הגיעה הנבחרת". */
export function potentialStagePoints(stage: Stage, prob: number): number {
  return pointsForProbability(STAGE_WEIGHTS[stage], prob);
}

export function scoreStagePick(
  stage: Stage,
  prob: number,
  correct: boolean,
): number {
  return correct ? potentialStagePoints(stage, prob) : 0;
}

/**
 * נקודות הכיוון (1X2) מהיחס העשרוני, עם דעיכה (חזקה) שמרסנת הפתעות:
 *   round( ODDS_POINTS_WEIGHT × decimal^ODDS_POINTS_POWER ).
 * דוגמה: 1.6 → 8, 3.0 → 12, 6.0 → 18, 30 → 46. כך פייבוריט הוא הבחירה
 * החכמה בתוחלת, אך פגיעה בהפתעה עדיין שווה יותר (לא משתלם "לזרוק" הפתעות).
 */
export function directionPointsFromDecimal(decimal: number): number {
  const capped = Math.min(Math.max(decimal, 1.01), DECIMAL_ODDS_CAP);
  return Math.max(2, Math.round(ODDS_POINTS_WEIGHT * Math.pow(capped, ODDS_POINTS_POWER)));
}

/**
 * נקודות הכיוון מתוך הסתברות (fallback כשאין יחס עשרוני שמור):
 * ממיר הסתברות ליחס עשרוני הוגן (1/p) ואז לנקודות.
 */
export function potentialDirectionPoints(prob: number): number {
  if (prob <= 0 || prob > 1) {
    throw new Error(`הסתברות לא חוקית: ${prob}`);
  }
  return directionPointsFromDecimal(1 / prob);
}

export interface MatchPickResult {
  /** האם הכיוון (1X2) נוחש נכון */
  directionCorrect: boolean;
  /** האם התוצאה המדויקת נוחשה נכון (גורר שגם הכיוון נכון) */
  exactCorrect: boolean;
  directionPoints: number;
  exactBonus: number;
  total: number;
}

/**
 * חישוב ניקוד מלא לניחוש משחק.
 * ניקוד מדורג:
 *  - כיוון נכון בלבד → ניקוד הכיוון (לפי ההסתברות).
 *  - תוצאה מדויקת נכונה → ניקוד הכיוון + בונוס לפי נדירות התוצאה.
 *  - הכל שגוי → 0.
 *
 * @param directionProb  הסתברות מנורמלת של הכיוון שהמשתמש בחר
 * @param predicted      תוצאה מנוחשת { home, away }
 * @param actual         תוצאה בפועל { home, away }
 * @param exactBonusValue  הבונוס שיינתן אם התוצאה המדויקת נכונה
 *                         (נגזר מנדירות התוצאה — ראו matchOdds.ts)
 */
export function scoreMatchPick(
  directionProb: number,
  predicted: { home: number; away: number },
  actual: { home: number; away: number },
  exactBonusValue: number,
): MatchPickResult {
  const predictedDir = directionOf(predicted.home, predicted.away);
  const actualDir = directionOf(actual.home, actual.away);

  const directionCorrect = predictedDir === actualDir;
  const exactCorrect =
    predicted.home === actual.home && predicted.away === actual.away;

  const directionPoints = directionCorrect
    ? potentialDirectionPoints(directionProb)
    : 0;
  const exactBonus = exactCorrect ? exactBonusValue : 0;

  return {
    directionCorrect,
    exactCorrect,
    directionPoints,
    exactBonus,
    total: applyCap(directionPoints + exactBonus),
  };
}

/** קובע את כיוון התוצאה (1X2) משער הבית והחוץ. */
export function directionOf(home: number, away: number): Direction {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

// ============================================================
//  knockout.ts — ניקוד התקדמות בנוקאאוט מהלוח־עץ.
//  סכום כולל (לא מצטבר) לפי עומק ההתקדמות: הגעה ל-R16 (ניצחון ב-R32) = 20,
//  הגעה לרבע גמר = 30 — ובלבד שניחשת שתגיע לפחות לשם (קרדיט חלקי/תקרה
//  לפי הניחוש). חצי גמר/גמר לא מנוקדים כאן — כבר מכוסים ע"י בונוס
//  האלוף/סגנית. פונקציה טהורה (נבדקת).
// ============================================================

import { STAGE_ORDER, type Stage } from "./types";

/** ערך (סה"כ, לא תוספת) לכל שלב שמזכה בנקודות. שלבים שאינם במפה = 0. */
export const KNOCKOUT_STAGE_VALUE: Partial<Record<Stage, number>> = {
  r16: 20,
  qf: 30,
};
/** סדר השלבים המנוקדים, מהעמוק לרדוד — לבדיקת "עד כמה הגיעה" */
const SCORED_STAGES: Stage[] = ["qf", "r16"];

export interface KnockoutResult {
  points: number;
  stagesHit: Stage[]; // השלב היחיד שהזכה בנקודות (ריק אם לא הגיעה מספיק רחוק)
}

/**
 * @param predictedStage השלב הסופי שניחשת לקבוצה (מ-stagesFromBracket)
 * @param actualStage    השלב הסופי שאליו הגיעה בפועל (results['stage:CODE'])
 */
export function scoreKnockoutAdvancement(
  predictedStage: Stage | undefined,
  actualStage: Stage | undefined,
): KnockoutResult {
  const predIdx = predictedStage ? STAGE_ORDER.indexOf(predictedStage) : -1;
  const actualIdx = actualStage ? STAGE_ORDER.indexOf(actualStage) : -1;
  if (predIdx < 0 || actualIdx < 0) return { points: 0, stagesHit: [] };

  const reached = Math.min(predIdx, actualIdx); // נותנים קרדיט עד למינימום
  // השלב העמוק ביותר שהושג ושמזכה בנקודות — לא סכום מצטבר של כל השלבים.
  const stage = SCORED_STAGES.find((s) => STAGE_ORDER.indexOf(s) <= reached);
  if (!stage) return { points: 0, stagesHit: [] };
  return { points: KNOCKOUT_STAGE_VALUE[stage]!, stagesHit: [stage] };
}

// ============================================================
//  knockout.ts — ניקוד התקדמות בנוקאאוט מהלוח־עץ.
//  10 נק' לכל שלב נוקאאוט (1/8, רבע, חצי, גמר) שקבוצה הגיעה אליו —
//  ובלבד שניחשת שתגיע לפחות לשם (קרדיט חלקי). הזכייה עצמה (אלוף) מנוקדת
//  בנפרד בבונוס האלוף, ולכן אינה נכללת כאן.
//  פונקציה טהורה (נבדקת).
// ============================================================

import { STAGE_ORDER, type Stage } from "./types";

export const KNOCKOUT_STAGE_POINTS = 10;
/** השלבים שמזכים בנקודות התקדמות (לא כולל 'winner' — זה בונוס האלוף). */
export const KNOCKOUT_STAGES: Stage[] = ["r16", "qf", "sf", "final"];

export interface KnockoutResult {
  points: number;
  stagesHit: Stage[];
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
  const stagesHit = KNOCKOUT_STAGES.filter((s) => STAGE_ORDER.indexOf(s) <= reached);
  return { points: stagesHit.length * KNOCKOUT_STAGE_POINTS, stagesHit };
}

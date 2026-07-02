// ============================================================
//  knockout.ts — ניקוד התקדמות בנוקאאוט מהלוח־עץ.
//  סכום כולל לפי עומק ההתקדמות (כל שלב מוסיף לשלב הקודם):
//  הגעה לשמינית הגמר (ניצחון ב-R32) = 10, לרבע גמר = 10+20=30,
//  לחצי גמר = 10+20+30=60 — ובלבד שניחשת שתגיע לפחות לשם (קרדיט
//  חלקי/תקרה לפי הניחוש). גמר/זכייה לא מנוקדים בנפרד — נעצר ב-60,
//  כי האלוף/הסגנית כבר מקבלים בונוס נפרד. פונקציה טהורה (נבדקת).
// ============================================================

import { STAGE_ORDER, type Stage } from "./types";

/** ערך מצטבר (סה"כ, לא תוספת נפרדת) לכל שלב שמזכה בנקודות. */
export const KNOCKOUT_STAGE_VALUE: Partial<Record<Stage, number>> = {
  r16: 10,
  qf: 30,
  sf: 60,
};
/** סדר השלבים המנוקדים, מהעמוק לרדוד — לבדיקת "עד כמה הגיעה" */
const SCORED_STAGES: Stage[] = ["sf", "qf", "r16"];

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
  // השלב העמוק ביותר שהושג — הערך שלו כבר כולל את כל השלבים הקודמים.
  const stage = SCORED_STAGES.find((s) => STAGE_ORDER.indexOf(s) <= reached);
  if (!stage) return { points: 0, stagesHit: [] };
  return { points: KNOCKOUT_STAGE_VALUE[stage]!, stagesHit: [stage] };
}

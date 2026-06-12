import { describe, expect, it } from "vitest";
import {
  exactBonusFor,
  exactBonusFromProb,
  exactScoreProb,
  lambdasFromDirProbs,
} from "./matchOdds";

describe("מודל פואסון לתוצאות מדויקות", () => {
  it("משחזר בקירוב את הסתברויות ה-1X2", () => {
    // פייבוריט בית חזק
    const l = lambdasFromDirProbs(0.7, 0.2, 0.1);
    expect(l.home).toBeGreaterThan(l.away); // בית מבקיע יותר
  });

  it("תוצאה שכיחה (1:0) סבירה יותר מתוצאה נדירה (8:0)", () => {
    const l = lambdasFromDirProbs(0.6, 0.25, 0.15);
    const p10 = exactScoreProb(l, 1, 0);
    const p80 = exactScoreProb(l, 8, 0);
    expect(p10).toBeGreaterThan(p80);
  });

  it("בונוס גדל ככל שהתוצאה נדירה יותר", () => {
    const small = exactBonusFromProb(0.15); // תוצאה שכיחה
    const big = exactBonusFromProb(0.002); // תוצאה נדירה
    expect(big).toBeGreaterThan(small);
  });

  it("בונוס חתוך בין מינימום למקסימום (תקרה מתונה ≤ 40)", () => {
    expect(exactBonusFromProb(0.99)).toBeGreaterThanOrEqual(6);
    expect(exactBonusFromProb(1e-9)).toBeLessThanOrEqual(40);
  });

  it("ברזיל מול האיטי: 1:0 בונוס קטן, 5:0 בונוס גדול", () => {
    const b10 = exactBonusFor(0.85, 0.1, 0.05, 1, 0);
    const b50 = exactBonusFor(0.85, 0.1, 0.05, 5, 0);
    expect(b50).toBeGreaterThan(b10);
  });

  it("היחס 3:0 מול 2:0 הגיוני (~פי 2, לא פי 5) — כמו אתרי הימורים", () => {
    // משחק שקול
    const b20 = exactBonusFor(0.4, 0.28, 0.32, 2, 0);
    const b30 = exactBonusFor(0.4, 0.28, 0.32, 3, 0);
    const ratio = b30 / b20;
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(2.6); // לא מוגזם
  });
});

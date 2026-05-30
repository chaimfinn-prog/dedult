import { describe, expect, it } from "vitest";
import {
  directionOf,
  pointsForProbability,
  potentialGeneralPoints,
  potentialMatchPoints,
  scoreGeneralPick,
  scoreMatchPick,
} from "./scoring";
import { EXACT_SCORE_BONUS } from "../config";

describe("נוסחת הניקוד הבסיסית round(weight × 1/p)", () => {
  it("ספרד אלוף ~17.4% → ~58 נק' (משקל 10)", () => {
    expect(potentialGeneralPoints("champion", 0.174)).toBe(57);
  });
  it("ארגנטינה אלוף 10% → 100 נק'", () => {
    expect(potentialGeneralPoints("champion", 0.1)).toBe(100);
  });
  it("אאוטסיידר אלוף 0.5% → 2000 נק'", () => {
    expect(potentialGeneralPoints("champion", 0.005)).toBe(2000);
  });
  it("ככל שההסתברות נמוכה — יותר נקודות", () => {
    const favorite = potentialGeneralPoints("champion", 0.3);
    const longshot = potentialGeneralPoints("champion", 0.02);
    expect(longshot).toBeGreaterThan(favorite);
  });
  it("הסתברות לא חוקית זורקת שגיאה", () => {
    expect(() => pointsForProbability(10, 0)).toThrow();
    expect(() => pointsForProbability(10, 1.2)).toThrow();
  });
});

describe("ניחוש כללי — נכון/שגוי", () => {
  it("נכון מחזיר את הנקודות, שגוי מחזיר 0", () => {
    expect(scoreGeneralPick("champion", 0.1, true)).toBe(100);
    expect(scoreGeneralPick("champion", 0.1, false)).toBe(0);
  });
});

describe("כיוון תוצאה (1X2)", () => {
  it("מזהה בית/תיקו/חוץ", () => {
    expect(directionOf(2, 1)).toBe("home");
    expect(directionOf(1, 1)).toBe("draw");
    expect(directionOf(0, 3)).toBe("away");
  });
});

describe("ניקוד ניחוש משחק — מדורג", () => {
  const p = 0.5; // הסתברות הכיוון שנבחר

  it("הכל שגוי → 0", () => {
    const r = scoreMatchPick(p, { home: 2, away: 0 }, { home: 0, away: 1 });
    expect(r.total).toBe(0);
    expect(r.directionCorrect).toBe(false);
    expect(r.exactCorrect).toBe(false);
  });

  it("כיוון נכון בלבד → ניקוד הכיוון, בלי בונוס", () => {
    const r = scoreMatchPick(p, { home: 2, away: 0 }, { home: 3, away: 1 });
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(false);
    expect(r.exactBonus).toBe(0);
    expect(r.total).toBe(r.directionPoints);
    expect(r.directionPoints).toBe(3); // round(1.5 × 1/0.5)
  });

  it("תוצאה מדויקת → ניקוד הכיוון + בונוס קבוע", () => {
    const r = scoreMatchPick(p, { home: 2, away: 1 }, { home: 2, away: 1 });
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(true);
    expect(r.exactBonus).toBe(EXACT_SCORE_BONUS);
    expect(r.total).toBe(r.directionPoints + EXACT_SCORE_BONUS);
  });

  it("כיוון מפתיע (p נמוך) נכון שווה יותר מכיוון בטוח", () => {
    const surprise = scoreMatchPick(0.15, { home: 1, away: 0 }, { home: 2, away: 0 });
    const safe = scoreMatchPick(0.7, { home: 1, away: 0 }, { home: 2, away: 0 });
    expect(surprise.directionPoints).toBeGreaterThan(safe.directionPoints);
  });

  it("תיקו מדויק", () => {
    const r = scoreMatchPick(0.28, { home: 1, away: 1 }, { home: 1, away: 1 });
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(true);
  });
});

describe("נקודות פוטנציאליות להצגה", () => {
  it("עד-X נק' למשחק = כיוון + בונוס", () => {
    expect(potentialMatchPoints(0.5)).toBe(3 + EXACT_SCORE_BONUS);
  });
});

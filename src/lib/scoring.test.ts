import { describe, expect, it } from "vitest";
import {
  directionOf,
  directionPointsFromDecimal,
  pointsForProbability,
  potentialDirectionPoints,
  potentialGeneralPoints,
  scoreGeneralPick,
  scoreMatchPick,
} from "./scoring";
import { MAX_POINTS_PER_PICK } from "../config";

const BONUS = 10; // ערך בונוס לדוגמה לטסטים

describe("נוסחת הניקוד הבסיסית round(weight × 1/p)", () => {
  it("ספרד אלוף ~17.4% → round(20/0.174)=115 נק' (משקל 20)", () => {
    expect(potentialGeneralPoints("champion", 0.174)).toBe(115);
  });
  it("ארגנטינה אלוף 10% → 200 נק' (משקל 20)", () => {
    expect(potentialGeneralPoints("champion", 0.1)).toBe(200);
  });
  it("אאוטסיידר אלוף 0.5% → מוגבל לתקרה (400)", () => {
    // round(20/0.005)=4000, אך התקרה חותכת ל-400
    expect(potentialGeneralPoints("champion", 0.005)).toBe(
      MAX_POINTS_PER_PICK ?? 4000,
    );
  });
  it("ככל שההסתברות נמוכה — יותר נקודות (עד התקרה)", () => {
    const favorite = potentialGeneralPoints("champion", 0.3);
    const longshot = potentialGeneralPoints("champion", 0.05);
    expect(longshot).toBeGreaterThan(favorite);
  });
  it("הסתברות לא חוקית זורקת שגיאה", () => {
    expect(() => pointsForProbability(10, 0)).toThrow();
    expect(() => pointsForProbability(10, 1.2)).toThrow();
  });
});

describe("ניחוש כללי — נכון/שגוי", () => {
  it("נכון מחזיר את הנקודות, שגוי מחזיר 0", () => {
    expect(scoreGeneralPick("champion", 0.1, true)).toBe(200);
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

describe("ניקוד כיוון — יחס עשרוני כמו אתר הימורים", () => {
  it("נקודות = היחס העשרוני × 10 (יחס 2.53 → 25 נק')", () => {
    expect(directionPointsFromDecimal(2.53)).toBe(25);
    expect(directionPointsFromDecimal(6.17)).toBe(62);
    expect(directionPointsFromDecimal(1.5)).toBe(15);
  });
  it("מונוטוני: ככל שהסיכוי נמוך יותר — יותר נקודות", () => {
    expect(potentialDirectionPoints(0.15)).toBeGreaterThan(potentialDirectionPoints(0.5));
    expect(potentialDirectionPoints(0.5)).toBeGreaterThan(potentialDirectionPoints(0.8));
  });
  it("הקצה נחתך בתקרה הוגנת (יחס ≤ 26 → ≤ 260 נק')", () => {
    expect(directionPointsFromDecimal(100)).toBeLessThanOrEqual(260);
    expect(potentialDirectionPoints(0.001)).toBeLessThanOrEqual(260);
  });
});

describe("ניקוד ניחוש משחק — מדורג", () => {
  const p = 0.5; // הסתברות הכיוון שנבחר

  it("הכל שגוי → 0", () => {
    const r = scoreMatchPick(p, { home: 2, away: 0 }, { home: 0, away: 1 }, BONUS);
    expect(r.total).toBe(0);
    expect(r.directionCorrect).toBe(false);
    expect(r.exactCorrect).toBe(false);
  });

  it("כיוון נכון בלבד → ניקוד הכיוון, בלי בונוס", () => {
    const r = scoreMatchPick(p, { home: 2, away: 0 }, { home: 3, away: 1 }, BONUS);
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(false);
    expect(r.exactBonus).toBe(0);
    expect(r.total).toBe(r.directionPoints);
    expect(r.directionPoints).toBe(20); // יחס הוגן 1/0.5=2.0 × 10
  });

  it("תוצאה מדויקת → ניקוד הכיוון + הבונוס שניתן", () => {
    const r = scoreMatchPick(p, { home: 2, away: 1 }, { home: 2, away: 1 }, BONUS);
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(true);
    expect(r.exactBonus).toBe(BONUS);
    expect(r.total).toBe(r.directionPoints + BONUS);
  });

  it("כיוון מפתיע (p נמוך) נכון שווה יותר מכיוון בטוח", () => {
    const surprise = scoreMatchPick(0.15, { home: 1, away: 0 }, { home: 2, away: 0 }, BONUS);
    const safe = scoreMatchPick(0.7, { home: 1, away: 0 }, { home: 2, away: 0 }, BONUS);
    expect(surprise.directionPoints).toBeGreaterThan(safe.directionPoints);
  });

  it("תיקו מדויק", () => {
    const r = scoreMatchPick(0.28, { home: 1, away: 1 }, { home: 1, away: 1 }, BONUS);
    expect(r.directionCorrect).toBe(true);
    expect(r.exactCorrect).toBe(true);
  });
});

describe("נקודות פוטנציאליות להצגה", () => {
  it("placeholder", () => {
    expect(true).toBe(true);
  });
});

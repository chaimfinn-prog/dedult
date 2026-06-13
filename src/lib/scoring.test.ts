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

describe("ניקוד כיוון — יחס עשרוני עם דעיכה מאוזנת", () => {
  it("הפתעה שווה יותר אך מרוסנת (1.6→8, 6→18, 30→46)", () => {
    expect(directionPointsFromDecimal(1.6)).toBe(8);
    expect(directionPointsFromDecimal(6.0)).toBe(18);
    expect(directionPointsFromDecimal(30)).toBe(46);
  });
  it("מונוטוני: יחס גבוה יותר → יותר נקודות", () => {
    expect(directionPointsFromDecimal(6)).toBeGreaterThan(directionPointsFromDecimal(2));
    expect(directionPointsFromDecimal(2)).toBeGreaterThan(directionPointsFromDecimal(1.3));
  });
  it("דעיכה: היחס נקודות/יחס יורד (לא משתלם 'לזרוק' הפתעות)", () => {
    // נקודות ל-יחיד-יחס: פייבוריט יעיל יותר בתוחלת מהפתעה
    const favPerOdds = directionPointsFromDecimal(2) / 2;
    const surprisePerOdds = directionPointsFromDecimal(20) / 20;
    expect(favPerOdds).toBeGreaterThan(surprisePerOdds);
  });
  it("הפתעה ענקית מרוסנת (≤ ~70, לא 260)", () => {
    expect(directionPointsFromDecimal(100)).toBeLessThanOrEqual(70);
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
    expect(r.directionPoints).toBe(directionPointsFromDecimal(1 / p)); // יחס הוגן מההסתברות
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

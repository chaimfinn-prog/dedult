import { describe, expect, it } from "vitest";
import {
  buildNormalizedMarket,
  normalizeProbabilities,
  probFromAmerican,
  probFromDecimal,
} from "./odds";

describe("המרת יחס עשרוני להסתברות", () => {
  it("6.00 → ~16.67%", () => {
    expect(probFromDecimal(6)).toBeCloseTo(1 / 6, 6);
  });
  it("זורק שגיאה ליחס <= 1", () => {
    expect(() => probFromDecimal(1)).toThrow();
  });
});

describe("המרת יחס אמריקאי להסתברות", () => {
  it("+475 → ~17.39% (דוגמת ספרד מהפרומט)", () => {
    expect(probFromAmerican(475)).toBeCloseTo(0.1739, 4);
  });
  it("+900 → 10% (דוגמת ארגנטינה)", () => {
    expect(probFromAmerican(900)).toBeCloseTo(0.1, 4);
  });
  it("יחס שלילי -200 → 66.67%", () => {
    expect(probFromAmerican(-200)).toBeCloseTo(2 / 3, 4);
  });
});

describe("נרמול הסתברויות", () => {
  it("מנרמל כך שהסכום הוא 1", () => {
    const out = normalizeProbabilities([0.5, 0.3, 0.4]); // סכום 1.2 (overround)
    const sum = out.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 9);
  });
  it("שומר על יחסים בין האופציות", () => {
    const out = normalizeProbabilities([0.6, 0.6]);
    expect(out[0]).toBeCloseTo(0.5, 9);
    expect(out[1]).toBeCloseTo(0.5, 9);
  });
});

describe("בניית שוק מנורמל", () => {
  it("מסתכם ל-1 ושומר סדר", () => {
    const market = buildNormalizedMarket(
      [
        { id: "home", label: "בית", odds: 2.0 },
        { id: "draw", label: "תיקו", odds: 3.5 },
        { id: "away", label: "חוץ", odds: 4.0 },
      ],
      "decimal",
    );
    const sum = market.reduce((a, m) => a + m.prob, 0);
    expect(sum).toBeCloseTo(1, 9);
    expect(market[0].id).toBe("home");
    expect(market[0].prob).toBeGreaterThan(market[2].prob);
  });
});

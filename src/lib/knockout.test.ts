import { describe, expect, it } from "vitest";
import { scoreKnockoutAdvancement } from "./knockout";

describe("ניקוד התקדמות בנוקאאוט (10 לכל שלב, מרבע גמר)", () => {
  it("ניחשת אלוף, הגיעה לרבע גמר → 10 (רק רבע)", () => {
    const r = scoreKnockoutAdvancement("winner", "qf");
    expect(r.points).toBe(10);
    expect(r.stagesHit).toEqual(["qf"]);
  });
  it("ניחשת גמר והגיעה לגמר → 30 (רבע + חצי + גמר)", () => {
    expect(scoreKnockoutAdvancement("final", "final").points).toBe(30);
  });
  it("אלוף בפועל מוגבל לגמר במודל הזה → 30", () => {
    expect(scoreKnockoutAdvancement("winner", "winner").points).toBe(30);
  });
  it("ניחשת רבע בלבד אך הגיעה לחצי → 10 (מוגבל לניחוש)", () => {
    expect(scoreKnockoutAdvancement("qf", "sf").points).toBe(10);
  });
  it("הגיעה רק לשמינית הגמר (1/8) → 0 (לא מספיק)", () => {
    expect(scoreKnockoutAdvancement("final", "r16").points).toBe(0);
  });
  it("נפלה בבתים → 0", () => {
    expect(scoreKnockoutAdvancement("qf", "groups").points).toBe(0);
  });
  it("בלי תוצאה בפועל → 0", () => {
    expect(scoreKnockoutAdvancement("final", undefined).points).toBe(0);
  });
});

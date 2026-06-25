import { describe, expect, it } from "vitest";
import { scoreKnockoutAdvancement } from "./knockout";

describe("ניקוד התקדמות בנוקאאוט (10 לכל שלב)", () => {
  it("ניחשת אלוף, הגיעה לרבע גמר → 20 (1/8 + רבע)", () => {
    const r = scoreKnockoutAdvancement("winner", "qf");
    expect(r.points).toBe(20);
    expect(r.stagesHit).toEqual(["r16", "qf"]);
  });
  it("ניחשת גמר והגיעה לגמר → 40 (כל ארבעת השלבים)", () => {
    expect(scoreKnockoutAdvancement("final", "final").points).toBe(40);
  });
  it("אלוף בפועל מוגבל לגמר במודל הזה → 40 (לא 50)", () => {
    expect(scoreKnockoutAdvancement("winner", "winner").points).toBe(40);
  });
  it("ניחשת 1/8 בלבד אך הגיעה לחצי → 10 (מוגבל לניחוש)", () => {
    expect(scoreKnockoutAdvancement("r16", "sf").points).toBe(10);
  });
  it("נפלה בבתים (לא הגיעה לנוקאאוט) → 0", () => {
    expect(scoreKnockoutAdvancement("qf", "groups").points).toBe(0);
    expect(scoreKnockoutAdvancement("qf", "r32").points).toBe(0);
  });
  it("בלי תוצאה בפועל → 0", () => {
    expect(scoreKnockoutAdvancement("final", undefined).points).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { scoreKnockoutAdvancement } from "./knockout";

describe("ניקוד התקדמות בנוקאאוט (10 לכל שלב, מ-R16)", () => {
  it("ניחשת אלוף, הגיעה לרבע גמר → 20 (r16 + רבע)", () => {
    const r = scoreKnockoutAdvancement("winner", "qf");
    expect(r.points).toBe(20);
    expect(r.stagesHit).toEqual(["r16", "qf"]);
  });
  it("ניחשת גמר והגיעה לגמר → 40 (r16 + רבע + חצי + גמר)", () => {
    expect(scoreKnockoutAdvancement("final", "final").points).toBe(40);
  });
  it("אלוף בפועל מוגבל לגמר במודל הזה → 40", () => {
    expect(scoreKnockoutAdvancement("winner", "winner").points).toBe(40);
  });
  it("ניחשת רבע בלבד אך הגיעה לחצי → 20 (r16 + רבע, מוגבל לניחוש)", () => {
    expect(scoreKnockoutAdvancement("qf", "sf").points).toBe(20);
  });
  it("הגיעה ל-R16 (ניצחה ב-R32) → 10", () => {
    expect(scoreKnockoutAdvancement("final", "r16").points).toBe(10);
  });
  it("נפלה בבתים → 0", () => {
    expect(scoreKnockoutAdvancement("qf", "groups").points).toBe(0);
  });
  it("בלי תוצאה בפועל → 0", () => {
    expect(scoreKnockoutAdvancement("final", undefined).points).toBe(0);
  });
  it("ניחשת r16 והגיעה ל-r16 → 10", () => {
    expect(scoreKnockoutAdvancement("r16", "r16").points).toBe(10);
  });
});

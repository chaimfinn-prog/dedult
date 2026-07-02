import { describe, expect, it } from "vitest";
import { scoreKnockoutAdvancement } from "./knockout";

describe("ניקוד התקדמות בנוקאאוט (סכום כולל: R16=20, רבע=30)", () => {
  it("ניחשת אלוף, הגיעה לרבע גמר → 30 (סה\"כ, לא מצטבר)", () => {
    const r = scoreKnockoutAdvancement("winner", "qf");
    expect(r.points).toBe(30);
    expect(r.stagesHit).toEqual(["qf"]);
  });
  it("ניחשת גמר והגיעה לגמר → 30 (רבע הוא הערך העמוק ביותר שמנוקד)", () => {
    expect(scoreKnockoutAdvancement("final", "final").points).toBe(30);
  });
  it("אלוף בפועל מוגבל לרבע במודל הזה → 30", () => {
    expect(scoreKnockoutAdvancement("winner", "winner").points).toBe(30);
  });
  it("ניחשת רבע בלבד אך הגיעה לחצי → 30 (מוגבל לניחוש, לא מעבר לרבע)", () => {
    expect(scoreKnockoutAdvancement("qf", "sf").points).toBe(30);
  });
  it("הגיעה ל-R16 (ניצחה ב-R32) בלבד → 20", () => {
    expect(scoreKnockoutAdvancement("final", "r16").points).toBe(20);
  });
  it("נפלה בבתים → 0", () => {
    expect(scoreKnockoutAdvancement("qf", "groups").points).toBe(0);
  });
  it("בלי תוצאה בפועל → 0", () => {
    expect(scoreKnockoutAdvancement("final", undefined).points).toBe(0);
  });
  it("ניחשת r16 והגיעה ל-r16 → 20", () => {
    expect(scoreKnockoutAdvancement("r16", "r16").points).toBe(20);
  });
  it("ניחשת r32 בלבד (לא הגיעה ל-r16 בניחוש) → 0", () => {
    expect(scoreKnockoutAdvancement("r32", "final").points).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { scoreKnockoutAdvancement } from "./knockout";

describe("ניקוד התקדמות בנוקאאוט (מצטבר: שמינית=10, רבע=30, חצי=60)", () => {
  it("ניחשת אלוף, הגיעה לרבע גמר → 30 (10+20, מוגבל לרבע)", () => {
    const r = scoreKnockoutAdvancement("winner", "qf");
    expect(r.points).toBe(30);
    expect(r.stagesHit).toEqual(["qf"]);
  });
  it("ניחשת גמר והגיעה לחצי גמר → 60 (10+20+30, נעצר בחצי)", () => {
    expect(scoreKnockoutAdvancement("final", "sf").points).toBe(60);
  });
  it("ניחשת גמר והגיעה לגמר → 60 (גמר/זכייה לא מוסיפים — מכוסה בבונוס אלוף)", () => {
    expect(scoreKnockoutAdvancement("final", "final").points).toBe(60);
  });
  it("אלוף בפועל מוגבל לחצי במודל הזה → 60", () => {
    expect(scoreKnockoutAdvancement("winner", "winner").points).toBe(60);
  });
  it("ניחשת רבע בלבד אך הגיעה לחצי → 30 (מוגבל לניחוש, לא מעבר לרבע)", () => {
    expect(scoreKnockoutAdvancement("qf", "sf").points).toBe(30);
  });
  it("הגיעה ל-R16 (ניצחה ב-R32) בלבד → 10", () => {
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
  it("ניחשת r32 בלבד (לא הגיעה ל-r16 בניחוש) → 0", () => {
    expect(scoreKnockoutAdvancement("r32", "final").points).toBe(0);
  });
});

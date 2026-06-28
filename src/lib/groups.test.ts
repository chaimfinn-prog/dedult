import { describe, expect, it } from "vitest";
import { computeGroupStandings, scoreGroupPick, type GroupMatch } from "./groups";

// בית B: שווייץ(SUI) / קנדה(CAN) / קטאר(QAT) / בוסניה(BIH)
// נבנה תוצאות כך ש: SUI 1, CAN 2, BIH 3, QAT 4
const m = (h: string, a: string, hs: number, as: number): GroupMatch => ({
  home_team: h, away_team: a, home_score: hs, away_score: as, finished: true,
});

const groupB: GroupMatch[] = [
  m("SUI", "QAT", 3, 0), // SUI+3
  m("CAN", "BIH", 2, 1), // CAN+3
  m("SUI", "CAN", 1, 0), // SUI+3
  m("BIH", "QAT", 2, 0), // BIH+3
  m("CAN", "QAT", 2, 0), // CAN+3
  m("SUI", "BIH", 2, 2), // תיקו
];

describe("דירוג בתים אוטומטי", () => {
  it("מחשב דירוג נכון רק כשכל המשחקים הסתיימו", () => {
    const st = computeGroupStandings(groupB);
    expect(st["B"]).toEqual(["SUI", "CAN", "BIH", "QAT"]);
  });

  it("בית לא שלם לא מוחזר", () => {
    const partial = groupB.slice(0, 4); // רק 4 מתוך 6
    expect(computeGroupStandings(partial)["B"]).toBeUndefined();
  });

  it("מתעלם ממשחקים שלא הסתיימו", () => {
    const withOpen = [...groupB.slice(0, 5), { ...groupB[5], finished: false }];
    expect(computeGroupStandings(withOpen)["B"]).toBeUndefined();
  });
});

describe("ניקוד מיקומי בית (רק 2 עולות: 5 מדויק / 2 עלתה)", () => {
  const actual = ["SUI", "CAN", "BIH", "QAT"]; // עולות: SUI(1), CAN(2)
  it("שתי העולות במקום המדויק = 10 (5+5)", () => {
    const r = scoreGroupPick(["SUI", "CAN", "BIH", "QAT"], actual);
    expect(r.points).toBe(10);
    expect(r.exactHits).toBe(2);
  });
  it("שתי העולות נכונות אך מוחלפות (1↔2) = 4 (2+2)", () => {
    const r = scoreGroupPick(["CAN", "SUI", "BIH", "QAT"], actual);
    expect(r.points).toBe(4);
    expect(r.qualifiedHits).toBe(2);
  });
  it("מקום 1 מדויק, שני שגוי לגמרי = 5", () => {
    expect(scoreGroupPick(["SUI", "BIH", "QAT", "CAN"], actual).points).toBe(5);
  });
  it("מקום 3 ו-4 נכונים אך לא העולות = 0", () => {
    expect(scoreGroupPick(["QAT", "BIH", "BIH", "QAT"], actual).points).toBe(0);
  });
  it("בלי ניחוש = 0", () => {
    expect(scoreGroupPick(undefined, actual).points).toBe(0);
  });
});

describe("ניקוד מקום 3 — שלישית שעלתה", () => {
  const actual = ["SUI", "CAN", "BIH", "QAT"];
  const advanced = new Set(["BIH", "SUI", "CAN"]); // BIH עלתה כשלישית
  const notAdvanced = new Set(["SUI", "CAN"]); // BIH לא עלתה

  it("מקום 3 מדויק + עלתה = +2", () => {
    const r = scoreGroupPick(["QAT", "QAT", "BIH", "SUI"], actual, advanced);
    expect(r.thirdHits).toBe(1);
    expect(r.points).toBe(2);
  });
  it("מקום 3 מדויק אך לא עלתה = 0", () => {
    const r = scoreGroupPick(["QAT", "QAT", "BIH", "SUI"], actual, notAdvanced);
    expect(r.thirdHits).toBe(0);
    expect(r.points).toBe(0);
  });
  it("מקום 3 לא מדויק = 0", () => {
    const r = scoreGroupPick(["QAT", "QAT", "QAT", "BIH"], actual, advanced);
    expect(r.thirdHits).toBe(0);
  });
  it("מקסימום בית: 5+5+2 = 12", () => {
    const r = scoreGroupPick(["SUI", "CAN", "BIH", "QAT"], actual, advanced);
    expect(r.points).toBe(12);
    expect(r.exactHits).toBe(2);
    expect(r.thirdHits).toBe(1);
  });
});

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

describe("ניקוד מיקומים מדויקים בבית", () => {
  const actual = ["SUI", "CAN", "BIH", "QAT"];
  it("ניחוש מושלם = 20 (10+5+5)", () => {
    expect(scoreGroupPick(["SUI", "CAN", "BIH", "QAT"], actual).points).toBe(20);
  });
  it("רק מקום ראשון נכון = 10", () => {
    expect(scoreGroupPick(["SUI", "QAT", "CAN", "BIH"], actual).points).toBe(10);
  });
  it("מקום 2 ו-3 נכונים, ראשון שגוי = 10", () => {
    expect(scoreGroupPick(["CAN", "CAN", "BIH", "SUI"], actual).points).toBe(5 + 5);
  });
  it("הכל שגוי = 0", () => {
    expect(scoreGroupPick(["QAT", "BIH", "CAN", "SUI"], actual).points).toBe(0);
  });
  it("בלי ניחוש = 0", () => {
    expect(scoreGroupPick(undefined, actual).points).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildMatchShareText,
  dirCountOf,
  relevantGeneralForMatch,
  topPredictedScore,
} from "./matchSocial";
import type { RevealedGeneral, RevealedMatchPick } from "./social";

const mp = (
  user_id: string,
  pred_home: number,
  pred_away: number,
): RevealedMatchPick => ({
  user_id,
  match_id: 1,
  direction: pred_home > pred_away ? "home" : pred_home < pred_away ? "away" : "draw",
  pred_home,
  pred_away,
});

describe("פילוח כיוונים ותוצאה נפוצה", () => {
  it("סופר בית/תיקו/חוץ", () => {
    const c = dirCountOf([mp("a", 2, 0), mp("b", 1, 1), mp("c", 0, 2), mp("d", 3, 1)]);
    expect(c).toEqual({ home: 2, draw: 1, away: 1 });
  });
  it("מוצא את התוצאה הכי מנוחשת", () => {
    const top = topPredictedScore([mp("a", 2, 1), mp("b", 2, 1), mp("c", 1, 0)]);
    expect(top).toEqual({ score: "2-1", count: 2 });
  });
});

describe("ניחושים כלליים רלוונטיים למשחק", () => {
  it("מוצא ניחוש מלך שערים של שחקן מאחת הקבוצות", () => {
    const general: RevealedGeneral[] = [
      {
        user_id: "u1",
        top_scorer: "קיליאן אמבפה", // FRA
        second_scorer: null,
        top_assists: null,
        golden_glove: null,
        golden_ball: null,
        most_goals_team: null,
        best_defense_team: null,
        bracket: null,
      },
      {
        user_id: "u2",
        top_scorer: "הארי קיין", // ENG — לא רלוונטי למשחק FRA-SEN
        second_scorer: null,
        top_assists: null,
        golden_glove: null,
        golden_ball: null,
        most_goals_team: null,
        best_defense_team: null,
        bracket: null,
      },
    ];
    const lines = relevantGeneralForMatch(general, (id) => id, "FRA", "SEN");
    expect(lines).toHaveLength(1);
    expect(lines[0].who).toBe("u1");
    expect(lines[0].category).toBe("מלך שערים");
  });
});

describe("טקסט שיתוף לוואטסאפ", () => {
  it("כולל את שמות הקבוצות, פילוח ותוצאה אם הסתיים", () => {
    const picks = [mp("a", 2, 1), mp("b", 0, 0), mp("c", 2, 1)];
    const txt = buildMatchShareText({
      homeName: "צרפת",
      awayName: "סנגל",
      kickoffLabel: "יום ג', 22:00",
      picks,
      nameOf: (id) => id,
      relevant: [],
      actual: { h: 2, a: 1 },
    });
    expect(txt).toContain("צרפת");
    expect(txt).toContain("סנגל");
    expect(txt).toContain("2 - 1"); // התוצאה הנפוצה
    expect(txt).toContain("🎯 בינגו");
  });
});

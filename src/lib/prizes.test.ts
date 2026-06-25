import { describe, expect, it } from "vitest";
import { computePrizes } from "./prizes";
import type { LeaderRow } from "./leaderboard";

function row(id: string, total: number, sub: Partial<LeaderRow["subtotals"]> = {}): LeaderRow {
  return {
    userId: id,
    name: id,
    avatar: null,
    total,
    breakdown: [],
    subtotals: { generalMarkets: 0, bracketStages: 0, groupStage: 0, knockout: 0, ...sub },
    bingo: 0,
    directionHits: 0,
  };
}

describe("חלוקת קופת הפרסים", () => {
  it("חלוקה בסיסית — 5 מנצחים שונים, אחוזים קבועים (45/25/10/10/10)", () => {
    const board = [
      row("a", 1000, { generalMarkets: 10, groupStage: 10, knockout: 10 }), // כללי
      row("b", 900, { generalMarkets: 10, groupStage: 10, knockout: 10 }), // שני
      row("c", 800, { generalMarkets: 10, groupStage: 10, knockout: 10 }), // שלישי
      row("d", 700, { generalMarkets: 999, groupStage: 10, knockout: 10 }), // אלוף כללי
      row("e", 600, { generalMarkets: 10, groupStage: 500, knockout: 500 }), // אלוף משחקים
    ];
    const prizes = computePrizes(board, 1000, { final: true });
    const overall = prizes.find((p) => p.category === "overall")!;
    expect(overall.winnerId).toBe("a");
    expect(overall.amount).toBe(450);
    expect(new Set(prizes.map((p) => p.winnerId)).size).toBe(5);
    expect(prizes.reduce((s, p) => s + p.share, 0)).toBeCloseTo(1, 6);
  });

  it("אלוף כללי מדורג לפי generalMarkets בלבד (לא לפי הלוח־עץ)", () => {
    const board = [
      row("a", 1000, { generalMarkets: 10, bracketStages: 999 }), // הרבה לוח־עץ אך מעט שווקים
      row("b", 500, { generalMarkets: 200, bracketStages: 0 }), // הכי הרבה שווקים
    ];
    const prizes = computePrizes(board, 1000, { final: false });
    expect(prizes.find((p) => p.category === "generalPicks")!.winnerId).toBe("b");
  });

  it("במהלך הטורניר (final=false) כל קטגוריה משלמת אחוז קבוע גם אם אותו אדם מוביל", () => {
    // a מוביל גם בכללי וגם במשחקים
    const board = [
      row("a", 1000, { generalMarkets: 10, groupStage: 500, knockout: 500 }),
      row("b", 900, { generalMarkets: 10, groupStage: 10, knockout: 10 }),
      row("c", 800, { generalMarkets: 10, groupStage: 10, knockout: 10 }),
    ];
    const prizes = computePrizes(board, 1000, { final: false });
    const matchPicks = prizes.find((p) => p.category === "matchPicks")!;
    expect(matchPicks.winnerId).toBe("a"); // עדיין מוצג עם מוביל
    expect(matchPicks.share).toBeCloseTo(0.1, 6); // ואחוז קבוע 10%
  });

  it("בסיום (final=true) — מי שזכה ב-2 קטגוריות, הקטנה מתבטלת ומתחלקת מחדש", () => {
    const board = [
      row("a", 1000, { generalMarkets: 10, groupStage: 500, knockout: 500 }),
      row("b", 900, { generalMarkets: 10, groupStage: 10, knockout: 10 }),
      row("c", 800, { generalMarkets: 10, groupStage: 10, knockout: 10 }),
    ];
    const prizes = computePrizes(board, 1000, { final: true });
    const matchPicks = prizes.find((p) => p.category === "matchPicks")!;
    expect(matchPicks.winnerId).toBeNull();
    expect(matchPicks.share).toBe(0);
    expect(prizes.find((p) => p.category === "overall")!.winnerId).toBe("a");
    expect(prizes.reduce((s, p) => s + p.share, 0)).toBeCloseTo(1, 6);
  });

  it("קופה ריקה מחזירה אחוזי ברירת מחדל בלי מנצחים", () => {
    const prizes = computePrizes([], 1000);
    expect(prizes.every((p) => p.winnerId === null)).toBe(true);
    expect(prizes.find((p) => p.category === "overall")!.amount).toBe(450);
  });
});

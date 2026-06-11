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
    subtotals: { generalPicks: 0, groupStage: 0, knockout: 0, ...sub },
    bingo: 0,
    directionHits: 0,
  };
}

describe("חלוקת קופת הפרסים", () => {
  it("חלוקה בסיסית — 5 משתתפים שונים, אחוזים סטנדרטיים", () => {
    // 6 משתתפים נפרדים, מנצח שונה לכל קטגוריה (בלי כפילויות)
    const board = [
      row("a", 1000, { generalPicks: 10, groupStage: 10, knockout: 10 }), // כללי
      row("b", 900, { generalPicks: 10, groupStage: 10, knockout: 10 }), // שני
      row("c", 800, { generalPicks: 10, groupStage: 10, knockout: 10 }), // שלישי
      row("d", 700, { generalPicks: 10, groupStage: 999, knockout: 10 }), // אלוף בתים
      row("e", 600, { generalPicks: 10, groupStage: 10, knockout: 999 }), // אלוף נוקאאוט
      row("f", 500, { generalPicks: 999, groupStage: 10, knockout: 10 }), // אלוף כללי-ניחושים
    ];
    const prizes = computePrizes(board, 1000);
    const overall = prizes.find((p) => p.category === "overall")!;
    expect(overall.winnerId).toBe("a");
    expect(overall.amount).toBe(400); // 40%
    // ודא 6 מנצחים שונים
    const winners = prizes.map((p) => p.winnerId);
    expect(new Set(winners).size).toBe(6);
    // הקופה הכוללת המחולקת = 100%
    const sum = prizes.reduce((s, p) => s + p.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("אם אדם זוכה ב-2 קטגוריות — הקטנה נמחקת ומתחלקת מחדש", () => {
    // a מנצח כללי (40%) וגם הכי הרבה בנוקאאוט (10%).
    const board = [
      row("a", 1000, { generalPicks: 10, groupStage: 10, knockout: 999 }),
      row("b", 900, { generalPicks: 10, groupStage: 10, knockout: 10 }),
      row("c", 800, { generalPicks: 10, groupStage: 10, knockout: 10 }),
    ];
    const prizes = computePrizes(board, 1000);
    const knockout = prizes.find((p) => p.category === "knockout")!;
    // הקטגוריה הקטנה (נוקאאוט, 10%) בוטלה כי a כבר זכה בכללי (40%)
    expect(knockout.winnerId).toBeNull();
    expect(knockout.share).toBe(0);
    // a עדיין מנצח כללי
    expect(prizes.find((p) => p.category === "overall")!.winnerId).toBe("a");
    // סך האחוזים נשאר 100%
    const sum = prizes.reduce((s, p) => s + p.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("קופה ריקה מחזירה אחוזי ברירת מחדל בלי מנצחים", () => {
    const prizes = computePrizes([], 1000);
    expect(prizes.every((p) => p.winnerId === null)).toBe(true);
    expect(prizes.find((p) => p.category === "overall")!.amount).toBe(400);
  });
});

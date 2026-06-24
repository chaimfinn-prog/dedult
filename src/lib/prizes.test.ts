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
  it("חלוקה בסיסית — 5 משתתפים שונים, אחוזים סטנדרטיים (45/25/10/10/10)", () => {
    const board = [
      row("a", 1000, { generalPicks: 10, groupStage: 10, knockout: 10 }), // כללי
      row("b", 900, { generalPicks: 10, groupStage: 10, knockout: 10 }), // שני
      row("c", 800, { generalPicks: 10, groupStage: 10, knockout: 10 }), // שלישי
      row("d", 700, { generalPicks: 999, groupStage: 10, knockout: 10 }), // אלוף הימורים כלליים
      row("e", 600, { generalPicks: 10, groupStage: 500, knockout: 500 }), // אלוף הימורי משחקים
    ];
    const prizes = computePrizes(board, 1000);
    const overall = prizes.find((p) => p.category === "overall")!;
    expect(overall.winnerId).toBe("a");
    expect(overall.amount).toBe(450); // 45%
    // ודא 5 מנצחים שונים
    const winners = prizes.map((p) => p.winnerId);
    expect(new Set(winners).size).toBe(5);
    // הקופה הכוללת המחולקת = 100%
    const sum = prizes.reduce((s, p) => s + p.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("אלוף הימורי המשחקים = הכי הרבה נק' מהמשחקים (בתים + נוקאאוט)", () => {
    const board = [
      row("a", 1000, { generalPicks: 10, groupStage: 10, knockout: 10 }),
      row("b", 900, { generalPicks: 10, groupStage: 10, knockout: 10 }),
      row("c", 800, { generalPicks: 10, groupStage: 10, knockout: 10 }),
      row("d", 700, { generalPicks: 10, groupStage: 300, knockout: 300 }), // הכי הרבה משחקים, מחוץ לפודיום
    ];
    const prizes = computePrizes(board, 1000);
    expect(prizes.find((p) => p.category === "matchPicks")!.winnerId).toBe("d");
  });

  it("אם אדם זוכה ב-2 קטגוריות — הקטנה נמחקת ומתחלקת מחדש", () => {
    // a מנצח כללי (45%) וגם הכי הרבה בהימורי משחקים (10%).
    const board = [
      row("a", 1000, { generalPicks: 10, groupStage: 500, knockout: 500 }),
      row("b", 900, { generalPicks: 10, groupStage: 10, knockout: 10 }),
      row("c", 800, { generalPicks: 10, groupStage: 10, knockout: 10 }),
    ];
    const prizes = computePrizes(board, 1000);
    const matchPicks = prizes.find((p) => p.category === "matchPicks")!;
    // הקטגוריה הקטנה (הימורי משחקים, 10%) בוטלה כי a כבר זכה בכללי (45%)
    expect(matchPicks.winnerId).toBeNull();
    expect(matchPicks.share).toBe(0);
    expect(prizes.find((p) => p.category === "overall")!.winnerId).toBe("a");
    const sum = prizes.reduce((s, p) => s + p.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("קופה ריקה מחזירה אחוזי ברירת מחדל בלי מנצחים", () => {
    const prizes = computePrizes([], 1000);
    expect(prizes.every((p) => p.winnerId === null)).toBe(true);
    expect(prizes.find((p) => p.category === "overall")!.amount).toBe(450);
  });
});

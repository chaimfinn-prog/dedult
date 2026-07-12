import { describe, expect, it } from "vitest";
import { computeLeaderboard, type ScoreInput } from "./leaderboard";

function baseInput(): ScoreInput {
  return {
    profiles: [
      { id: "u1", full_name: "דני", avatar_url: null },
      { id: "u2", full_name: "רותי", avatar_url: null },
    ],
    generalPicks: [
      {
        user_id: "u1",
        champion: "ARG",
        runner_up: null,
        top_scorer: null,
        second_scorer: null,
        top_assists: null,
        stages: { BRA: "qf" },
      },
      {
        user_id: "u2",
        champion: "ESP",
        runner_up: null,
        top_scorer: null,
        second_scorer: null,
        top_assists: null,
        stages: {},
      },
    ],
    matches: [{ id: 1, home_score: 2, away_score: 1, finished: true }],
    matchPicks: [
      { user_id: "u1", match_id: 1, direction: "home", pred_home: 2, pred_away: 1 },
      { user_id: "u2", match_id: 1, direction: "away", pred_home: 0, pred_away: 1 },
    ],
    results: { champion: "ARG", "stage:BRA": "qf" },
    probOf: (market) => (market === "champion" ? 0.1 : 0.5),
  };
}

describe("חישוב טבלת מובילים", () => {
  it("מדרג לפי נקודות, אלוף נכון נותן הרבה נקודות", () => {
    const board = computeLeaderboard(baseInput());
    expect(board[0].userId).toBe("u1"); // ניחש אלוף נכון + משחק מדויק
    expect(board[0].total).toBeGreaterThan(board[1].total);
  });

  it("u1: אלוף(300) + שלב qf + משחק מדויק; u2: 0", () => {
    const board = computeLeaderboard(baseInput());
    const u1 = board.find((r) => r.userId === "u1")!;
    const u2 = board.find((r) => r.userId === "u2")!;
    expect(u1.breakdown.find((b) => b.label === "אלוף")?.points).toBe(300);
    // BRA: ניחשת qf, הגיעה qf → 30 (10+20, מצטבר עד רבע)
    const ko = u1.breakdown.find((b) => b.label.includes("נוקאאוט"));
    expect(ko?.points).toBe(30);
    expect(u1.breakdown.some((b) => b.label.includes("משחקי"))).toBe(true);
    expect(u2.total).toBe(0);
  });

  it("משחק שלא הסתיים לא נספר", () => {
    const input = baseInput();
    input.matches = [{ id: 1, home_score: null, away_score: null, finished: false }];
    const board = computeLeaderboard(input);
    const u1 = board.find((r) => r.userId === "u1")!;
    expect(u1.breakdown.some((b) => b.label.includes("משחקי"))).toBe(false);
  });
});

describe("בונוס אלוף+סגנית הפוך", () => {
  function input(swap: boolean): ScoreInput {
    return {
      profiles: [{ id: "u1", full_name: "משה", avatar_url: null }],
      generalPicks: [
        {
          user_id: "u1",
          champion: "ARG",
          runner_up: "ESP",
          top_scorer: null,
          second_scorer: null,
          top_assists: null,
          stages: {},
        },
      ],
      matches: [],
      matchPicks: [],
      results: swap
        ? { champion: "ESP", runnerUp: "ARG" } // הפוך: מי שסימנת כאלוף (ARG) הפסידה, מי שסימנת כסגנית (ESP) ניצחה
        : { champion: "ARG", runnerUp: "ESP" }, // סדר נכון
      probOf: (_market, opt) => (opt === "ARG" ? 0.1 : opt === "ESP" ? 0.2 : 0.5),
    };
  }

  it("סדר הפוך: קרדיט חלקי ברמת סגנית לשתיהן, בלי בונוס כפול", () => {
    const board = computeLeaderboard(input(true));
    const u1 = board.find((r) => r.userId === "u1")!;
    expect(u1.breakdown.some((b) => b.label === "אלוף")).toBe(false);
    expect(u1.breakdown.some((b) => b.label === "סגנית")).toBe(false);
    expect(u1.breakdown.some((b) => b.label.includes("בונוס"))).toBe(false);
    const swap = u1.breakdown.find((b) => b.label.includes("הפוך"));
    expect(swap).toBeTruthy();
    // runnerUp(ARG at 0.1)=round(15/0.1)=150 + runnerUp(ESP at 0.2)=round(15/0.2)=75 → 225
    expect(swap!.points).toBe(225);
  });

  it("סדר נכון: עדיין מקבל אלוף+סגנית+בונוס רגיל, בלי שורת 'הפוך'", () => {
    const board = computeLeaderboard(input(false));
    const u1 = board.find((r) => r.userId === "u1")!;
    expect(u1.breakdown.find((b) => b.label === "אלוף")?.points).toBe(300);
    expect(u1.breakdown.find((b) => b.label === "סגנית")?.points).toBe(75);
    expect(u1.breakdown.find((b) => b.label.includes("בונוס"))?.points).toBe(250);
    expect(u1.breakdown.some((b) => b.label.includes("הפוך"))).toBe(false);
  });
});

// אבטחה: שדה direction השמור לא משפיע על הניקוד — הכיוון נגזר מהתוצאה.
// מונע את הניצול: לכתוב ב-API ישיר תוצאה של פייבוריט עם direction של אנדרדוג
// כדי לקבל את תעריף ההפתעה. שני המנחשים ניחשו 2-1 (ניצחון בית) → אותו ניקוד,
// למרות ש-mp.direction שונה ("home" מול "away" מזויף).
describe("אבטחה: ניתוק direction מהתוצאה לא מנפח נקודות", () => {
  function input(): ScoreInput {
    return {
      profiles: [
        { id: "honest", full_name: "ישר", avatar_url: null },
        { id: "cheat", full_name: "רמאי", avatar_url: null },
      ],
      generalPicks: [],
      matches: [
        { id: 1, ext_id: null, stage: "groups", home_team: "ESP", away_team: "CPV", home_score: 2, away_score: 1, finished: true },
      ],
      matchPicks: [
        // שניהם ניחשו 2-1 (ניצחון בית) — תוצאה זהה
        { user_id: "honest", match_id: 1, direction: "home", pred_home: 2, pred_away: 1 },
        // הרמאי שמר direction="away" (אנדרדוג, תעריף גבוה) למרות שהתוצאה היא ניצחון בית
        { user_id: "cheat", match_id: 1, direction: "away", pred_home: 2, pred_away: 1 },
      ],
      results: {},
      // home פייבוריט (הסתברות גבוהה=מעט נק'), away אנדרדוג (הסתברות נמוכה=הרבה נק')
      probOf: (market, opt) => {
        if (!market.startsWith("match:")) return 0.5;
        if (opt === "home") return 0.7;
        if (opt === "draw") return 0.2;
        return 0.1; // away
      },
    };
  }
  it("הרמאי לא מקבל יותר מהישר", () => {
    const board = computeLeaderboard(input());
    const honest = board.find((r) => r.userId === "honest")!;
    const cheat = board.find((r) => r.userId === "cheat")!;
    expect(cheat.total).toBe(honest.total);
  });
});

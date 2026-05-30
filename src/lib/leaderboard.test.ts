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

  it("u1: אלוף(100) + שלב qf + משחק מדויק; u2: 0", () => {
    const board = computeLeaderboard(baseInput());
    const u1 = board.find((r) => r.userId === "u1")!;
    const u2 = board.find((r) => r.userId === "u2")!;
    expect(u1.breakdown.find((b) => b.label === "אלוף")?.points).toBe(100);
    expect(u1.breakdown.some((b) => b.label === "ניחושי שלב")).toBe(true);
    expect(u1.breakdown.some((b) => b.label === "משחקים")).toBe(true);
    expect(u2.total).toBe(0);
  });

  it("משחק שלא הסתיים לא נספר", () => {
    const input = baseInput();
    input.matches = [{ id: 1, home_score: null, away_score: null, finished: false }];
    const board = computeLeaderboard(input);
    const u1 = board.find((r) => r.userId === "u1")!;
    expect(u1.breakdown.some((b) => b.label === "משחקים")).toBe(false);
  });
});

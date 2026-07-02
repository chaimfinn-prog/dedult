import { describe, expect, it } from "vitest";
import { closestMisses, hypotheticalWinnings, mostDraws } from "./funStats";
import type { RevealedMatchPick } from "./social";

const MATCHES = [
  { id: 1, ext_id: "m1", home_score: 2, away_score: 0, finished: true },
  { id: 2, ext_id: "m2", home_score: 1, away_score: 1, finished: true },
  { id: 3, ext_id: "m3", home_score: null, away_score: null, finished: false },
];

function pick(user_id: string, match_id: number, h: number, a: number): RevealedMatchPick {
  return { user_id, match_id, direction: h > a ? "home" : h < a ? "away" : "draw", pred_home: h, pred_away: a };
}

describe("hypotheticalWinnings", () => {
  const decimalOf = (market: string, dir: string) => {
    const table: Record<string, Record<string, number>> = {
      "match:m1": { home: 1.5, draw: 4, away: 6 },
      "match:m2": { home: 2, draw: 3, away: 4 },
    };
    return table[market]?.[dir];
  };

  it("מרוויח כשצדק בכיוון: stake*(decimal-1)", () => {
    const picks = [pick("u1", 1, 2, 0)]; // בית, יחס 1.5
    const out = hypotheticalWinnings(picks, MATCHES, decimalOf, 10);
    expect(out).toEqual([{ userId: "u1", value: 10 * 0.5, extra: 1 }]);
  });

  it("מפסיד stake כשטעה בכיוון", () => {
    const picks = [pick("u1", 1, 0, 2)]; // ניחש חוץ, בפועל בית
    const out = hypotheticalWinnings(picks, MATCHES, decimalOf, 10);
    expect(out[0].value).toBe(-10);
  });

  it("מתעלם ממשחק שלא הסתיים", () => {
    const picks = [pick("u1", 3, 1, 0)];
    const out = hypotheticalWinnings(picks, MATCHES, decimalOf, 10);
    expect(out).toEqual([]);
  });

  it("ממיין מהגבוה לנמוך", () => {
    const picks = [pick("u1", 1, 0, 2), pick("u2", 1, 2, 0)];
    const out = hypotheticalWinnings(picks, MATCHES, decimalOf, 10);
    expect(out[0].userId).toBe("u2");
    expect(out[1].userId).toBe("u1");
  });
});

describe("mostDraws", () => {
  it("סופר רק ניחושי תיקו", () => {
    const picks = [pick("u1", 1, 1, 1), pick("u1", 2, 1, 1), pick("u1", 3, 2, 0)];
    expect(mostDraws(picks)).toEqual([{ userId: "u1", value: 2 }]);
  });
});

describe("closestMisses", () => {
  it("סופר מרחק 1 בדיוק, לא בינגו ולא רחוק יותר", () => {
    const picks = [
      pick("u1", 1, 2, 1), // בפועל 2-0, מרחק = |2-2|+|1-0| = 1
      pick("u2", 1, 2, 0), // בינגו — לא נספר
      pick("u3", 1, 4, 0), // מרחק 2 — לא נספר
    ];
    expect(closestMisses(picks, MATCHES)).toEqual([{ userId: "u1", value: 1 }]);
  });
});

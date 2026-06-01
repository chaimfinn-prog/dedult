import { describe, expect, it } from "vitest";
import { generalStats, matchDirectionStats, popularScores } from "./stats";
import type { RevealedGeneral, RevealedMatchPick } from "./social";

describe("סטטיסטיקות כלליות", () => {
  it("סופר ומדרג מלך שערים לפי פופולריות", () => {
    const base = {
      second_scorer: null,
      top_assists: null,
      golden_glove: null,
      golden_ball: null,
      most_goals_team: null,
      best_defense_team: null,
      bracket: null,
    };
    const rows: RevealedGeneral[] = [
      { user_id: "a", top_scorer: "מסי", ...base },
      { user_id: "b", top_scorer: "מסי", ...base },
      { user_id: "c", top_scorer: "אמבפה", ...base },
    ];
    const s = generalStats(rows);
    expect(s.topScorer[0].key).toBe("מסי");
    expect(s.topScorer[0].count).toBe(2);
    expect(s.topScorer[0].pct).toBeCloseTo(2 / 3, 5);
    expect(s.totalVoters).toBe(3);
  });
});

describe("סטטיסטיקות משחק", () => {
  const picks: RevealedMatchPick[] = [
    { user_id: "a", match_id: 1, direction: "home", pred_home: 2, pred_away: 1 },
    { user_id: "b", match_id: 1, direction: "home", pred_home: 2, pred_away: 1 },
    { user_id: "c", match_id: 1, direction: "draw", pred_home: 1, pred_away: 1 },
  ];
  it("מפלח כיוונים", () => {
    const s = matchDirectionStats(picks)[1];
    expect(s.home).toBe(2);
    expect(s.draw).toBe(1);
    expect(s.away).toBe(0);
    expect(s.total).toBe(3);
  });
  it("תוצאה מדויקת נפוצה", () => {
    const top = popularScores(picks, 1);
    expect(top[0].key).toBe("2:1");
    expect(top[0].count).toBe(2);
  });
});

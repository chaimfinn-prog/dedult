// ============================================================
//  stats.ts — סטטיסטיקות ניחושים של החברים (פונקציות טהורות)
//  פועל רק על ניחושים חשופים (אחרי נעילה), שמגיעים מ-RPC המאובטח.
// ============================================================

import { championFrom } from "./bracketState";
import type { RevealedGeneral, RevealedMatchPick } from "./social";

export interface CountItem {
  key: string; // קוד נבחרת / שם שחקן / כיוון
  count: number;
  pct: number; // אחוז מכלל המנחשים בקטגוריה
}

function tally(values: (string | null | undefined)[]): CountItem[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
    total++;
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);
}

export interface GeneralStats {
  champion: CountItem[];
  topScorer: CountItem[];
  secondScorer: CountItem[];
  topAssists: CountItem[];
  goldenBall: CountItem[];
  goldenGlove: CountItem[];
  mostGoalsTeam: CountItem[];
  bestDefenseTeam: CountItem[];
  totalVoters: number;
}

/** מפלח את הניחושים הכלליים: מי הכי פופולרי לאלוף / מלך שערים וכו'. */
export function generalStats(rows: RevealedGeneral[]): GeneralStats {
  return {
    champion: tally(rows.map((r) => (r.bracket ? championFrom(r.bracket) : null))),
    topScorer: tally(rows.map((r) => r.top_scorer)),
    secondScorer: tally(rows.map((r) => r.second_scorer)),
    topAssists: tally(rows.map((r) => r.top_assists)),
    goldenBall: tally(rows.map((r) => r.golden_ball)),
    goldenGlove: tally(rows.map((r) => r.golden_glove)),
    mostGoalsTeam: tally(rows.map((r) => r.most_goals_team)),
    bestDefenseTeam: tally(rows.map((r) => r.best_defense_team)),
    totalVoters: rows.length,
  };
}

export interface MatchDirStats {
  matchId: number;
  home: number;
  draw: number;
  away: number;
  total: number;
}

/** לכל משחק: כמה ניחשו בית / תיקו / חוץ. */
export function matchDirectionStats(
  picks: RevealedMatchPick[],
): Record<number, MatchDirStats> {
  const out: Record<number, MatchDirStats> = {};
  for (const p of picks) {
    const s = (out[p.match_id] ??= {
      matchId: p.match_id,
      home: 0,
      draw: 0,
      away: 0,
      total: 0,
    });
    s[p.direction]++;
    s.total++;
  }
  return out;
}

/** התוצאה המדויקת הנפוצה ביותר למשחק נתון. */
export function popularScores(
  picks: RevealedMatchPick[],
  matchId: number,
): CountItem[] {
  return tally(
    picks
      .filter((p) => p.match_id === matchId)
      .map((p) => `${p.pred_home}:${p.pred_away}`),
  );
}

// ============================================================
//  leaderboard.ts — צבירת נקודות לכל המשתמשים (פונקציה טהורה)
//  מקבל את כל הנתונים ומחזיר דירוג עם פירוט מקור הנקודות.
// ============================================================

import {
  potentialGeneralPoints,
  potentialStagePoints,
  scoreMatchPick,
} from "./scoring";
import {
  championFrom,
  runnerUpFrom,
  stagesFromBracket,
  type BracketPick,
} from "./bracketState";
import type {
  Direction,
  GeneralCategory,
  MarketOption,
  Stage,
} from "./types";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}
export interface GeneralPickRow {
  user_id: string;
  champion: string | null;
  runner_up: string | null;
  top_scorer: string | null;
  second_scorer: string | null;
  top_assists: string | null;
  stages: Record<string, string>;
  /** לוח העץ של המשתמש — ממנו נגזרים אלוף/סגנית/שלבים */
  bracket?: BracketPick | null;
}
export interface MatchRow {
  id: number;
  ext_id?: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}
export interface MatchPickRow {
  user_id: string;
  match_id: number;
  direction: Direction;
  pred_home: number;
  pred_away: number;
}

export interface ScoreInput {
  profiles: Profile[];
  generalPicks: GeneralPickRow[];
  matches: MatchRow[];
  matchPicks: MatchPickRow[];
  /** תוצאות אמת: key → value. למשל champion→ARG, "stage:BRA"→qf */
  results: Record<string, string>;
  /** מחזיר את הסתברות האופציה בשוק נתון (לחישוב נקודות) */
  probOf: (market: string, optionId: string) => number;
}

export interface Breakdown {
  label: string;
  points: number;
}
export interface LeaderRow {
  userId: string;
  name: string;
  avatar: string | null;
  total: number;
  breakdown: Breakdown[];
}

// שווקי שחקנים בלבד (אלוף/סגנית נגזרים מהלוח, ראו למטה)
const GENERAL_FIELDS: {
  field: keyof GeneralPickRow;
  cat: GeneralCategory;
  market: string;
  label: string;
}[] = [
  { field: "top_scorer", cat: "topScorer", market: "topScorer", label: "מלך שערים" },
  { field: "second_scorer", cat: "secondScorer", market: "secondScorer", label: "סגן מלך שערים" },
  { field: "top_assists", cat: "topAssists", market: "topAssists", label: "מלך בישולים" },
];

// הסתברות שלב ברירת מחדל (תואם ל-GeneralPicks)
const DEFAULT_STAGE_PROB: Record<Stage, number> = {
  groups: 0.42, r32: 0.26, r16: 0.15, qf: 0.09, sf: 0.045, final: 0.022, winner: 0.013,
};
const SP_SUM = Object.values(DEFAULT_STAGE_PROB).reduce((a, b) => a + b, 0);

export function computeLeaderboard(input: ScoreInput): LeaderRow[] {
  const { profiles, generalPicks, matches, matchPicks, results, probOf } = input;
  const gpByUser = new Map(generalPicks.map((g) => [g.user_id, g]));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const rows: LeaderRow[] = profiles.map((p) => {
    const breakdown: Breakdown[] = [];
    let total = 0;

    const gp = gpByUser.get(p.id);
    if (gp) {
      // שווקי שחקנים (מלך שערים / סגן / בישולים)
      for (const { field, cat, market, label } of GENERAL_FIELDS) {
        const pick = gp[field] as string | null;
        if (pick && results[market] && results[market] === pick) {
          const pts = potentialGeneralPoints(cat, probOf(market, pick));
          total += pts;
          breakdown.push({ label, points: pts });
        }
      }

      // אלוף + סגנית — נגזרים מלוח העץ של המשתמש
      const champ = gp.bracket ? championFrom(gp.bracket) : gp.champion;
      const runner = gp.bracket ? runnerUpFrom(gp.bracket) : gp.runner_up;
      if (champ && results["champion"] === champ) {
        const pts = potentialGeneralPoints("champion", probOf("champion", champ));
        total += pts;
        breakdown.push({ label: "אלוף", points: pts });
      }
      if (runner && results["runnerUp"] === runner) {
        const pts = potentialGeneralPoints("runnerUp", probOf("runnerUp", runner));
        total += pts;
        breakdown.push({ label: "סגנית", points: pts });
      }

      // ניחושי שלב לכל נבחרת — נגזרים מהלוח (או מהשדה הישן)
      const stages: Record<string, string> = gp.bracket
        ? stagesFromBracket(gp.bracket)
        : (gp.stages ?? {});
      let stageTotal = 0;
      for (const [code, stage] of Object.entries(stages)) {
        const truth = results[`stage:${code}`];
        if (truth && truth === stage) {
          const prob = DEFAULT_STAGE_PROB[stage as Stage] / SP_SUM;
          stageTotal += potentialStagePoints(stage as Stage, prob);
        }
      }
      if (stageTotal > 0) breakdown.push({ label: "ניחושי שלב", points: stageTotal });
      total += stageTotal;
    }

    // ניחושי משחקים
    let matchTotal = 0;
    for (const mp of matchPicks.filter((x) => x.user_id === p.id)) {
      const m = matchById.get(mp.match_id);
      if (!m || !m.finished || m.home_score == null || m.away_score == null) continue;
      // היחסים נשמרים לפי ext_id (מזהה The Odds API); נפילה ל-id פנימי
      const prob = probOf(`match:${m.ext_id ?? mp.match_id}`, mp.direction);
      const res = scoreMatchPick(
        prob,
        { home: mp.pred_home, away: mp.pred_away },
        { home: m.home_score, away: m.away_score },
      );
      matchTotal += res.total;
    }
    if (matchTotal > 0) breakdown.push({ label: "משחקים", points: matchTotal });
    total += matchTotal;

    return {
      userId: p.id,
      name: p.full_name ?? "אנונימי",
      avatar: p.avatar_url,
      total,
      breakdown,
    };
  });

  return rows.sort((a, b) => b.total - a.total);
}

/** עוזר: בונה פונקציית probOf מתוך רשימת אופציות לכל שוק */
export function makeProbOf(
  markets: Record<string, MarketOption[]>,
): (market: string, optionId: string) => number {
  return (market, optionId) => {
    const opt = markets[market]?.find((o) => o.id === optionId);
    if (opt) return opt.prob;
    // ברירת מחדל לכיווני משחק שאין להם יחסים: שווה
    if (market.startsWith("match:")) return 1 / 3;
    return 0.5;
  };
}

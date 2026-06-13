// ============================================================
//  leaderboard.ts — צבירת נקודות לכל המשתמשים (פונקציה טהורה)
//  מקבל את כל הנתונים ומחזיר דירוג עם פירוט מקור הנקודות.
// ============================================================

import { CHAMPION_DOUBLE_BONUS } from "../config";
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
import { exactBonusFor } from "./matchOdds";
import { TEAM_BY_CODE } from "../data/teams";
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
  golden_glove?: string | null;
  golden_ball?: string | null;
  most_goals_team?: string | null;
  best_defense_team?: string | null;
  stages: Record<string, string>;
  /** לוח העץ של המשתמש — ממנו נגזרים אלוף/סגנית/שלבים */
  bracket?: BracketPick | null;
}
export interface MatchRow {
  id: number;
  ext_id?: string | null;
  stage?: string | null; // 'groups' = שלב בתים; אחרת נוקאאוט
  home_team?: string | null;
  away_team?: string | null;
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
  detail?: string; // פירוט נוסף (למשל "ניחשת 2-1 · יצא 2-1 · בינגו!")
}
export interface LeaderRow {
  userId: string;
  name: string;
  avatar: string | null;
  total: number;
  breakdown: Breakdown[];
  /** סכומי-משנה לפי קטגוריית פרס */
  subtotals: {
    generalPicks: number; // כל הניחושים הכלליים (כולל שלבים ובונוס)
    groupStage: number; // נקודות ממשחקי שלב הבתים
    knockout: number; // נקודות ממשחקי הנוקאאוט
  };
  /** מספר ניחושי משחק עם תוצאה מדויקת ("בינגו") */
  bingo: number;
  /** מספר ניחושי משחק עם כיוון נכון (כולל בינגו) */
  directionHits: number;
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
  { field: "golden_ball", cat: "goldenBall", market: "goldenBall", label: "כדור הזהב" },
  { field: "golden_glove", cat: "goldenGlove", market: "goldenGlove", label: "כפפת הזהב" },
  { field: "most_goals_team", cat: "mostGoalsTeam", market: "mostGoalsTeam", label: "קבוצה כובשת" },
  { field: "best_defense_team", cat: "bestDefenseTeam", market: "bestDefenseTeam", label: "הגנה הכי טובה" },
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
      const champCorrect = !!champ && results["champion"] === champ;
      const runnerCorrect = !!runner && results["runnerUp"] === runner;
      if (champCorrect) {
        const pts = potentialGeneralPoints("champion", probOf("champion", champ!));
        total += pts;
        breakdown.push({ label: "אלוף", points: pts });
      }
      if (runnerCorrect) {
        const pts = potentialGeneralPoints("runnerUp", probOf("runnerUp", runner!));
        total += pts;
        breakdown.push({ label: "סגנית", points: pts });
      }
      // בונוס ענק: מי שצדק גם באלוף וגם בסגנית
      if (champCorrect && runnerCorrect) {
        total += CHAMPION_DOUBLE_BONUS;
        breakdown.push({ label: "🎯 בונוס אלוף+סגנית", points: CHAMPION_DOUBLE_BONUS });
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

    // עד כאן הכל "ניחושים כלליים" — נשמור כסכום-משנה לקטגוריית הפרס
    const generalPicksTotal = total;

    // ניחושי משחקים — מפוצלים לשלב בתים מול נוקאאוט
    let groupStageTotal = 0;
    let knockoutTotal = 0;
    let bingo = 0; // תוצאות מדויקות
    let directionHits = 0; // כיוונים נכונים
    const matchDetails: Breakdown[] = []; // פירוט שקוף לכל משחק
    const teamName = (c?: string | null) => (c ? TEAM_BY_CODE[c]?.nameHe ?? c : "?");
    for (const mp of matchPicks.filter((x) => x.user_id === p.id)) {
      const m = matchById.get(mp.match_id);
      if (!m || !m.finished || m.home_score == null || m.away_score == null) continue;
      // היחסים נשמרים לפי ext_id (מזהה The Odds API); נפילה ל-id פנימי
      const mkt = `match:${m.ext_id ?? mp.match_id}`;
      const prob = probOf(mkt, mp.direction);
      // בונוס תוצאה מדויקת לפי נדירות התוצאה בפועל (מודל פואסון מהיחסים)
      const exactBonus = exactBonusFor(
        probOf(mkt, "home"),
        probOf(mkt, "draw"),
        probOf(mkt, "away"),
        m.home_score,
        m.away_score,
      );
      const res = scoreMatchPick(
        prob,
        { home: mp.pred_home, away: mp.pred_away },
        { home: m.home_score, away: m.away_score },
        exactBonus,
      );
      if (res.exactCorrect) bingo++;
      if (res.directionCorrect) directionHits++;
      if ((m.stage ?? "groups") === "groups") groupStageTotal += res.total;
      else knockoutTotal += res.total;

      // פירוט שקוף לכל משחק שהסתיים שבו ניחש המשתמש
      if (res.total > 0) {
        const label = `${teamName(m.home_team)} ${m.home_score}-${m.away_score} ${teamName(m.away_team)}`;
        const detail = res.exactCorrect
          ? `🎯 בינגו! ניחשת ${mp.pred_home}-${mp.pred_away} (כיוון ${res.directionPoints} + בונוס ${res.exactBonus})`
          : res.directionCorrect
            ? `✓ כיוון נכון · ניחשת ${mp.pred_home}-${mp.pred_away}`
            : `ניחשת ${mp.pred_home}-${mp.pred_away}`;
        matchDetails.push({ label, points: res.total, detail });
      }
    }
    if (groupStageTotal > 0) breakdown.push({ label: "משחקי שלב הבתים (סה\"כ)", points: groupStageTotal });
    if (knockoutTotal > 0) breakdown.push({ label: "משחקי נוקאאוט (סה\"כ)", points: knockoutTotal });
    breakdown.push(...matchDetails);
    total += groupStageTotal + knockoutTotal;

    return {
      userId: p.id,
      name: p.full_name ?? "אנונימי",
      avatar: p.avatar_url,
      total,
      breakdown,
      subtotals: {
        generalPicks: generalPicksTotal,
        groupStage: groupStageTotal,
        knockout: knockoutTotal,
      },
      bingo,
      directionHits,
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

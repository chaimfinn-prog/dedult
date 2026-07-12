// ============================================================
//  leaderboard.ts — צבירת נקודות לכל המשתמשים (פונקציה טהורה)
//  מקבל את כל הנתונים ומחזיר דירוג עם פירוט מקור הנקודות.
// ============================================================

import { CHAMPION_DOUBLE_BONUS, KNOCKOUT_MULTIPLIER_BY_STAGE } from "../config";
import {
  directionOf,
  potentialGeneralPoints,
  scoreMatchPick,
} from "./scoring";
import {
  championFrom,
  normalizeBracket,
  runnerUpFrom,
  stagesFromBracket,
  type BracketPick,
} from "./bracketState";
import { computeGroupStandings, scoreGroupPick } from "./groups";
import { scoreKnockoutAdvancement } from "./knockout";
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
  kickoff?: string | null; // למיון כרונולוגי של הפירוט
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
    generalMarkets: number; // ניחושים כלליים: שווקים + אלוף/סגנית + בונוס
    bracketStages: number; // לוח־עץ: מיקומי בתים + התקדמות נוקאאוט
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

export function computeLeaderboard(input: ScoreInput): LeaderRow[] {
  const { profiles, generalPicks, matches, matchPicks, results, probOf } = input;
  const gpByUser = new Map(generalPicks.map((g) => [g.user_id, g]));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  // דירוג בתים סופי (זהה לכל המשתמשים) — אוטומטי מתוצאות המשחקים,
  // עם אפשרות עקיפה ידנית של האדמין דרך results['group:X']='SUI,CAN,BIH,QAT'.
  const autoStandings = computeGroupStandings(matches);
  const groupStandings: Record<string, string[]> = { ...autoStandings };
  for (const [key, val] of Object.entries(results)) {
    if (key.startsWith("group:") && val) {
      groupStandings[key.slice(6)] = val.split(",").map((c) => c.trim());
    }
  }

  const advancedThirds = new Set(
    matches.filter((m) => m.stage === "r32").flatMap((m) => [m.home_team, m.away_team].filter(Boolean) as string[]),
  );

  const rows: LeaderRow[] = profiles.map((p) => {
    const breakdown: Breakdown[] = [];
    let total = 0;
    let marketsTotal = 0; // ניחושים כלליים: שווקים + אלוף/סגנית + בונוס
    let stagesTotal = 0; // לוח־עץ: מיקומי בתים + התקדמות נוקאאוט
    const teamName = (c?: string | null) => (c ? TEAM_BY_CODE[c]?.nameHe ?? c : "?");

    const gp = gpByUser.get(p.id);
    if (gp) {
      // ===== ניחושים כלליים (שווקים + אלוף/סגנית) — קטגוריית "אלוף כללי" =====
      for (const { field, cat, market, label } of GENERAL_FIELDS) {
        const pick = gp[field] as string | null;
        if (pick && results[market] && results[market] === pick) {
          const pts = potentialGeneralPoints(cat, probOf(market, pick));
          marketsTotal += pts;
          breakdown.push({ label, points: pts });
        }
      }

      const champ = gp.bracket ? championFrom(gp.bracket) : gp.champion;
      const runner = gp.bracket ? runnerUpFrom(gp.bracket) : gp.runner_up;
      const champCorrect = !!champ && results["champion"] === champ;
      const runnerCorrect = !!runner && results["runnerUp"] === runner;
      // היפוך: שתי הקבוצות שסימנת הגיעו לגמר וזוהו נכון, אבל בסדר הפוך
      // (מי שסימנת כאלוף בעצם הפסידה, מי שסימנת כסגנית בעצם ניצחה).
      const swapped =
        !champCorrect &&
        !runnerCorrect &&
        !!champ &&
        !!runner &&
        results["champion"] === runner &&
        results["runnerUp"] === champ;
      if (champCorrect) {
        const pts = potentialGeneralPoints("champion", probOf("champion", champ!));
        marketsTotal += pts;
        breakdown.push({ label: "אלוף", points: pts });
      }
      if (runnerCorrect) {
        const pts = potentialGeneralPoints("runnerUp", probOf("runnerUp", runner!));
        marketsTotal += pts;
        breakdown.push({ label: "סגנית", points: pts });
      }
      if (champCorrect && runnerCorrect) {
        marketsTotal += CHAMPION_DOUBLE_BONUS;
        breakdown.push({ label: "🎯 בונוס אלוף+סגנית", points: CHAMPION_DOUBLE_BONUS });
      } else if (swapped) {
        // שתי הקבוצות זוהו נכון כגמריסטיות, אך לא בתפקיד המדויק —
        // קרדיט חלקי ברמת סגנית (משקל נמוך) לשתיהן, בלי בונוס הכפול.
        const pts =
          potentialGeneralPoints("runnerUp", probOf("champion", champ!)) +
          potentialGeneralPoints("runnerUp", probOf("runnerUp", runner!));
        marketsTotal += pts;
        breakdown.push({ label: "🔄 אלוף+סגנית הפוך", points: pts });
      }

      // ===== שלבים (לוח־עץ) — נספר בכללי בלבד, לא בקטגוריית "אלוף כללי" =====
      // מיקומי בתים: 5 על מקום מדויק, 2 על קבוצה שעלתה במקום השני (מקומות 1–2).
      // מוצג כשורה מסוכמת אחת (לא פירוט לכל בית) — שלב הבתים כבר הסתיים.
      const bracket = gp.bracket ? normalizeBracket(gp.bracket) : null;
      if (bracket) {
        let groupsPoints = 0;
        let exactHits = 0, qualifiedHits = 0, thirdHits = 0;
        for (const [g, actual] of Object.entries(groupStandings)) {
          const r = scoreGroupPick(bracket.groupRankings[g], actual, advancedThirds);
          groupsPoints += r.points;
          exactHits += r.exactHits;
          qualifiedHits += r.qualifiedHits;
          thirdHits += r.thirdHits;
        }
        if (groupsPoints > 0) {
          stagesTotal += groupsPoints;
          const parts: string[] = [];
          if (exactHits) parts.push(`${exactHits}× מדויק`);
          if (qualifiedHits) parts.push(`${qualifiedHits}× עלתה`);
          if (thirdHits) parts.push(`${thirdHits}× שלישית עולה`);
          breakdown.push({
            label: "🏟️ שלב הבתים (סה\"כ)",
            points: groupsPoints,
            detail: parts.join(" · "),
          });
        }
      }

      // התקדמות בנוקאאוט — 10 נק' לכל שלב (רבע/חצי/גמר) שקבוצה הגיעה אליו וניחשת.
      const stages: Record<string, string> = gp.bracket
        ? stagesFromBracket(gp.bracket)
        : (gp.stages ?? {});
      let koAdvTotal = 0;
      const koTeams: string[] = [];
      for (const [code, predicted] of Object.entries(stages)) {
        const actual = results[`stage:${code}`];
        const r = scoreKnockoutAdvancement(predicted as Stage, actual as Stage | undefined);
        if (r.points > 0) {
          koAdvTotal += r.points;
          koTeams.push(`${teamName(code)} (${r.points})`);
        }
      }
      if (koAdvTotal > 0) {
        stagesTotal += koAdvTotal;
        breakdown.push({
          label: "🏟️ התקדמות בנוקאאוט",
          points: koAdvTotal,
          detail: koTeams.join(" · "),
        });
      }
    }
    total += marketsTotal + stagesTotal;

    // ניחושי משחקים — מפוצלים לשלב בתים מול נוקאאוט
    let groupStageTotal = 0;
    let knockoutTotal = 0;
    let bingo = 0; // תוצאות מדויקות
    let directionHits = 0; // כיוונים נכונים
    // פירוט המשחקים — אוספים הכל, ובסוף מציגים רק בינגו לפי סדר כרונולוגי
    const matchDetails: (Breakdown & { kickoff?: string | null; bingo: boolean })[] = [];
    for (const mp of matchPicks.filter((x) => x.user_id === p.id)) {
      const m = matchById.get(mp.match_id);
      if (!m || !m.finished || m.home_score == null || m.away_score == null) continue;
      // היחסים נשמרים לפי ext_id (מזהה The Odds API); נפילה ל-id פנימי
      const mkt = `match:${m.ext_id ?? mp.match_id}`;
      // אבטחה: הכיוון נגזר מהתוצאה שהוזנה, לא משדה direction השמור (שניתן
      // לזיוף ב-API ישיר כדי לנפח נקודות). כך הניקוד תמיד עקבי עם הניחוש.
      const pickDir = directionOf(mp.pred_home, mp.pred_away);
      const prob = probOf(mkt, pickDir);
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
      const stage = (m.stage ?? "groups") as Stage;
      const isKnockout = stage !== "groups";
      const multiplier = KNOCKOUT_MULTIPLIER_BY_STAGE[stage] ?? 1;
      const matchPoints = isKnockout ? Math.round(res.total * multiplier) : res.total;
      if (isKnockout) knockoutTotal += matchPoints;
      else groupStageTotal += matchPoints;

      // פירוט: אוספים רק בינגו (תוצאה מדויקת) להצגה כרונולוגית בהמשך
      if (res.exactCorrect) {
        const label = `${teamName(m.home_team)} ${m.home_score}-${m.away_score} ${teamName(m.away_team)}`;
        const detail = `🎯 בינגו! ניחשת ${mp.pred_home}-${mp.pred_away} (כיוון ${res.directionPoints} + בונוס ${res.exactBonus}${isKnockout ? ` ×${multiplier}` : ""})`;
        matchDetails.push({ label, points: matchPoints, detail, kickoff: m.kickoff, bingo: true });
      }
    }
    if (groupStageTotal > 0) breakdown.push({ label: "משחקי שלב הבתים (סה\"כ)", points: groupStageTotal });
    if (knockoutTotal > 0) breakdown.push({ label: "משחקי נוקאאוט (סה\"כ)", points: knockoutTotal });
    // רק בינגו, ממוין כרונולוגית לפי שריקת הפתיחה
    const bingoLines = matchDetails
      .slice()
      .sort((x, y) => (x.kickoff ?? "").localeCompare(y.kickoff ?? ""))
      .map(({ label, points, detail }) => ({ label, points, detail }));
    breakdown.push(...bingoLines);
    total += groupStageTotal + knockoutTotal;

    return {
      userId: p.id,
      name: p.full_name ?? "אנונימי",
      avatar: p.avatar_url,
      total,
      breakdown,
      subtotals: {
        generalMarkets: marketsTotal,
        bracketStages: stagesTotal,
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

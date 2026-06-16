// ============================================================
//  matchSocial.ts — סטטיסטיקה חברתית לכל משחק + טקסט שיתוף לוואטסאפ
//  פונקציות טהורות (נבדקות), בלי תלות ב-React.
// ============================================================

import { championFrom } from "./bracketState";
import { TEAM_BY_CODE } from "../data/teams";
import { TOP_ASSISTS_SEED, TOP_SCORER_SEED } from "../data/seedPlayers";
import { GOLDEN_BALL_SEED, GOLDEN_GLOVE_SEED } from "../data/seedExtraMarkets";
import type { RevealedGeneral, RevealedMatchPick } from "./social";

/** מיפוי שם שחקן → קוד נבחרת, מתוך כל שווקי השחקנים (לשיוך לניחוש כללי). */
export const PLAYER_TEAM: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const seed of [
    TOP_SCORER_SEED,
    TOP_ASSISTS_SEED,
    GOLDEN_GLOVE_SEED,
    GOLDEN_BALL_SEED,
  ]) {
    for (const p of seed) map[p.name] = p.team;
  }
  return map;
})();

export interface RelevantPickLine {
  emoji: string;
  category: string; // "אלוף" / "מלך שערים" ...
  who: string; // שם החבר
  what: string; // הערך שניחש (שם שחקן / שם נבחרת)
}

const PLAYER_MARKETS: {
  field: keyof RevealedGeneral;
  emoji: string;
  cat: string;
}[] = [
  { field: "top_scorer", emoji: "👟", cat: "מלך שערים" },
  { field: "second_scorer", emoji: "🎯", cat: "סגן מלך שערים" },
  { field: "top_assists", emoji: "🅰️", cat: "מלך בישולים" },
  { field: "golden_ball", emoji: "⭐", cat: "כדור הזהב" },
  { field: "golden_glove", emoji: "🧤", cat: "כפפת הזהב" },
];
const TEAM_MARKETS: {
  field: keyof RevealedGeneral;
  emoji: string;
  cat: string;
}[] = [
  { field: "most_goals_team", emoji: "⚽", cat: "קבוצה כובשת" },
  { field: "best_defense_team", emoji: "🛡️", cat: "הגנה הכי טובה" },
];

/**
 * ניחושים כלליים שרלוונטיים לשתי הקבוצות במשחק:
 *  - מי ניחש אחת מהן כאלופה (נגזר מהלוח).
 *  - מי ניחש שחקן מאחת מהן (מלך שערים / כדור הזהב / כפפה / בישולים).
 *  - מי ניחש אחת מהן ככובשת/הגנה הטובה ביותר.
 */
export function relevantGeneralForMatch(
  general: RevealedGeneral[],
  nameOf: (userId: string) => string,
  homeCode: string,
  awayCode: string,
): RelevantPickLine[] {
  const teams = new Set([homeCode, awayCode]);
  const lines: RelevantPickLine[] = [];
  const teamName = (c: string) => TEAM_BY_CODE[c]?.nameHe ?? c;

  for (const g of general) {
    const champ = g.bracket ? championFrom(g.bracket) : null;
    if (champ && teams.has(champ)) {
      lines.push({ emoji: "🏆", category: "אלוף", who: nameOf(g.user_id), what: teamName(champ) });
    }
    for (const pm of PLAYER_MARKETS) {
      const v = g[pm.field] as string | null;
      if (v && teams.has(PLAYER_TEAM[v])) {
        lines.push({ emoji: pm.emoji, category: pm.cat, who: nameOf(g.user_id), what: v });
      }
    }
    for (const tm of TEAM_MARKETS) {
      const v = g[tm.field] as string | null;
      if (v && teams.has(v)) {
        lines.push({ emoji: tm.emoji, category: tm.cat, who: nameOf(g.user_id), what: teamName(v) });
      }
    }
  }
  return lines;
}

export interface DirCount {
  home: number;
  draw: number;
  away: number;
}

export function dirCountOf(picks: RevealedMatchPick[]): DirCount {
  const c: DirCount = { home: 0, draw: 0, away: 0 };
  for (const p of picks) {
    if (p.pred_home > p.pred_away) c.home++;
    else if (p.pred_home < p.pred_away) c.away++;
    else c.draw++;
  }
  return c;
}

/** התוצאה המנוחשת הנפוצה ביותר (string "h-a" + ספירה), או null. */
export function topPredictedScore(
  picks: RevealedMatchPick[],
): { score: string; count: number } | null {
  const m = new Map<string, number>();
  for (const p of picks) {
    const k = `${p.pred_home}-${p.pred_away}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? { score: top[0], count: top[1] } : null;
}

/**
 * בונה הודעת וואטסאפ יפה ומסכמת למשחק (טקסט פשוט עם אמוג'ים).
 * כולל: פילוח כיוונים, התוצאה הנפוצה, ניחושים כלליים רלוונטיים, ואם המשחק
 * הסתיים — מי פגע בכיוון/בבינגו.
 */
export function buildMatchShareText(opts: {
  homeName: string;
  awayName: string;
  kickoffLabel: string;
  picks: RevealedMatchPick[];
  nameOf: (userId: string) => string;
  relevant: RelevantPickLine[];
  actual: { h: number; a: number } | null;
}): string {
  const { homeName, awayName, kickoffLabel, picks, nameOf, relevant, actual } = opts;
  const c = dirCountOf(picks);
  const total = picks.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);
  const lines: string[] = [];

  lines.push(`⚽ *${homeName} נגד ${awayName}*`);
  lines.push(kickoffLabel);
  if (actual) lines.push(`התוצאה: *${homeName} ${actual.h} - ${actual.a} ${awayName}*`);
  lines.push("");
  lines.push(`🗳️ ${picks.length} חברים ניחשו:`);
  lines.push(`• ניצחון ${homeName}: ${c.home} (${pct(c.home)}%)`);
  lines.push(`• תיקו: ${c.draw} (${pct(c.draw)}%)`);
  lines.push(`• ניצחון ${awayName}: ${c.away} (${pct(c.away)}%)`);

  const top = topPredictedScore(picks);
  if (top) lines.push(`• התוצאה הכי מנוחשת: ${top.score.replace("-", " - ")} (${top.count})`);

  if (actual) {
    const actualDir =
      actual.h > actual.a ? "home" : actual.h < actual.a ? "away" : "draw";
    const bingo = picks.filter((p) => p.pred_home === actual.h && p.pred_away === actual.a);
    const dirHit = picks.filter((p) => {
      const d = p.pred_home > p.pred_away ? "home" : p.pred_home < p.pred_away ? "away" : "draw";
      return d === actualDir;
    });
    lines.push("");
    lines.push(`✓ פגעו בכיוון: ${dirHit.length}`);
    if (bingo.length) {
      lines.push(`🎯 בינגו (תוצאה מדויקת): ${bingo.map((p) => nameOf(p.user_id)).join(", ")}`);
    } else {
      lines.push(`🎯 אף אחד לא פגע בתוצאה המדויקת`);
    }
  }

  if (relevant.length) {
    lines.push("");
    lines.push(`🔮 ניחושים כלליים שקשורים למשחק:`);
    for (const r of relevant) {
      lines.push(`${r.emoji} ${r.who} — ${r.category}: ${r.what}`);
    }
  }

  lines.push("");
  lines.push("— ניחושי המונדיאל שלנו 🏆");
  return lines.join("\n");
}

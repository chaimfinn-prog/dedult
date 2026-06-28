// ============================================================
//  groups.ts — דירוג בתים אוטומטי מתוצאות המשחקים + ניקוד מיקומים מדויקים.
//  ניקוד: מקום 1 = 10, מקום 2 = 5, מקום 3 = 5 (מקסימום 20 לבית).
//  פונקציות טהורות (נבדקות).
// ============================================================

import { TEAMS } from "../data/teams";

/** קוד נבחרת → אות הבית (A..L) */
export const TEAM_GROUP: Record<string, string> = Object.fromEntries(
  TEAMS.map((t) => [t.code, t.group]),
);

export interface GroupMatch {
  home_team?: string | null;
  away_team?: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}

interface Standing {
  code: string;
  pts: number;
  gd: number; // הפרש שערים
  gf: number; // שערי זכות
}

/**
 * מחזיר דירוג מסודר (אינדקס 0 = מקום ראשון) לכל בית שכל משחקיו הסתיימו.
 * שובר שוויון: נקודות → הפרש שערים → שערי זכות → קוד (ליציבות).
 * בתים שלא הושלמו לא מוחזרים (אי אפשר לדעת מיקום סופי).
 */
export function computeGroupStandings(matches: GroupMatch[]): Record<string, string[]> {
  const byGroup: Record<
    string,
    { teams: Set<string>; played: number; table: Record<string, Standing> }
  > = {};
  const ensure = (g: string) =>
    (byGroup[g] ??= { teams: new Set(), played: 0, table: {} });
  const team = (g: string, code: string) => {
    const grp = ensure(g);
    grp.teams.add(code);
    return (grp.table[code] ??= { code, pts: 0, gd: 0, gf: 0 });
  };

  for (const m of matches) {
    if (!m.finished || m.home_score == null || m.away_score == null) continue;
    const h = m.home_team, a = m.away_team;
    if (!h || !a) continue;
    const g = TEAM_GROUP[h];
    if (!g || g !== TEAM_GROUP[a]) continue; // רק משחקים בתוך אותו בית
    const th = team(g, h), ta = team(g, a);
    ensure(g).played++;
    th.gf += m.home_score; ta.gf += m.away_score;
    th.gd += m.home_score - m.away_score; ta.gd += m.away_score - m.home_score;
    if (m.home_score > m.away_score) th.pts += 3;
    else if (m.home_score < m.away_score) ta.pts += 3;
    else { th.pts += 1; ta.pts += 1; }
  }

  const out: Record<string, string[]> = {};
  for (const [g, info] of Object.entries(byGroup)) {
    const n = info.teams.size;
    const expected = (n * (n - 1)) / 2; // ליגת בתים: כל אחד נגד כל אחד
    if (n < 4 || info.played < expected) continue; // הבית לא הושלם
    out[g] = Object.values(info.table)
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.code.localeCompare(y.code))
      .map((s) => s.code);
  }
  return out;
}

/** ניקוד מיקומי בית: מקום מדויק = 5, עלתה אך במקום השני = 2, שלישית שעלתה = 2. */
export const GROUP_EXACT_POINTS = 5;
export const GROUP_QUALIFIED_POINTS = 2;
export const GROUP_THIRD_ADVANCED_POINTS = 2;

export interface GroupPickResult {
  points: number;
  exactHits: number;
  qualifiedHits: number;
  thirdHits: number;
}

/**
 * ניקוד ניחוש בית:
 *   • מקום מדויק בטופ 2 = 5
 *   • הקבוצה עלתה (בטופ 2 בפועל וגם בטופ 2 שלך) אך במקום השני = 2
 *   • מקום 3 מדויק + הקבוצה עלתה כשלישית טובה (best third) = 2
 *   • מקום 4 / שלישית שהודחה = 0
 *   מקסימום 12 לבית (5+5+2).
 */
export function scoreGroupPick(
  predicted: string[] | undefined,
  actual: string[],
  advancedThirds?: Set<string>,
): GroupPickResult {
  let points = 0;
  let exactHits = 0;
  let qualifiedHits = 0;
  let thirdHits = 0;
  if (predicted) {
    const predTop2 = [predicted[0], predicted[1]];
    for (let i = 0; i < 2; i++) {
      const team = actual[i];
      if (!team) continue;
      if (predicted[i] === team) {
        points += GROUP_EXACT_POINTS;
        exactHits++;
      } else if (predTop2.includes(team)) {
        points += GROUP_QUALIFIED_POINTS;
        qualifiedHits++;
      }
    }
    if (actual[2] && predicted[2] === actual[2] && advancedThirds?.has(actual[2])) {
      points += GROUP_THIRD_ADVANCED_POINTS;
      thirdHits++;
    }
  }
  return { points, exactHits, qualifiedHits, thirdHits };
}

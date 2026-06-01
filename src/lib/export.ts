// ============================================================
//  export.ts — ייצוא כל ההימורים של כולם ל-CSV (לאדמין)
//  CSV נפתח ישירות ב-Excel / Google Sheets, ושומר עותק מסודר.
// ============================================================

import { championFrom, runnerUpFrom, stagesFromBracket } from "./bracketState";
import { STAGE_LABELS_HE, type Stage } from "./types";
import { TEAM_BY_CODE } from "../data/teams";
import type { RevealedGeneral, RevealedMatchPick } from "./social";

export interface ExportProfile {
  id: string;
  name: string;
}

function esc(v: unknown): string {
  const s = String(v ?? "");
  // עוטף במרכאות ומכפיל מרכאות פנימיות (תקן CSV)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const teamName = (code: string | null | undefined) =>
  code ? (TEAM_BY_CODE[code]?.nameHe ?? code) : "";

/** CSV של הניחושים הכלליים: שורה לכל משתתף. */
export function generalPicksCSV(
  profiles: ExportProfile[],
  general: RevealedGeneral[],
): string {
  const byUser = new Map(general.map((g) => [g.user_id, g]));
  const header = [
    "שם", "אלוף", "סגנית", "מלך שערים", "סגן מלך שערים", "מלך בישולים",
    "כדור הזהב", "כפפת הזהב", "קבוצה כובשת", "הגנה הכי טובה",
  ];
  const rows = profiles.map((p) => {
    const g = byUser.get(p.id);
    const champ = g?.bracket ? championFrom(g.bracket) : null;
    const runner = g?.bracket ? runnerUpFrom(g.bracket) : null;
    return [
      p.name,
      teamName(champ),
      teamName(runner),
      g?.top_scorer ?? "",
      g?.second_scorer ?? "",
      g?.top_assists ?? "",
      g?.golden_ball ?? "",
      g?.golden_glove ?? "",
      teamName(g?.most_goals_team),
      teamName(g?.best_defense_team),
    ];
  });
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/** CSV של "לאיזה שלב כל נבחרת" — עמודה לכל משתתף. */
export function stagesCSV(
  profiles: ExportProfile[],
  general: RevealedGeneral[],
): string {
  const byUser = new Map(general.map((g) => [g.user_id, g]));
  const stagesByUser = new Map<string, Record<string, Stage>>();
  for (const p of profiles) {
    const g = byUser.get(p.id);
    stagesByUser.set(p.id, g?.bracket ? stagesFromBracket(g.bracket) : {});
  }
  const allTeams = Object.keys(TEAM_BY_CODE);
  const header = ["נבחרת", ...profiles.map((p) => p.name)];
  const rows = allTeams.map((code) => [
    teamName(code),
    ...profiles.map((p) => {
      const st = stagesByUser.get(p.id)?.[code];
      return st ? STAGE_LABELS_HE[st] : "";
    }),
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/** CSV של ניחושי המשחקים: שורה לכל ניחוש. */
export function matchPicksCSV(
  profiles: ExportProfile[],
  matchPicks: RevealedMatchPick[],
  matchLabel: (id: number) => string,
): string {
  const nameById = new Map(profiles.map((p) => [p.id, p.name]));
  const header = ["שם", "משחק", "תוצאה מנוחשת"];
  const rows = matchPicks.map((mp) => [
    nameById.get(mp.user_id) ?? mp.user_id,
    matchLabel(mp.match_id),
    `${mp.pred_home}:${mp.pred_away}`,
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/** מוריד מחרוזת CSV כקובץ (עם BOM כדי שעברית תיפתח נכון ב-Excel). */
export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

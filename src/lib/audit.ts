// ============================================================
//  audit.ts — ניתוח לוג השינויים (match_picks_audit).
//  מוצא שינויים של הרגע האחרון ובודק: אם לא היו מחליפים — האם היו פוגעים?
//  פונקציות טהורות (נבדקות).
// ============================================================

import { directionOf } from "./scoring";

export interface AuditRow {
  id: number;
  user_id: string;
  match_id: number;
  op: string; // INSERT / UPDATE / DELETE
  old_home: number | null;
  old_away: number | null;
  old_dir: string | null;
  new_home: number | null;
  new_away: number | null;
  new_dir: string | null;
  changed_at: string;
}

export interface AuditMatch {
  id: number;
  home_team: string;
  away_team: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}

export type AuditKind =
  | "dropped_winner" // ביטל ניחוש שהיה פוגע
  | "switched_to_winner" // החליף לניחוש שפגע
  | "last_minute" // שינוי סמוך לנעילה
  | "change"; // שינוי רגיל

export interface AuditInsight {
  matchId: number;
  userId: string;
  kind: AuditKind;
  minutesBeforeKickoff: number | null;
  oldText: string; // "2-1"
  newText: string;
  /** טקסט מוכן לתצוגה */
  note: string;
  changedAt: string;
}

const LAST_MINUTE_WINDOW = 60; // דקות לפני שריקת הפתיחה שנחשבות "רגע אחרון"

function hit(
  home: number | null,
  away: number | null,
  actualH: number,
  actualA: number,
): { dir: boolean; exact: boolean } {
  if (home == null || away == null) return { dir: false, exact: false };
  const dir = directionOf(home, away) === directionOf(actualH, actualA);
  const exact = home === actualH && away === actualA;
  return { dir, exact };
}

/**
 * ניתוח כל רשומות הביקורת לכדי תובנות מעניינות.
 * @param rows     שורות מ-match_picks_audit (UPDATE בלבד מעניין)
 * @param matches  מידע על המשחקים (תוצאה + שריקה)
 * @param nameOf   קוד נבחרת/שם משתמש → שם תצוגה
 */
export function analyzeAudit(
  rows: AuditRow[],
  matches: AuditMatch[],
  nameOf: (userId: string) => string,
  teamName: (code: string) => string,
): AuditInsight[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const out: AuditInsight[] = [];

  for (const r of rows) {
    if (r.op !== "UPDATE") continue;
    // שינוי בתוצאה בלבד מעניין
    const changed =
      r.old_home !== r.new_home || r.old_away !== r.new_away;
    if (!changed) continue;

    const m = byId.get(r.match_id);
    const oldText = `${r.old_home ?? "?"}-${r.old_away ?? "?"}`;
    const newText = `${r.new_home ?? "?"}-${r.new_away ?? "?"}`;
    const who = nameOf(r.user_id);

    let minutesBefore: number | null = null;
    if (m) {
      const diffMs = new Date(m.kickoff).getTime() - new Date(r.changed_at).getTime();
      minutesBefore = Math.round(diffMs / 60000);
    }
    const isLastMinute =
      minutesBefore != null && minutesBefore >= 0 && minutesBefore <= LAST_MINUTE_WINDOW;

    let kind: AuditKind = isLastMinute ? "last_minute" : "change";
    let note = `${who} שינה ${oldText} → ${newText}`;
    const matchLabel = m ? `${teamName(m.home_team)}–${teamName(m.away_team)}` : `משחק ${r.match_id}`;

    if (m && m.finished && m.home_score != null && m.away_score != null) {
      const oldHit = hit(r.old_home, r.old_away, m.home_score, m.away_score);
      const newHit = hit(r.new_home, r.new_away, m.home_score, m.away_score);
      // החליף הרחק מניצחון: הישן היה פוגע, החדש לא
      if ((oldHit.exact && !newHit.exact) || (oldHit.dir && !newHit.dir)) {
        kind = "dropped_winner";
        const what = oldHit.exact ? "בינגו מדויק" : "כיוון נכון";
        note = `😱 ${who} ביטל ${what}! היה ${oldText} (פוגע) ושינה ל-${newText}. תוצאה: ${m.home_score}-${m.away_score}`;
      } else if ((newHit.exact && !oldHit.exact) || (newHit.dir && !oldHit.dir)) {
        kind = "switched_to_winner";
        const what = newHit.exact ? "בינגו" : "כיוון נכון";
        note = `🍀 ${who} שינה ברגע האחרון ל-${newText} ופגע (${what})! היה ${oldText}. תוצאה: ${m.home_score}-${m.away_score}`;
      }
    }

    if (kind === "last_minute") {
      note = `⏱️ ${who} שינה ${matchLabel} ${minutesBefore} דק' לפני השריקה: ${oldText} → ${newText}`;
    } else if (kind === "change") {
      note = `${who} · ${matchLabel}: ${oldText} → ${newText}`;
    }

    out.push({
      matchId: r.match_id,
      userId: r.user_id,
      kind,
      minutesBeforeKickoff: minutesBefore,
      oldText,
      newText,
      note,
      changedAt: r.changed_at,
    });
  }

  // מיון לפי עניין: ביטל מנצח → החליף למנצח → רגע אחרון → רגיל
  const order: Record<AuditKind, number> = {
    dropped_winner: 0,
    switched_to_winner: 1,
    last_minute: 2,
    change: 3,
  };
  return out.sort((a, b) => order[a.kind] - order[b.kind]);
}

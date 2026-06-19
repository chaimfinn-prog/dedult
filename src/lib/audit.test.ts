import { describe, expect, it } from "vitest";
import { analyzeAudit, type AuditMatch, type AuditRow } from "./audit";

const match: AuditMatch = {
  id: 1,
  home_team: "ESP",
  away_team: "CPV",
  kickoff: "2026-06-15T16:00:00Z",
  home_score: 2,
  away_score: 0,
  finished: true,
};

const baseRow: AuditRow = {
  id: 1,
  user_id: "u1",
  match_id: 1,
  op: "UPDATE",
  old_home: 2,
  old_away: 1,
  old_dir: "home",
  new_home: 0,
  new_away: 0,
  new_dir: "draw",
  changed_at: "2026-06-15T15:30:00Z",
};

const nameOf = (id: string) => id;
const teamName = (c: string) => c;

describe("ניתוח לוג שינויים", () => {
  it("מזהה ביטול ניחוש מנצח (הישן פגע בכיוון, החדש לא)", () => {
    // ישן 2-1 (בית, פוגע בכיוון מול 2-0) → חדש 0-0 (תיקו, לא פוגע)
    const res = analyzeAudit([baseRow], [match], nameOf, teamName);
    expect(res[0].kind).toBe("dropped_winner");
    expect(res[0].note).toContain("ביטל");
  });

  it("מזהה החלפה לניחוש מנצח", () => {
    const row: AuditRow = {
      ...baseRow,
      old_home: 0,
      old_away: 0,
      old_dir: "draw",
      new_home: 3,
      new_away: 1,
      new_dir: "home",
    };
    const res = analyzeAudit([row], [match], nameOf, teamName);
    expect(res[0].kind).toBe("switched_to_winner");
  });

  it("מתעלם משינוי שאינו בתוצאה ומ-INSERT", () => {
    const noChange: AuditRow = { ...baseRow, new_home: 2, new_away: 1 };
    const insert: AuditRow = { ...baseRow, op: "INSERT" };
    expect(analyzeAudit([noChange, insert], [match], nameOf, teamName)).toHaveLength(0);
  });

  it("מסמן שינוי של הרגע האחרון כשהמשחק לא הסתיים", () => {
    const open: AuditMatch = { ...match, finished: false, home_score: null, away_score: null };
    const res = analyzeAudit([baseRow], [open], nameOf, teamName);
    expect(res[0].kind).toBe("last_minute");
    expect(res[0].minutesBeforeKickoff).toBe(30);
  });
});

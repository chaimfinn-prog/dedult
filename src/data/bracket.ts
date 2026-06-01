// לוח העץ (bracket) הרשמי של מונדיאל 2026 — מבנה הנוקאאוט המדויק.
// מקור: לוח הנוקאאוט הרשמי של פיפ"א (ויקיפדיה – 2026 FIFA World Cup knockout stage).
// כל משחק מוגדר לפי מקורותיו (מנצח בית / סגן בית / שלישי מקבוצת בתים).
// כך אפשר להציג למשתמש את "הדרך לגמר" התיאורטית של כל נבחרת.

export type SlotRef =
  | { type: "winner"; group: string } // מנצח בית X
  | { type: "runner"; group: string } // סגן בית X
  | { type: "third"; groups: string[] } // שלישי מאחת מהקבוצות
  | { type: "match"; match: number }; // מנצח משחק קודם

export interface BracketMatch {
  match: number; // מספר משחק רשמי
  date: string; // תאריך (ISO, שעת ערב משוערת)
  home: SlotRef;
  away: SlotRef;
}

// ===== שמינית-של-32 (Round of 32) =====
export const R32: BracketMatch[] = [
  { match: 73, date: "2026-06-28", home: { type: "runner", group: "A" }, away: { type: "runner", group: "B" } },
  { match: 74, date: "2026-06-29", home: { type: "winner", group: "E" }, away: { type: "third", groups: ["A", "B", "C", "D", "F"] } },
  { match: 75, date: "2026-06-29", home: { type: "winner", group: "F" }, away: { type: "runner", group: "C" } },
  { match: 76, date: "2026-06-29", home: { type: "winner", group: "C" }, away: { type: "runner", group: "F" } },
  { match: 77, date: "2026-06-30", home: { type: "winner", group: "I" }, away: { type: "third", groups: ["C", "D", "F", "G", "H"] } },
  { match: 78, date: "2026-06-30", home: { type: "runner", group: "E" }, away: { type: "runner", group: "I" } },
  { match: 79, date: "2026-06-30", home: { type: "winner", group: "A" }, away: { type: "third", groups: ["C", "E", "F", "H", "I"] } },
  { match: 80, date: "2026-07-01", home: { type: "winner", group: "L" }, away: { type: "third", groups: ["E", "H", "I", "J", "K"] } },
  { match: 81, date: "2026-07-01", home: { type: "winner", group: "D" }, away: { type: "third", groups: ["B", "E", "F", "I", "J"] } },
  { match: 82, date: "2026-07-01", home: { type: "winner", group: "G" }, away: { type: "third", groups: ["A", "E", "H", "I", "J"] } },
  { match: 83, date: "2026-07-02", home: { type: "runner", group: "K" }, away: { type: "runner", group: "L" } },
  { match: 84, date: "2026-07-02", home: { type: "winner", group: "H" }, away: { type: "runner", group: "J" } },
  { match: 85, date: "2026-07-02", home: { type: "winner", group: "B" }, away: { type: "third", groups: ["E", "F", "G", "I", "J"] } },
  { match: 86, date: "2026-07-03", home: { type: "winner", group: "J" }, away: { type: "runner", group: "H" } },
  { match: 87, date: "2026-07-03", home: { type: "winner", group: "K" }, away: { type: "third", groups: ["D", "E", "I", "J", "L"] } },
  { match: 88, date: "2026-07-03", home: { type: "runner", group: "D" }, away: { type: "runner", group: "G" } },
];

// ===== שמינית גמר (Round of 16) =====
export const R16: BracketMatch[] = [
  { match: 89, date: "2026-07-04", home: { type: "match", match: 74 }, away: { type: "match", match: 77 } },
  { match: 90, date: "2026-07-04", home: { type: "match", match: 73 }, away: { type: "match", match: 75 } },
  { match: 91, date: "2026-07-05", home: { type: "match", match: 76 }, away: { type: "match", match: 78 } },
  { match: 92, date: "2026-07-05", home: { type: "match", match: 79 }, away: { type: "match", match: 80 } },
  { match: 93, date: "2026-07-06", home: { type: "match", match: 83 }, away: { type: "match", match: 84 } },
  { match: 94, date: "2026-07-06", home: { type: "match", match: 81 }, away: { type: "match", match: 82 } },
  { match: 95, date: "2026-07-07", home: { type: "match", match: 86 }, away: { type: "match", match: 88 } },
  { match: 96, date: "2026-07-07", home: { type: "match", match: 85 }, away: { type: "match", match: 87 } },
];

// ===== רבע גמר =====
export const QF: BracketMatch[] = [
  { match: 97, date: "2026-07-09", home: { type: "match", match: 89 }, away: { type: "match", match: 90 } },
  { match: 98, date: "2026-07-10", home: { type: "match", match: 93 }, away: { type: "match", match: 94 } },
  { match: 99, date: "2026-07-11", home: { type: "match", match: 91 }, away: { type: "match", match: 92 } },
  { match: 100, date: "2026-07-11", home: { type: "match", match: 95 }, away: { type: "match", match: 96 } },
];

// ===== חצי גמר =====
export const SF: BracketMatch[] = [
  { match: 101, date: "2026-07-14", home: { type: "match", match: 97 }, away: { type: "match", match: 98 } },
  { match: 102, date: "2026-07-15", home: { type: "match", match: 99 }, away: { type: "match", match: 100 } },
];

// ===== הגמר =====
export const FINAL: BracketMatch = {
  match: 104,
  date: "2026-07-19",
  home: { type: "match", match: 101 },
  away: { type: "match", match: 102 },
};

export const BRACKET_ROUNDS = [
  { key: "r32", title: "שמינית-של-32", matches: R32 },
  { key: "r16", title: "שמינית גמר", matches: R16 },
  { key: "qf", title: "רבע גמר", matches: QF },
  { key: "sf", title: "חצי גמר", matches: SF },
  { key: "final", title: "גמר", matches: [FINAL] },
];

// חישוב "הדרך לגמר" התיאורטית של נבחרת, בהנחה שהיא מנצחת בכל שלב.
// נבחרת נכנסת לנוקאאוט כמנצחת בית / סגנית, ומשם המסלול קבוע לפי הלוח.

import {
  BRACKET_ROUNDS,
  type BracketMatch,
  type SlotRef,
} from "../data/bracket";

const ALL_MATCHES: BracketMatch[] = BRACKET_ROUNDS.flatMap((r) => r.matches);
const MATCH_BY_NUM = new Map(ALL_MATCHES.map((m) => [m.match, m]));

/** האם slot מסוים יכול להכיל נבחרת מקבוצת-בית נתונה כמנצחת/סגנית */
function slotMatchesEntry(
  slot: SlotRef,
  group: string,
  position: "winner" | "runner",
): boolean {
  if (slot.type === position && "group" in slot) return slot.group === group;
  return false;
}

export interface PathStep {
  roundTitle: string;
  match: number;
  date: string;
  /** תיאור היריב (טקסט, כי לרוב עוד לא ידוע מי) */
  opponent: string;
}

function describeSlot(slot: SlotRef): string {
  switch (slot.type) {
    case "winner":
      return `מנצחת בית ${slot.group}`;
    case "runner":
      return `סגנית בית ${slot.group}`;
    case "third":
      return `שלישית (מ-${slot.groups.join("/")})`;
    case "match":
      return `מנצחת משחק ${slot.match}`;
  }
}

const ROUND_TITLE_BY_MATCH = new Map<number, string>();
for (const r of BRACKET_ROUNDS)
  for (const m of r.matches) ROUND_TITLE_BY_MATCH.set(m.match, r.title);

/**
 * מחזיר את מסלול הנבחרת מהשמינית-של-32 ועד הגמר,
 * בהנחה שהיא סיימה במקום `position` בבית `group` ומנצחת בכל שלב.
 */
export function pathToFinal(
  group: string,
  position: "winner" | "runner",
): PathStep[] {
  // מצא את משחק ה-R32 שאליו הנבחרת נכנסת
  const start = ALL_MATCHES.find(
    (m) =>
      slotMatchesEntry(m.home, group, position) ||
      slotMatchesEntry(m.away, group, position),
  );
  if (!start) return [];

  const steps: PathStep[] = [];
  let entrySide: "home" | "away" = slotMatchesEntry(start.home, group, position)
    ? "home"
    : "away";

  let cur: BracketMatch | undefined = start;
  while (cur) {
    const opp = entrySide === "home" ? cur.away : cur.home;
    steps.push({
      roundTitle: ROUND_TITLE_BY_MATCH.get(cur.match) ?? "",
      match: cur.match,
      date: cur.date,
      opponent: describeSlot(opp),
    });

    // מצא את המשחק הבא שמקבל את מנצח המשחק הנוכחי
    const curNum: number = cur.match;
    const next: BracketMatch | undefined = ALL_MATCHES.find(
      (m) =>
        (m.home.type === "match" && m.home.match === curNum) ||
        (m.away.type === "match" && m.away.match === curNum),
    );
    if (!next) break;
    entrySide =
      next.home.type === "match" && next.home.match === curNum ? "home" : "away";
    cur = next;
  }

  return steps;
}

export { MATCH_BY_NUM };

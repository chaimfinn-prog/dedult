import type { Team } from "../lib/types";

// 48 הנבחרות של מונדיאל 2026 — לפי הגרלת הבתים הרשמית (5.12.2025)
// והעפלת המעבר (מרץ 2026). הבתים: A–L.
// מקור: הגרלת פיפ"א הרשמית + מעברי הפלייאוף.
export interface TeamWithGroup extends Team {
  group: string; // A..L
}

export const TEAMS: TeamWithGroup[] = [
  // Group A
  { code: "MEX", nameHe: "מקסיקו", flag: "🇲🇽", group: "A" },
  { code: "RSA", nameHe: "דרום אפריקה", flag: "🇿🇦", group: "A" },
  { code: "KOR", nameHe: "דרום קוריאה", flag: "🇰🇷", group: "A" },
  { code: "CZE", nameHe: "צ'כיה", flag: "🇨🇿", group: "A" },
  // Group B
  { code: "CAN", nameHe: "קנדה", flag: "🇨🇦", group: "B" },
  { code: "BIH", nameHe: "בוסניה", flag: "🇧🇦", group: "B" },
  { code: "QAT", nameHe: "קטאר", flag: "🇶🇦", group: "B" },
  { code: "SUI", nameHe: "שווייץ", flag: "🇨🇭", group: "B" },
  // Group C
  { code: "BRA", nameHe: "ברזיל", flag: "🇧🇷", group: "C" },
  { code: "MAR", nameHe: "מרוקו", flag: "🇲🇦", group: "C" },
  { code: "HAI", nameHe: "האיטי", flag: "🇭🇹", group: "C" },
  { code: "SCO", nameHe: "סקוטלנד", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },
  // Group D
  { code: "USA", nameHe: "ארה\"ב", flag: "🇺🇸", group: "D" },
  { code: "PAR", nameHe: "פרגוואי", flag: "🇵🇾", group: "D" },
  { code: "AUS", nameHe: "אוסטרליה", flag: "🇦🇺", group: "D" },
  { code: "TUR", nameHe: "טורקיה", flag: "🇹🇷", group: "D" },
  // Group E
  { code: "GER", nameHe: "גרמניה", flag: "🇩🇪", group: "E" },
  { code: "CUW", nameHe: "קוראסאו", flag: "🇨🇼", group: "E" },
  { code: "CIV", nameHe: "חוף השנהב", flag: "🇨🇮", group: "E" },
  { code: "ECU", nameHe: "אקוודור", flag: "🇪🇨", group: "E" },
  // Group F
  { code: "NED", nameHe: "הולנד", flag: "🇳🇱", group: "F" },
  { code: "JPN", nameHe: "יפן", flag: "🇯🇵", group: "F" },
  { code: "SWE", nameHe: "שוודיה", flag: "🇸🇪", group: "F" },
  { code: "TUN", nameHe: "תוניסיה", flag: "🇹🇳", group: "F" },
  // Group G
  { code: "BEL", nameHe: "בלגיה", flag: "🇧🇪", group: "G" },
  { code: "EGY", nameHe: "מצרים", flag: "🇪🇬", group: "G" },
  { code: "IRN", nameHe: "איראן", flag: "🇮🇷", group: "G" },
  { code: "NZL", nameHe: "ניו זילנד", flag: "🇳🇿", group: "G" },
  // Group H
  { code: "ESP", nameHe: "ספרד", flag: "🇪🇸", group: "H" },
  { code: "CPV", nameHe: "כף ורדה", flag: "🇨🇻", group: "H" },
  { code: "KSA", nameHe: "ערב הסעודית", flag: "🇸🇦", group: "H" },
  { code: "URU", nameHe: "אורוגוואי", flag: "🇺🇾", group: "H" },
  // Group I
  { code: "FRA", nameHe: "צרפת", flag: "🇫🇷", group: "I" },
  { code: "SEN", nameHe: "סנגל", flag: "🇸🇳", group: "I" },
  { code: "IRQ", nameHe: "עיראק", flag: "🇮🇶", group: "I" },
  { code: "NOR", nameHe: "נורבגיה", flag: "🇳🇴", group: "I" },
  // Group J
  { code: "ARG", nameHe: "ארגנטינה", flag: "🇦🇷", group: "J" },
  { code: "ALG", nameHe: "אלג'יריה", flag: "🇩🇿", group: "J" },
  { code: "AUT", nameHe: "אוסטריה", flag: "🇦🇹", group: "J" },
  { code: "JOR", nameHe: "ירדן", flag: "🇯🇴", group: "J" },
  // Group K
  { code: "POR", nameHe: "פורטוגל", flag: "🇵🇹", group: "K" },
  { code: "COD", nameHe: "קונגו DR", flag: "🇨🇩", group: "K" },
  { code: "UZB", nameHe: "אוזבקיסטן", flag: "🇺🇿", group: "K" },
  { code: "COL", nameHe: "קולומביה", flag: "🇨🇴", group: "K" },
  // Group L
  { code: "ENG", nameHe: "אנגליה", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  { code: "CRO", nameHe: "קרואטיה", flag: "🇭🇷", group: "L" },
  { code: "GHA", nameHe: "גאנה", flag: "🇬🇭", group: "L" },
  { code: "PAN", nameHe: "פנמה", flag: "🇵🇦", group: "L" },
];

export const TEAM_BY_CODE: Record<string, TeamWithGroup> = Object.fromEntries(
  TEAMS.map((t) => [t.code, t]),
);

/** קבוצות הבית מסודרות A..L */
export const GROUPS: Record<string, TeamWithGroup[]> = TEAMS.reduce(
  (acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  },
  {} as Record<string, TeamWithGroup[]>,
);

export const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

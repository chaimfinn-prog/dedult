// יחסים אמיתיים/מבוססי-סקר לשווקים הכלליים הנוספים (יוני 2026).
// מקור: לוחות הימורים מובילים (FOX/Squawka/bet365) לכפפת/כדור הזהב;
// קבוצה כובשת/הגנה — נגזר מלוח האלוף ומדירוגי ההתקפה/הגנה.
// כולם נבחרות/שחקנים שהעפילו. ניתן לעדכן במסך הניהול.

import type { PlayerSeed } from "./seedPlayers";

/** כפפת הזהב — השוער הטוב ביותר (יחס אמריקאי אמיתי) */
export const GOLDEN_GLOVE_SEED: PlayerSeed[] = [
  { name: "אמיליאנו מרטינס", team: "ARG", odds: 450 },
  { name: "אונאי סימון", team: "ESP", odds: 450 },
  { name: "אליסון", team: "BRA", odds: 500 },
  { name: "מייק מניאן", team: "FRA", odds: 600 },
  { name: "ג'ורדן פיקפורד", team: "ENG", odds: 700 },
  { name: "אדרסון", team: "BRA", odds: 700 },
  { name: "דייווידראיה", team: "ESP", odds: 700 },
  { name: "דיוגו קוסטה", team: "POR", odds: 1000 },
  { name: "אוליבר באומן", team: "GER", odds: 1200 },
  { name: "טיבו קורטואה", team: "BEL", odds: 2000 },
  { name: "ירן בלובי", team: "NED", odds: 2500 },
  { name: "ז'ילמה גוייה", team: "MAR", odds: 3000 },
];

/** כדור הזהב — שחקן המצטיין של הטורניר (קרוב ללוח כדור הזהב) */
export const GOLDEN_BALL_SEED: PlayerSeed[] = [
  { name: "קיליאן אמבפה", team: "FRA", odds: 600 },
  { name: "למין ימאל", team: "ESP", odds: 750 },
  { name: "ויניסיוס ג'וניור", team: "BRA", odds: 1000 },
  { name: "ג'וד בלינגהאם", team: "ENG", odds: 1200 },
  { name: "הארי קיין", team: "ENG", odds: 1400 },
  { name: "ליאו מסי", team: "ARG", odds: 1400 },
  { name: "ארלינג הולאנד", team: "NOR", odds: 1600 },
  { name: "פדרי", team: "ESP", odds: 2000 },
  { name: "ראפיניה", team: "BRA", odds: 2200 },
  { name: "פלוריאן וירץ", team: "GER", odds: 2500 },
  { name: "קווין דה ברוינה", team: "BEL", odds: 3000 },
  { name: "ברונו פרננדש", team: "POR", odds: 3300 },
  { name: "אוסמן דמבלה", team: "FRA", odds: 3500 },
  { name: "לאוטרו מרטינס", team: "ARG", odds: 4000 },
];

/** הקבוצה שכובשת הכי הרבה שערים בטורניר (יחס אמריקאי, נגזר מהפייבוריטיות ההתקפית) */
export const MOST_GOALS_TEAM_AMERICAN: Record<string, number> = {
  ESP: 450, FRA: 500, ENG: 650, BRA: 600, ARG: 800, POR: 900,
  GER: 1000, NED: 1400, NOR: 1200, BEL: 2000, COL: 3000, URU: 3500,
  MAR: 4000, USA: 4000, JPN: 5000, MEX: 5000, CRO: 6000, ECU: 8000,
  SUI: 8000, SEN: 9000, TUR: 9000, SWE: 6000, AUT: 12000, KOR: 15000,
};

/** הקבוצה עם ההגנה הטובה ביותר (סופגת הכי מעט) */
export const BEST_DEFENSE_TEAM_AMERICAN: Record<string, number> = {
  FRA: 450, ESP: 500, BRA: 600, ENG: 650, ARG: 700, POR: 1100,
  GER: 1200, NED: 1400, CRO: 2000, URU: 2200, MAR: 2500, BEL: 2800,
  SUI: 3000, COL: 3500, USA: 4000, JPN: 4500, NOR: 5000, MEX: 6000,
  ECU: 6000, SEN: 8000, AUT: 10000, KOR: 12000,
};

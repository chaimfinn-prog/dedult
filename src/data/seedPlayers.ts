// נתוני זריעה לשווקים שה-API החינמי לא מכסה: מלך שערים, סגן, מלך בישולים.
// שמות שחקנים אמיתיים + יחס אמריקאי משוער (נכון לעונת 2025/26, אתר הימורים מוכר).
// ⚠️ חשוב: היחסים משתנים כל הזמן — מומלץ לאמת/לעדכן במסך הניהול לפני הטורניר.
// הזריעה כאן רק כדי שהאפליקציה תיראה מלאה גם לפני שמזינים נתונים סופיים.

import { TEAM_BY_CODE } from "./teams";

export interface PlayerSeed {
  name: string; // שם השחקן
  team: string; // קוד נבחרת
  odds: number; // יחס אמריקאי
}

/** מלך השערים (נעל הזהב) — מועמדים מובילים */
export const TOP_SCORER_SEED: PlayerSeed[] = [
  { name: "קיליאן אמבפה", team: "FRA", odds: 450 },
  { name: "ארלינג הולאנד", team: "NOR", odds: 550 },
  { name: "הארי קיין", team: "ENG", odds: 650 },
  { name: "לאוטרו מרטינס", team: "ARG", odds: 1200 },
  { name: "ויניסיוס ג'וניור", team: "BRA", odds: 1400 },
  { name: "ז'וליאן אלברס", team: "ARG", odds: 1600 },
  { name: "למין ימאל", team: "ESP", odds: 1800 },
  { name: "ראפיניה", team: "BRA", odds: 2000 },
  { name: "ג'וד בלינגהאם", team: "ENG", odds: 2500 },
  { name: "מוחמד סלאח", team: "EGY", odds: 2800 },
  { name: "ויקטור אוסימן", team: "NGA", odds: 3000 },
  { name: "אלברו מוראטה", team: "ESP", odds: 3300 },
  { name: "פלוריאן וירץ", team: "GER", odds: 4000 },
  { name: "קודי חאקפו", team: "NED", odds: 4500 },
];

/** מלך הבישולים (אסיסטים) — מועמדים מובילים */
export const TOP_ASSISTS_SEED: PlayerSeed[] = [
  { name: "ליאו מסי", team: "ARG", odds: 700 },
  { name: "קווין דה ברוינה", team: "BEL", odds: 800 },
  { name: "קיליאן אמבפה", team: "FRA", odds: 900 },
  { name: "ג'וד בלינגהאם", team: "ENG", odds: 1000 },
  { name: "ברונו פרננדש", team: "POR", odds: 1100 },
  { name: "למין ימאל", team: "ESP", odds: 1100 },
  { name: "ויניסיוס ג'וניור", team: "BRA", odds: 1300 },
  { name: "פדרי", team: "ESP", odds: 1500 },
  { name: "פלוריאן וירץ", team: "GER", odds: 1600 },
  { name: "ג'מאל מוסיאלה", team: "GER", odds: 1800 },
  { name: "ראפיניה", team: "BRA", odds: 1900 },
  { name: "טריינט אלכסנדר-ארנולד", team: "ENG", odds: 2500 },
];

export function playerLabel(p: PlayerSeed): string {
  const flag = TEAM_BY_CODE[p.team]?.flag ?? "";
  return `${flag} ${p.name}`;
}

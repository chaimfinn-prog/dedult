// יחסי מלך השערים (נעל הזהב) — נתונים אמיתיים נכון ליוני 2026.
// מקור: לוח יחסי Golden Boot של אתר הימורים מוביל (RotoWire / FanDuel).
// כל השחקנים ברשימה שייכים לנבחרות שהעפילו למונדיאל 2026 (סגלים סגורים).
// סגן מלך השערים משתמש באותו שוק. מלך הבישולים — רשימה נפרדת למטה.
// היחסים נמשכים גם אוטומטית מ-The Odds API כשהשוק זמין; זו ברירת המחדל.

export interface PlayerSeed {
  name: string; // שם השחקן בעברית
  team: string; // קוד נבחרת (TEAM_BY_CODE)
  odds: number; // יחס אמריקאי
}

/** מלך השערים (נעל הזהב) — לוח יחסים אמיתי, ממוין מהפייבוריט לאאוטסיידר */
export const TOP_SCORER_SEED: PlayerSeed[] = [
  { name: "קיליאן אמבפה", team: "FRA", odds: 600 },
  { name: "הארי קיין", team: "ENG", odds: 700 },
  { name: "ליאו מסי", team: "ARG", odds: 1200 },
  { name: "ארלינג הולאנד", team: "NOR", odds: 1400 },
  { name: "למין ימאל", team: "ESP", odds: 1800 },
  { name: "מיקל אויארסבאל", team: "ESP", odds: 1800 },
  { name: "כריסטיאנו רונאלדו", team: "POR", odds: 2000 },
  { name: "ויניסיוס ג'וניור", team: "BRA", odds: 2200 },
  { name: "לאוטרו מרטינס", team: "ARG", odds: 2500 },
  { name: "אוסמן דמבלה", team: "FRA", odds: 2800 },
  { name: "רומלו לוקאקו", team: "BEL", odds: 3000 },
  { name: "ראפיניה", team: "BRA", odds: 3000 },
  { name: "ניק וולטמאדה", team: "GER", odds: 3500 },
  { name: "ז'וליאן אלברס", team: "ARG", odds: 3500 },
  { name: "אלברו מוראטה", team: "ESP", odds: 3500 },
  { name: "ריצ'רליסון", team: "BRA", odds: 3500 },
  { name: "ז'ואאו פדרו", team: "BRA", odds: 3500 },
  { name: "קודי חאקפו", team: "NED", odds: 4000 },
  { name: "בוקאיו סאקה", team: "ENG", odds: 4000 },
  { name: "ממפיס דפאי", team: "NED", odds: 4000 },
  { name: "פראן טורס", team: "ESP", odds: 4000 },
  { name: "מיקל מרינו", team: "ESP", odds: 4000 },
  { name: "ז'וד בלינגהאם", team: "ENG", odds: 5000 },
  { name: "גונסאלו ראמוש", team: "POR", odds: 5000 },
  { name: "פלוריאן וירץ", team: "GER", odds: 5000 },
  { name: "מרקוס תוראם", team: "FRA", odds: 5000 },
  { name: "ניימאר", team: "BRA", odds: 5000 },
  { name: "ברונו פרננדש", team: "POR", odds: 5000 },
  { name: "לואיס דיאס", team: "COL", odds: 5000 },
  { name: "מוחמד סלאח", team: "EGY", odds: 5000 },
  { name: "קאי הברץ", team: "GER", odds: 5000 },
  { name: "דאני אולמו", team: "ESP", odds: 5000 },
  { name: "ויקטור גיוקרש", team: "SWE", odds: 5000 },
  { name: "אנר ולנסיה", team: "ECU", odds: 6500 },
  { name: "סנטיאגו חימנס", team: "MEX", odds: 6500 },
  { name: "דארווין נונייס", team: "URU", odds: 6500 },
  { name: "ג'מאל מוסיאלה", team: "GER", odds: 6500 },
  { name: "מרקוס רשפורד", team: "ENG", odds: 6500 },
  { name: "מתאוס קוניה", team: "BRA", odds: 6500 },
  { name: "אלכסנדר סורלות", team: "NOR", odds: 6500 },
  { name: "אלכסנדר איסק", team: "SWE", odds: 6500 },
  { name: "קווין דה ברוינה", team: "BEL", odds: 8000 },
  { name: "כריסטיאן פוליסיץ'", team: "USA", odds: 8000 },
  { name: "רפאל לאאו", team: "POR", odds: 8000 },
  { name: "סדיו מאנה", team: "SEN", odds: 8000 },
  { name: "לרוי סאנה", team: "GER", odds: 8000 },
  { name: "ראול חימנס", team: "MEX", odds: 8000 },
  { name: "אנטה בודימיר", team: "CRO", odds: 8000 },
  { name: "ג'ונתן דייוויד", team: "CAN", odds: 10000 },
  { name: "מוחמד קודוס", team: "GHA", odds: 10000 },
  { name: "ארדה גולר", team: "TUR", odds: 10000 },
  { name: "פדרו נטו", team: "POR", odds: 10000 },
  { name: "ניקו ויליאמס", team: "ESP", odds: 10000 },
  { name: "סקוט מקטומיניי", team: "SCO", odds: 10000 },
  { name: "ראיאן שרקי", team: "FRA", odds: 10000 },
  { name: "ברל אמבולו", team: "SUI", odds: 12000 },
  { name: "איסמעילה סאר", team: "SEN", odds: 15000 },
  { name: "לי קאנג-אין", team: "KOR", odds: 15000 },
  { name: "אנצו פרננדס", team: "ARG", odds: 15000 },
  { name: "רייאן מהרז", team: "ALG", odds: 15000 },
  { name: "ג'יימס רודריגס", team: "COL", odds: 15000 },
  { name: "כריס وود", team: "NZL", odds: 20000 },
  { name: "מרטין אדגור", team: "NOR", odds: 20000 },
  { name: "דאיזן מאאדה", team: "JPN", odds: 20000 },
  { name: "אכרף חכימי", team: "MAR", odds: 25000 },
  { name: "סדריק בקמבו", team: "COD", odds: 25000 },
  { name: "מרסל סביצר", team: "AUT", odds: 25000 },
];

/**
 * מלך הבישולים (אסיסטים) — אין שוק ייעודי נרחב באתרי ההימורים החינמיים,
 * ולכן זו רשימת ברירת מחדל של מבשלים מובילים מהנבחרות שהעפילו, עם הערכת יחס.
 * מומלץ לעדכן במסך הניהול ברגע שיתפרסם שוק רשמי.
 */
export const TOP_ASSISTS_SEED: PlayerSeed[] = [
  { name: "ליאו מסי", team: "ARG", odds: 700 },
  { name: "קווין דה ברוינה", team: "BEL", odds: 800 },
  { name: "קיליאן אמבפה", team: "FRA", odds: 900 },
  { name: "ברונו פרננדש", team: "POR", odds: 1000 },
  { name: "למין ימאל", team: "ESP", odds: 1000 },
  { name: "ז'וד בלינגהאם", team: "ENG", odds: 1100 },
  { name: "ויניסיוס ג'וניור", team: "BRA", odds: 1300 },
  { name: "פדרי", team: "ESP", odds: 1500 },
  { name: "פלוריאן וירץ", team: "GER", odds: 1600 },
  { name: "ג'מאל מוסיאלה", team: "GER", odds: 1800 },
  { name: "ראפיניה", team: "BRA", odds: 1900 },
  { name: "מרטין אדגור", team: "NOR", odds: 2500 },
  { name: "בוקאיו סאקה", team: "ENG", odds: 2800 },
  { name: "אכרף חכימי", team: "MAR", odds: 3000 },
  { name: "אנטואן גריזמן", team: "FRA", odds: 3500 },
  { name: "דאני אולמו", team: "ESP", odds: 4000 },
  { name: "כריסטיאן פוליסיץ'", team: "USA", odds: 4500 },
  { name: "ממפיס דפאי", team: "NED", odds: 5000 },
  { name: "ג'יימס רודריגס", team: "COL", odds: 5500 },
  { name: "לוקא מודריץ'", team: "CRO", odds: 6500 },
  { name: "ראיאן שרקי", team: "FRA", odds: 7000 },
  { name: "ניקו ויליאמס", team: "ESP", odds: 7500 },
];

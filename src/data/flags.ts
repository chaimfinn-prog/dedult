// מיפוי קוד נבחרת (FIFA) → קוד ISO-2 עבור דגלים אמיתיים מ-flagcdn.com (חינמי).
// אנגליה/סקוטלנד משתמשים בקודי תת-מדינה הנתמכים ב-flagcdn (gb-eng / gb-sct).
export const FIFA_TO_ISO: Record<string, string> = {
  // Pot 1 / מובילות
  ESP: "es", FRA: "fr", ENG: "gb-eng", BRA: "br", ARG: "ar", POR: "pt",
  GER: "de", NED: "nl", BEL: "be", URU: "uy", CRO: "hr", COL: "co",
  // מארחות
  USA: "us", MEX: "mx", CAN: "ca",
  // שאר הבתים
  RSA: "za", KOR: "kr", CZE: "cz", BIH: "ba", QAT: "qa", SUI: "ch",
  MAR: "ma", HAI: "ht", SCO: "gb-sct", PAR: "py", AUS: "au", TUR: "tr",
  CUW: "cw", CIV: "ci", ECU: "ec", JPN: "jp", SWE: "se", TUN: "tn",
  EGY: "eg", IRN: "ir", NZL: "nz", CPV: "cv", KSA: "sa", SEN: "sn",
  IRQ: "iq", NOR: "no", ALG: "dz", AUT: "at", JOR: "jo", COD: "cd",
  UZB: "uz", GHA: "gh", PAN: "pa",
};

/** כתובת תמונת דגל ברוחב נתון (40/80/160…) */
export function flagUrl(code: string, width: 40 | 80 | 160 = 80): string | null {
  const iso = FIFA_TO_ISO[code];
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null;
}

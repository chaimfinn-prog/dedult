// מיפוי קוד נבחרת (FIFA) → קוד ISO-2 עבור דגלים אמיתיים מ-flagcdn.com (חינמי).
// אנגליה/וויילס משתמשים בקודי תת-מדינה הנתמכים ב-flagcdn (gb-eng / gb-wls).
export const FIFA_TO_ISO: Record<string, string> = {
  ARG: "ar", FRA: "fr", ESP: "es", ENG: "gb-eng", BRA: "br", POR: "pt",
  GER: "de", NED: "nl", BEL: "be", ITA: "it", URU: "uy", CRO: "hr",
  USA: "us", MEX: "mx", CAN: "ca", COL: "co", MAR: "ma", JPN: "jp",
  SEN: "sn", SUI: "ch", DEN: "dk", KOR: "kr", SRB: "rs", AUT: "at",
  ECU: "ec", AUS: "au", POL: "pl", WAL: "gb-wls", UKR: "ua", TUR: "tr",
  NOR: "no", EGY: "eg", NGA: "ng", CIV: "ci", GHA: "gh", ALG: "dz",
  TUN: "tn", RSA: "za", CRC: "cr", PAN: "pa", PAR: "py", PER: "pe",
  QAT: "qa", KSA: "sa", IRN: "ir", JOR: "jo", UZB: "uz", NZL: "nz",
};

/** כתובת תמונת דגל ברוחב נתון (40/80/160…) */
export function flagUrl(code: string, width: 40 | 80 | 160 = 80): string | null {
  const iso = FIFA_TO_ISO[code];
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null;
}

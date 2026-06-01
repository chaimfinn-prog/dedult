// מיפוי שם נבחרת באנגלית (כפי שמגיע מ-The Odds API) → קוד הנבחרת באפליקציה.
// מותאם ל-48 הנבחרות של מונדיאל 2026. אם נבחרת לא מזוהה — נשמר השם המקורי.
export const NAME_TO_CODE: Record<string, string> = {
  argentina: "ARG", france: "FRA", spain: "ESP", england: "ENG",
  brazil: "BRA", portugal: "POR", germany: "GER", netherlands: "NED",
  belgium: "BEL", uruguay: "URU", croatia: "CRO", colombia: "COL",
  usa: "USA", "united states": "USA", mexico: "MEX", canada: "CAN",
  morocco: "MAR", japan: "JPN", senegal: "SEN", switzerland: "SUI",
  "south korea": "KOR", "korea republic": "KOR", austria: "AUT",
  ecuador: "ECU", australia: "AUS", norway: "NOR", egypt: "EGY",
  "ivory coast": "CIV", "côte d'ivoire": "CIV", "cote d'ivoire": "CIV",
  ghana: "GHA", algeria: "ALG", tunisia: "TUN", "south africa": "RSA",
  panama: "PAN", paraguay: "PAR", qatar: "QAT", "saudi arabia": "KSA",
  iran: "IRN", "ir iran": "IRN", jordan: "JOR", uzbekistan: "UZB",
  "new zealand": "NZL",
  // נבחרות שהעפילו דרך הפלייאוף / חדשות בלוח
  czechia: "CZE", "czech republic": "CZE", "bosnia and herzegovina": "BIH",
  bosnia: "BIH", sweden: "SWE", scotland: "SCO", haiti: "HAI",
  "cape verde": "CPV", "cabo verde": "CPV", "curacao": "CUW",
  "curaçao": "CUW", iraq: "IRQ", "dr congo": "COD",
  "democratic republic of the congo": "COD", "congo dr": "COD",
  turkey: "TUR", "türkiye": "TUR", "turkiye": "TUR",
};

export function codeFor(name: string): string {
  return NAME_TO_CODE[name.trim().toLowerCase()] ?? name;
}

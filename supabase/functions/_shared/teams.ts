// מיפוי שם נבחרת באנגלית (כפי שמגיע מ-The Odds API) → קוד הנבחרת באפליקציה.
// כולל כינויים נפוצים. אם נבחרת לא מזוהה — נשמר השם המקורי כפי שהוא.
export const NAME_TO_CODE: Record<string, string> = {
  argentina: "ARG", france: "FRA", spain: "ESP", england: "ENG",
  brazil: "BRA", portugal: "POR", germany: "GER", netherlands: "NED",
  belgium: "BEL", italy: "ITA", uruguay: "URU", croatia: "CRO",
  usa: "USA", "united states": "USA", mexico: "MEX", canada: "CAN",
  colombia: "COL", morocco: "MAR", japan: "JPN", senegal: "SEN",
  switzerland: "SUI", denmark: "DEN", "south korea": "KOR",
  "korea republic": "KOR", serbia: "SRB", austria: "AUT", ecuador: "ECU",
  australia: "AUS", poland: "POL", wales: "WAL", ukraine: "UKR",
  turkey: "TUR", "türkiye": "TUR", "turkiye": "TUR", norway: "NOR",
  egypt: "EGY", nigeria: "NGA", "ivory coast": "CIV", "côte d'ivoire": "CIV",
  "cote d'ivoire": "CIV", ghana: "GHA", algeria: "ALG", tunisia: "TUN",
  "south africa": "RSA", "costa rica": "CRC", panama: "PAN",
  paraguay: "PAR", peru: "PER", qatar: "QAT", "saudi arabia": "KSA",
  iran: "IRN", "ir iran": "IRN", jordan: "JOR", uzbekistan: "UZB",
  "new zealand": "NZL",
};

export function codeFor(name: string): string {
  return NAME_TO_CODE[name.trim().toLowerCase()] ?? name;
}

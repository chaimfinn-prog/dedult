// ============================================================
//  social.ts — שליפת ניחושי החברים (חשופים רק אחרי הנעילה, דרך RPC)
// ============================================================
import { isSupabaseConfigured, supabase } from "./supabase";

export interface RevealedGeneral {
  user_id: string;
  top_scorer: string | null;
  second_scorer: string | null;
  top_assists: string | null;
  golden_glove: string | null;
  golden_ball: string | null;
  most_goals_team: string | null;
  best_defense_team: string | null;
  bracket: any | null;
}
export interface RevealedMatchPick {
  user_id: string;
  match_id: number;
  direction: "home" | "draw" | "away";
  pred_home: number;
  pred_away: number;
}

/** ניחושים כלליים חשופים (משלך תמיד; של אחרים רק אחרי שריקת הפתיחה) */
export async function fetchRevealedGeneral(): Promise<RevealedGeneral[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("reveal_general_picks");
  if (error) return [];
  return (data ?? []) as RevealedGeneral[];
}

/** ניחושי משחק חשופים — בשליפה מחולקת לעמודים כדי לעקוף את תקרת ה-1000
 *  של Supabase (אחרת ניחושים מעבר ל-1000 נחתכים ולא נספרים בדירוג). */
export async function fetchRevealedMatchPicks(): Promise<RevealedMatchPick[]> {
  if (!isSupabaseConfigured) return [];
  const pageSize = 1000;
  const all: RevealedMatchPick[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .rpc("reveal_match_picks")
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as RevealedMatchPick[]));
    if (data.length < pageSize) break;
  }
  return all;
}

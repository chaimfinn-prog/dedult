// ============================================================
//  Supabase Edge Function: fetch-odds
//  מושכת יחסים מ-The Odds API, מנרמלת ל-100%, ושומרת בטבלת odds.
//  המפתח נשמר ב-Secrets של Supabase (ODDS_API_KEY) ולעולם לא בקוד הלקוח.
//
//  פריסה:  supabase functions deploy fetch-odds
//  סוד:    supabase secrets set ODDS_API_KEY=xxxxx
//  קריאה:  POST /functions/v1/fetch-odds   (כפתור "רענן יחסים" במסך הניהול)
// ============================================================

// @ts-nocheck — רץ ב-Deno בצד Supabase, לא ב-build של הלקוח.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { codeFor } from "../_shared/teams.ts";

const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// מפתח השוק של המונדיאל ב-The Odds API. ודא/עדכן בעת הצורך.
const SPORT_KEY = "soccer_fifa_world_cup";
const BASE = "https://api.the-odds-api.com/v4";

/** המרת יחס עשרוני להסתברות */
const probFromDecimal = (d: number) => 1 / d;

/** נרמול מערך הסתברויות כך שיסתכם ל-1 (הסרת מרווח הבית) */
function normalize(probs: number[]): number[] {
  const sum = probs.reduce((a, b) => a + b, 0);
  return probs.map((p) => p / sum);
}

Deno.serve(async (req) => {
  // CORS לבקשות מהדפדפן
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const db = createClient(SUPABASE_URL, SERVICE_ROLE);
  const rows: {
    market: string;
    option_id: string;
    label: string;
    prob: number;
    source: string;
  }[] = [];

  try {
    // ---- שוק אלוף הטורניר (outrights) ----
    const outRes = await fetch(
      `${BASE}/sports/${SPORT_KEY}/odds?regions=eu&markets=outrights&oddsFormat=decimal&apiKey=${ODDS_API_KEY}`,
    );
    if (outRes.ok) {
      const data = await outRes.json();
      const outcomes = data?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes ?? [];
      if (outcomes.length) {
        const probs = normalize(
          outcomes.map((o: any) => probFromDecimal(o.price)),
        );
        outcomes.forEach((o: any, i: number) => {
          rows.push({
            market: "champion",
            option_id: o.name,
            label: o.name,
            prob: probs[i],
            source: "api",
          });
        });
      }
    }

    // ---- שוקי 1X2 לכל משחק (h2h) + יצירת/עדכון המשחקים אוטומטית ----
    const matchRows: Record<string, unknown>[] = [];
    const h2hRes = await fetch(
      `${BASE}/sports/${SPORT_KEY}/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${ODDS_API_KEY}`,
    );
    if (h2hRes.ok) {
      const games = await h2hRes.json();
      for (const game of games) {
        // יצירת/עדכון שורת המשחק (לפי ext_id) — מאוכלס אוטומטית מה-API
        matchRows.push({
          ext_id: game.id,
          home_team: codeFor(game.home_team),
          away_team: codeFor(game.away_team),
          kickoff: game.commence_time,
        });

        const m = game?.bookmakers?.[0]?.markets?.[0];
        if (!m?.outcomes?.length) continue;
        const probs = normalize(
          m.outcomes.map((o: any) => probFromDecimal(o.price)),
        );
        m.outcomes.forEach((o: any, i: number) => {
          // מיפוי שם הקבוצה לכיוון home/away, ותיקו → draw
          let dir = "draw";
          if (o.name === game.home_team) dir = "home";
          else if (o.name === game.away_team) dir = "away";
          rows.push({
            market: `match:${game.id}`, // ext_id של המשחק
            option_id: dir,
            label: o.name,
            prob: probs[i],
            source: "api",
          });
        });
      }
    }

    // upsert של המשחקים (לא דורס תוצאות קיימות — רק פרטי המשחק)
    if (matchRows.length) {
      await db.from("matches").upsert(matchRows, { onConflict: "ext_id" });
    }

    if (rows.length) {
      const { error } = await db
        .from("odds")
        .upsert(
          rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
          { onConflict: "market,option_id" },
        );
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, upserted: rows.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});

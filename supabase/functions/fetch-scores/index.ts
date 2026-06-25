// ============================================================
//  Supabase Edge Function: fetch-scores
//  מושכת תוצאות חיות + משחקים שהסתיימו מ-The Odds API (endpoint /scores)
//  ומעדכנת אוטומטית את טבלת matches (תוצאה + סטטוס לייב/הסתיים).
//  ברגע שמשחק מעודכן — חישוב הניקוד באפליקציה מתעדכן מאליו.
//
//  פריסה:  supabase functions deploy fetch-scores
//  קריאה:  POST /functions/v1/fetch-scores
//  מומלץ להריץ אוטומטית כל ~10 דקות (ראו supabase/cron.sql).
// ============================================================

// @ts-nocheck — רץ ב-Deno בצד Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SPORT_KEY = "soccer_fifa_world_cup";
const BASE = "https://api.the-odds-api.com/v4";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const db = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // daysFrom=3 → כולל משחקים מהימים האחרונים + משחקים חיים כעת
    const res = await fetch(
      `${BASE}/sports/${SPORT_KEY}/scores/?daysFrom=3&apiKey=${ODDS_API_KEY}`,
    );
    if (!res.ok) throw new Error(`scores API ${res.status}`);
    // מכסת הקריאות שנותרה/נוצלה — The Odds API מחזיר בכותרות התשובה
    const remaining = res.headers.get("x-requests-remaining");
    const used = res.headers.get("x-requests-used");
    const games = await res.json();

    let updated = 0;
    for (const g of games) {
      if (!g.scores) continue; // המשחק עוד לא התחיל — אין תוצאה

      const byName: Record<string, number> = {};
      for (const s of g.scores) byName[s.name] = Number(s.score);
      const home = byName[g.home_team];
      const away = byName[g.away_team];
      if (home == null || away == null || Number.isNaN(home) || Number.isNaN(away))
        continue;

      const { error } = await db
        .from("matches")
        .update({
          home_score: home,
          away_score: away,
          finished: !!g.completed,
          live: !g.completed,
        })
        .eq("ext_id", g.id);
      if (!error) updated++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated,
        remaining: remaining ? Number(remaining) : null,
        used: used ? Number(used) : null,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

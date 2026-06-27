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

/** זיהוי שלב הטורניר לפי תאריך הבעיטה — לוח מונדיאל 2026 */
function stageForDate(kickoff: string): string {
  const day = kickoff.slice(0, 10);
  if (day <= "2026-06-26") return "groups";
  if (day <= "2026-07-03") return "r32";
  if (day <= "2026-07-07") return "r16";
  if (day <= "2026-07-11") return "qf";
  if (day <= "2026-07-15") return "sf";
  return "final";
}

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
    decimal?: number;
    source: string;
  }[] = [];

  // אחרי שריקת הפתיחה של הטורניר — יחסי האלוף ננעלו ממילא, אין טעם
  // למשוך אותם שוב (חוסך קריאת API). מושכים רק יחסי משחקים ותוצאות.
  const TOURNAMENT_KICKOFF = Date.parse("2026-06-11T19:00:00Z");
  const tournamentStarted = Date.now() >= TOURNAMENT_KICKOFF;

  try {
    // ---- שוק אלוף הטורניר (outrights) — רק לפני תחילת הטורניר ----
    const outRes = tournamentStarted
      ? null
      : await fetch(
          `${BASE}/sports/${SPORT_KEY}/odds?regions=eu&markets=outrights&oddsFormat=decimal&apiKey=${ODDS_API_KEY}`,
        );
    if (outRes && outRes.ok) {
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
          stage: stageForDate(game.commence_time),
        });

        const m = game?.bookmakers?.[0]?.markets?.[0];
        if (!m?.outcomes?.length) continue;
        const probs = normalize(
          m.outcomes.map((o: any) => probFromDecimal(o.price)),
        );

        // מיפוי חסין: התאמת שם מדויקת (case-insensitive) לבית/חוץ, והשאר = תיקו.
        const norm = (s: string) => (s ?? "").trim().toLowerCase();
        const homeN = norm(game.home_team);
        const awayN = norm(game.away_team);
        const mapped = m.outcomes.map((o: any, i: number) => {
          const n = norm(o.name);
          let dir = "draw";
          if (n === homeN) dir = "home";
          else if (n === awayN) dir = "away";
          else if (n === "draw" || n === "tie") dir = "draw";
          // decimal = היחס העשרוני הגולמי מאתר ההימורים (כולל מרווח הבית)
          return { dir, label: o.name, prob: probs[i], decimal: o.price };
        });

        // בדיקת שפיות: חייבים בדיוק home + away + draw שונים. אם לא — מדלגים
        // על המשחק (לא כותבים יחסים שגויים, נשמרים הקיימים/התיקון הידני).
        const dirs = new Set(mapped.map((x) => x.dir));
        if (!(dirs.size === 3 && dirs.has("home") && dirs.has("away") && dirs.has("draw"))) {
          continue;
        }

        for (const mm of mapped) {
          rows.push({
            market: `match:${game.id}`, // ext_id של המשחק
            option_id: mm.dir,
            label: mm.dir === "draw" ? "Draw" : mm.label,
            prob: mm.prob,
            decimal: mm.decimal, // היחס העשרוני הגולמי
            source: "api",
          });
        }
      }
    }

    // upsert של המשחקים (לא דורס תוצאות קיימות — רק פרטי המשחק)
    if (matchRows.length) {
      await db.from("matches").upsert(matchRows, { onConflict: "ext_id" });
    }

    if (rows.length) {
      // לא דורסים תיקונים ידניים (source='manual-fix') — מסננים אותם החוצה
      const markets = [...new Set(rows.map((r) => r.market))];
      const { data: locked } = await db
        .from("odds")
        .select("market")
        .eq("source", "manual-fix")
        .in("market", markets);
      const lockedSet = new Set((locked ?? []).map((r: any) => r.market));
      const toWrite = rows.filter((r) => !lockedSet.has(r.market));

      const { error } = await db
        .from("odds")
        .upsert(
          toWrite.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
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

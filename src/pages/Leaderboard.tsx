import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds, seedChampionMarket, seedPlayerMarket } from "../lib/data";
import { TOP_ASSISTS_SEED, TOP_SCORER_SEED } from "../data/seedPlayers";
import Loading from "../components/Loading";
import {
  computeLeaderboard,
  makeProbOf,
  type LeaderRow,
} from "../lib/leaderboard";
import type { MarketOption } from "../lib/types";

export default function Leaderboard() {
  const { user } = useAuth();
  const { loading: oddsLoading, rows: oddsRows } = useOdds();
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const [profiles, gp, matches, mp, results] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url"),
        supabase.rpc("reveal_general_picks"), // חשוף רק אחרי הנעילה (RPC מאובטח)
        supabase
          .from("matches")
          .select("id, ext_id, stage, home_team, away_team, home_score, away_score, finished"),
        supabase.rpc("reveal_match_picks"),
        supabase.from("results").select("*"),
      ]);
      if (!alive) return;

      // בניית מפת שווקים מתוך שורות היחסים, + זריעה לאלוף/סגנית/שחקנים
      const markets: Record<string, MarketOption[]> = {};
      for (const r of oddsRows) {
        (markets[r.market] ??= []).push({ id: r.option_id, label: r.label, prob: r.prob });
      }
      if (!markets["champion"]) markets["champion"] = seedChampionMarket();
      if (!markets["runnerUp"]) markets["runnerUp"] = seedChampionMarket();
      if (!markets["topScorer"]) markets["topScorer"] = seedPlayerMarket(TOP_SCORER_SEED);
      if (!markets["secondScorer"]) markets["secondScorer"] = seedPlayerMarket(TOP_SCORER_SEED);
      if (!markets["topAssists"]) markets["topAssists"] = seedPlayerMarket(TOP_ASSISTS_SEED);

      const resultsMap: Record<string, string> = {};
      (results.data ?? []).forEach((r: any) => (resultsMap[r.key] = r.value));

      // אלוף + סגנית נגזרים אוטומטית מהגמר (אם הסתיים) — בלי הזנה ידנית
      const finalMatch = (matches.data ?? []).find(
        (m: any) => m.stage === "final" && m.finished && m.home_score != null,
      );
      if (finalMatch) {
        const homeWon = finalMatch.home_score > finalMatch.away_score;
        const champ = homeWon ? finalMatch.home_team : finalMatch.away_team;
        const runner = homeWon ? finalMatch.away_team : finalMatch.home_team;
        if (!resultsMap["champion"]) resultsMap["champion"] = champ;
        if (!resultsMap["runnerUp"]) resultsMap["runnerUp"] = runner;
      }

      setBoard(
        computeLeaderboard({
          profiles: (profiles.data ?? []) as any,
          generalPicks: (gp.data ?? []) as any,
          matches: (matches.data ?? []) as any,
          matchPicks: (mp.data ?? []) as any,
          results: resultsMap,
          probOf: makeProbOf(markets),
        }),
      );
      setLoading(false);
    }
    refresh();
    // רענון אוטומטי כל 60 שניות כדי שהדירוג יתעדכן לייב
    const t = setInterval(refresh, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [oddsRows]);

  if (loading || oddsLoading) return <Loading />;

  return (
    <div className="space-y-3 animate-fade-up">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">🏆 טבלת המובילים</h1>

      {board.length === 0 && (
        <p className="card p-6 text-center text-sm text-grass-500">
          עדיין אין משתתפים. ברגע שחברים יתחברו הם יופיעו כאן.
        </p>
      )}

      {board.map((row, i) => {
        const isMe = row.userId === user?.id;
        const open = openId === row.userId;
        return (
          <div key={row.userId} className={`card overflow-hidden ${isMe ? "ring-2 ring-grass-400" : ""}`}>
            <button
              onClick={() => setOpenId(open ? null : row.userId)}
              className="flex w-full items-center gap-3 p-3 text-right"
            >
              <Rank i={i} />
              {row.avatar ? (
                <img src={row.avatar} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-grass-100 font-bold text-grass-700">
                  {row.name[0]}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold text-grass-900">
                  {row.name} {isMe && <span className="text-xs text-grass-500">(אני)</span>}
                </div>
                <div className="text-xs text-grass-500">{open ? "הסתר פירוט" : "הצג פירוט"}</div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-grass-700">
                  {row.total.toLocaleString("he-IL")}
                </div>
                <div className="text-[11px] font-bold text-grass-400">נקודות</div>
              </div>
            </button>
            {open && (
              <div className="border-t border-black/5 bg-grass-50/40 px-4 py-3">
                {row.breakdown.length === 0 ? (
                  <p className="text-sm text-grass-500">עדיין לא נצברו נקודות.</p>
                ) : (
                  <ul className="space-y-1">
                    {row.breakdown.map((b, j) => (
                      <li key={j} className="flex justify-between text-sm">
                        <span className="text-grass-700">{b.label}</span>
                        <span className="font-bold text-grass-900">
                          {b.points.toLocaleString("he-IL")} נק'
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Rank({ i }: { i: number }) {
  const medal = ["🥇", "🥈", "🥉"][i];
  return (
    <span className="grid w-7 shrink-0 place-items-center text-lg font-black text-grass-400">
      {medal ?? i + 1}
    </span>
  );
}

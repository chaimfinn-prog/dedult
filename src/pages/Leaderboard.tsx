import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds, seedChampionMarket, seedPlayerMarket, seedTeamMarket } from "../lib/data";
import { TOP_ASSISTS_SEED, TOP_SCORER_SEED } from "../data/seedPlayers";
import {
  BEST_DEFENSE_TEAM_AMERICAN,
  GOLDEN_BALL_SEED,
  GOLDEN_GLOVE_SEED,
  MOST_GOALS_TEAM_AMERICAN,
} from "../data/seedExtraMarkets";
import Loading from "../components/Loading";
import {
  computeLeaderboard,
  makeProbOf,
  type LeaderRow,
} from "../lib/leaderboard";
import { computePrizes } from "../lib/prizes";
import { ENTRY_FEE_ILS } from "../config";
import type { MarketOption } from "../lib/types";

export default function Leaderboard() {
  const { user } = useAuth();
  const { loading: oddsLoading, rows: oddsRows } = useOdds();
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showPrizes, setShowPrizes] = useState(false);
  // מעקב אחר שינויי דירוג בין רענונים (חצים ▲▼)
  const prevRanks = useRef<Record<string, number>>({});
  const [rankDelta, setRankDelta] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const [profiles, gp, matches, mp, results] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, active"),
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
      if (!markets["goldenGlove"]) markets["goldenGlove"] = seedPlayerMarket(GOLDEN_GLOVE_SEED);
      if (!markets["goldenBall"]) markets["goldenBall"] = seedPlayerMarket(GOLDEN_BALL_SEED);
      if (!markets["mostGoalsTeam"]) markets["mostGoalsTeam"] = seedTeamMarket(MOST_GOALS_TEAM_AMERICAN);
      if (!markets["bestDefenseTeam"]) markets["bestDefenseTeam"] = seedTeamMarket(BEST_DEFENSE_TEAM_AMERICAN);

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

      // רק משתתפים פעילים (אדמין יכול להוציא מי שלא שילם)
      const activeProfiles = (profiles.data ?? []).filter(
        (p: any) => p.active !== false,
      );
      setActiveCount(activeProfiles.length);

      const newBoard = computeLeaderboard({
        profiles: activeProfiles as any,
        generalPicks: (gp.data ?? []) as any,
        matches: (matches.data ?? []) as any,
        matchPicks: (mp.data ?? []) as any,
        results: resultsMap,
        probOf: makeProbOf(markets),
      });

      // חישוב שינוי דירוג מול הרענון הקודם (חיובי = עלה למעלה)
      const prev = prevRanks.current;
      const delta: Record<string, number> = {};
      newBoard.forEach((row, i) => {
        if (prev[row.userId] != null) delta[row.userId] = prev[row.userId] - i;
      });
      const next: Record<string, number> = {};
      newBoard.forEach((row, i) => (next[row.userId] = i));
      prevRanks.current = next;
      setRankDelta(delta);

      setBoard(newBoard);
      setLoading(false);

      // תיעוד מצב הדירוג של המשתמש הנוכחי לגרף "מירוץ המקומות" (דלי שעה).
      // כל אחד כותב רק את השורה שלו; מצטבר להיסטוריה משותפת לאורך הטורניר.
      if (user) {
        const myIdx = newBoard.findIndex((r) => r.userId === user.id);
        if (myIdx >= 0) {
          // דלי שעה ב-UTC — עקבי בין כל המשתמשים בלי תלות באזור הזמן של המכשיר
          const d = new Date();
          const bucket = new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()),
          ).toISOString();
          supabase
            .from("score_snapshots")
            .upsert(
              {
                user_id: user.id,
                bucket,
                total: newBoard[myIdx].total,
                rank: myIdx + 1,
              },
              { onConflict: "user_id,bucket" },
            )
            .then(
              () => {},
              () => {}, // אם הטבלה עדיין לא קיימת — מתעלמים בשקט
            );
        }
      }
    }
    refresh();
    // רענון אוטומטי כל 60 שניות כדי שהדירוג יתעדכן לייב
    // רענון תכוף — הדירוג זז דינמית עם עדכון התוצאות (חילופי מקומות בזמן משחק)
    const t = setInterval(refresh, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [oddsRows, user?.id]);

  if (loading || oddsLoading) return <Loading />;

  const pot = activeCount * ENTRY_FEE_ILS;
  const prizes = computePrizes(board, pot);

  return (
    <div className="space-y-3 animate-fade-up">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">🏆 טבלת המובילים</h1>

      {/* קופת הפרסים */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowPrizes((s) => !s)}
          className="flex w-full items-center justify-between bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-3 text-right text-white"
        >
          <div>
            <div className="text-xs font-bold opacity-90">💰 קופת הפרסים</div>
            <div className="text-lg font-black">
              {pot.toLocaleString("he-IL")} ₪
            </div>
          </div>
          <div className="text-left text-xs font-bold opacity-90">
            {activeCount} משתתפים × {ENTRY_FEE_ILS}₪
            <div>{showPrizes ? "הסתר חלוקה ▲" : "הצג חלוקה ▼"}</div>
          </div>
        </button>
        {showPrizes && (
          <ul className="divide-y divide-black/5">
            {prizes.map((pz) => (
              <li key={pz.category} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-bold text-grass-900">{pz.label}</span>
                <div className="text-left">
                  <span className="font-black text-accent-600">
                    {pz.amount.toLocaleString("he-IL")}₪
                  </span>
                  <span className="ms-1 text-xs text-grass-500">
                    ({(pz.share * 100).toFixed(0)}%)
                  </span>
                  {pz.winnerName && (
                    <div className="text-[11px] font-semibold text-grass-600">
                      {pz.winnerName}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {board.length > 0 && <Highlights board={board} delta={rankDelta} />}

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
              <Rank i={i} delta={rankDelta[row.userId] ?? 0} />
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
                <div className="flex items-center gap-2 text-[11px] font-bold text-grass-500">
                  {row.bingo > 0 && (
                    <span className="text-accent-600">🎯 {row.bingo} בינגו</span>
                  )}
                  {row.directionHits > 0 && (
                    <span>✓ {row.directionHits} כיוונים</span>
                  )}
                  <span className="text-grass-400">{open ? "הסתר" : "פירוט"}</span>
                </div>
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
                  <ul className="space-y-1.5">
                    {row.breakdown.map((b, j) => (
                      <li key={j} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-grass-700">{b.label}</span>
                          <span className="font-bold text-grass-900">
                            {b.points.toLocaleString("he-IL")} נק'
                          </span>
                        </div>
                        {b.detail && (
                          <div className="text-[11px] text-grass-400">{b.detail}</div>
                        )}
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

// פסי "מעניין" — תובנות מהירות על הדירוג (מנהיג, בינגו, מומנטום, מרדף צמוד)
function Highlights({
  board,
  delta,
}: {
  board: LeaderRow[];
  delta: Record<string, number>;
}) {
  const items: { emoji: string; text: string }[] = [];

  const leader = board[0];
  if (leader && leader.total > 0) {
    items.push({ emoji: "👑", text: `${leader.name} מוביל עם ${leader.total.toLocaleString("he-IL")} נק'` });
  }

  // מרדף צמוד — פער קטן בין מקום 1 ל-2
  if (board.length >= 2 && board[0].total > 0) {
    const gap = board[0].total - board[1].total;
    if (gap <= 15) {
      items.push({ emoji: "⚔️", text: `מרדף צמוד! ${board[1].name} במרחק ${gap} נק' מהפסגה` });
    }
  }

  // הכי הרבה בינגו
  const topBingo = [...board].sort((a, b) => b.bingo - a.bingo)[0];
  if (topBingo && topBingo.bingo > 0) {
    items.push({ emoji: "🎯", text: `${topBingo.name} עם הכי הרבה בינגו (${topBingo.bingo})` });
  }

  // מומנטום — מי טיפס הכי הרבה מקומות מאז הרענון הקודם
  let bestClimb: { name: string; up: number } | null = null;
  for (const r of board) {
    const up = delta[r.userId] ?? 0;
    if (up > 0 && (!bestClimb || up > bestClimb.up)) bestClimb = { name: r.name, up };
  }
  if (bestClimb) {
    items.push({ emoji: "🔥", text: `${bestClimb.name} בתנופה — עלה ${bestClimb.up} מקומות` });
  }

  if (items.length === 0) return null;

  return (
    <div className="card p-3">
      <div className="mb-1.5 px-1 text-xs font-extrabold text-grass-500">✨ מעניין</div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-semibold text-grass-800">
            <span className="text-base">{it.emoji}</span>
            <span>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rank({ i, delta }: { i: number; delta: number }) {
  const medal = ["🥇", "🥈", "🥉"][i];
  return (
    <span className="grid w-8 shrink-0 place-items-center">
      <span className="text-lg font-black text-grass-400">{medal ?? i + 1}</span>
      {delta !== 0 && (
        <span
          className={`text-[10px] font-bold ${delta > 0 ? "text-grass-600" : "text-red-500"}`}
        >
          {delta > 0 ? `▲${delta}` : `▼${-delta}`}
        </span>
      )}
    </span>
  );
}

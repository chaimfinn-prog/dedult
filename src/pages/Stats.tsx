import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { TOURNAMENT_KICKOFF_ISO } from "../config";
import Loading from "../components/Loading";
import Flag from "../components/Flag";
import { TEAM_BY_CODE } from "../data/teams";
import {
  fetchRevealedGeneral,
  fetchRevealedMatchPicks,
  type RevealedGeneral,
  type RevealedMatchPick,
} from "../lib/social";
import { generalStats, type CountItem } from "../lib/stats";

export default function Stats() {
  const [gen, setGen] = useState<RevealedGeneral[]>([]);
  const [mp, setMp] = useState<RevealedMatchPick[]>([]);
  const [loading, setLoading] = useState(true);

  const tournamentStarted = Date.now() >= new Date(TOURNAMENT_KICKOFF_ISO).getTime();

  useEffect(() => {
    let alive = true;
    (async () => {
      const [g, m] = await Promise.all([
        fetchRevealedGeneral(),
        fetchRevealedMatchPicks(),
      ]);
      if (!alive) return;
      setGen(g);
      setMp(m);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <Loading />;

  const stats = generalStats(gen);
  const matchVotes = mp.length;

  return (
    <div className="space-y-5 animate-fade-up pb-4">
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
          <span className="pointer-events-none absolute -left-3 -top-4 text-7xl opacity-15">📊</span>
          <h1 className="text-xl font-extrabold">סטטיסטיקת החברים</h1>
          <p className="mt-1 text-sm text-grass-100/90">
            מה החבורה ניחשה — נחשף רק אחרי שכל ניחוש ננעל.
          </p>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <p className="card p-6 text-center text-sm text-grass-500">חיבור Supabase חסר.</p>
      ) : !tournamentStarted ? (
        <div className="card p-6 text-center">
          <div className="mb-2 text-4xl">🔒</div>
          <h2 className="text-lg font-extrabold text-grass-900">עוד מוקדם</h2>
          <p className="mt-1 text-sm text-grass-500">
            הניחושים הכלליים של החברים ייחשפו עם שריקת הפתיחה של הטורניר.
            ניחושי משחקים נחשפים עם תחילת כל משחק.
          </p>
        </div>
      ) : (
        <>
          <StatBlock title="🏆 אלוף — הכי מנוחש" items={stats.champion} kind="team" total={stats.totalVoters} />
          <StatBlock title="👟 מלך השערים" items={stats.topScorer} kind="player" total={stats.totalVoters} />
          <StatBlock title="🎯 סגן מלך השערים" items={stats.secondScorer} kind="player" total={stats.totalVoters} />
          <StatBlock title="🅰️ מלך הבישולים" items={stats.topAssists} kind="player" total={stats.totalVoters} />
          <StatBlock title="⭐ כדור הזהב" items={stats.goldenBall} kind="player" total={stats.totalVoters} />
          <StatBlock title="🧤 כפפת הזהב" items={stats.goldenGlove} kind="player" total={stats.totalVoters} />
          <StatBlock title="⚽ קבוצה כובשת" items={stats.mostGoalsTeam} kind="team" total={stats.totalVoters} />
          <StatBlock title="🛡️ הגנה הכי טובה" items={stats.bestDefenseTeam} kind="team" total={stats.totalVoters} />

          <div className="card p-4 text-center text-sm text-grass-500">
            סה"כ <b className="text-grass-800">{stats.totalVoters}</b> חברים מילאו ניחושים כלליים ·{" "}
            <b className="text-grass-800">{matchVotes}</b> ניחושי משחקים נחשפו עד כה.
          </div>
        </>
      )}
    </div>
  );
}

function StatBlock({
  title,
  items,
  kind,
  total,
}: {
  title: string;
  items: CountItem[];
  kind: "team" | "player";
  total: number;
}) {
  const top = items.slice(0, 6);
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-base font-extrabold text-grass-900">{title}</h2>
      {top.length === 0 ? (
        <p className="text-sm text-grass-500">אין עדיין ניחושים בקטגוריה זו.</p>
      ) : (
        <div className="space-y-2">
          {top.map((it) => {
            const team = kind === "team" ? TEAM_BY_CODE[it.key] : null;
            const label = team ? team.nameHe : it.key;
            return (
              <div key={it.key} className="flex items-center gap-3">
                {kind === "team" && <Flag code={it.key} size={26} />}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="truncate text-sm font-bold text-grass-900">{label}</span>
                    <span className="text-xs font-bold text-grass-500">
                      {it.count} ({(it.pct * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-grass-50">
                    <div
                      className="h-full rounded-full bg-grass-500"
                      style={{ width: `${it.pct * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-[11px] text-grass-400">מתוך {total} מנחשים</p>
        </div>
      )}
    </section>
  );
}

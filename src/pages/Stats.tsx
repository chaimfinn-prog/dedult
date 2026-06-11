import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { TOURNAMENT_KICKOFF_ISO } from "../config";
import Loading from "../components/Loading";
import Flag from "../components/Flag";
import { TEAM_BY_CODE } from "../data/teams";
import { championFrom, runnerUpFrom } from "../lib/bracketState";
import {
  fetchRevealedGeneral,
  fetchRevealedMatchPicks,
  type RevealedGeneral,
  type RevealedMatchPick,
} from "../lib/social";
import { generalStats, type CountItem } from "../lib/stats";

interface ProfileLite {
  id: string;
  name: string;
  avatar: string | null;
}

export default function Stats() {
  const [gen, setGen] = useState<RevealedGeneral[]>([]);
  const [mp, setMp] = useState<RevealedMatchPick[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "players">("stats");
  const [openId, setOpenId] = useState<string | null>(null);

  const tournamentStarted = Date.now() >= new Date(TOURNAMENT_KICKOFF_ISO).getTime();

  useEffect(() => {
    let alive = true;
    (async () => {
      const [g, m, profs] = await Promise.all([
        fetchRevealedGeneral(),
        fetchRevealedMatchPicks(),
        isSupabaseConfigured
          ? supabase.from("profiles").select("id, full_name, avatar_url, active")
          : Promise.resolve({ data: [] as any }),
      ]);
      if (!alive) return;
      setGen(g);
      setMp(m);
      setProfiles(
        ((profs as any).data ?? [])
          .filter((p: any) => p.active !== false)
          .map((p: any) => ({ id: p.id, name: p.full_name ?? "אנונימי", avatar: p.avatar_url })),
      );
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <Loading />;

  const stats = generalStats(gen);
  const matchVotes = mp.length;
  const genByUser: Record<string, RevealedGeneral> = {};
  gen.forEach((r) => (genByUser[r.user_id] = r));

  return (
    <div className="space-y-4 animate-fade-up pb-4">
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
          <span className="pointer-events-none absolute -left-3 -top-4 text-7xl opacity-15">📊</span>
          <h1 className="text-xl font-extrabold">סטטיסטיקת החברים</h1>
          <p className="mt-1 text-sm text-grass-100/90">
            מה החבורה ניחשה — נחשף רק אחרי שכל ניחוש ננעל.
          </p>
        </div>
      </div>

      {/* טאבים: סטטיסטיקה כללית / מי ניחש מה */}
      <div className="flex gap-1 rounded-2xl bg-grass-50 p-1">
        <button
          onClick={() => setTab("stats")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === "stats" ? "bg-grass-600 text-white shadow-lift" : "text-grass-600"}`}
        >
          📊 סטטיסטיקה
        </button>
        <button
          onClick={() => setTab("players")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === "players" ? "bg-grass-600 text-white shadow-lift" : "text-grass-600"}`}
        >
          👥 מי ניחש מה
        </button>
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
      ) : tab === "stats" ? (
        <div className="space-y-4">
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
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const g = genByUser[p.id];
            const open = openId === p.id;
            const champ = g?.bracket ? championFrom(g.bracket) : null;
            return (
              <div key={p.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="flex w-full items-center gap-3 p-3 text-right"
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-grass-100 font-bold text-grass-700">
                      {p.name[0]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold text-grass-900">{p.name}</div>
                    <div className="text-xs text-grass-500">{g ? (open ? "הסתר" : "הצג ניחושים") : "טרם מילא"}</div>
                  </div>
                  {champ && <span className="flex items-center gap-1"><Flag code={champ} size={22} />🏆</span>}
                </button>
                {open && g && (
                  <div className="border-t border-black/5 bg-grass-50/40 px-4 py-3">
                    <PlayerPicks g={g} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayerPicks({ g }: { g: RevealedGeneral }) {
  const champ = g.bracket ? championFrom(g.bracket) : null;
  const runner = g.bracket ? runnerUpFrom(g.bracket) : null;
  const teamRow = (label: string, code: string | null) => (
    <PRow label={label}>
      {code ? (
        <span className="flex items-center gap-1.5">
          <Flag code={code} size={20} />
          {TEAM_BY_CODE[code]?.nameHe ?? code}
        </span>
      ) : "—"}
    </PRow>
  );
  return (
    <div className="space-y-1.5">
      {teamRow("🏆 אלוף", champ)}
      {teamRow("🥈 סגנית", runner)}
      <PRow label="👟 מלך שערים">{g.top_scorer || "—"}</PRow>
      <PRow label="🎯 סגן מלך שערים">{g.second_scorer || "—"}</PRow>
      <PRow label="🅰️ מלך בישולים">{g.top_assists || "—"}</PRow>
      <PRow label="⭐ כדור הזהב">{g.golden_ball || "—"}</PRow>
      <PRow label="🧤 כפפת הזהב">{g.golden_glove || "—"}</PRow>
      {teamRow("⚽ קבוצה כובשת", g.most_goals_team)}
      {teamRow("🛡️ הגנה הכי טובה", g.best_defense_team)}
    </div>
  );
}

function PRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-grass-600">{label}</span>
      <span className="font-bold text-grass-900">{children}</span>
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

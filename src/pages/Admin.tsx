import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { buildNormalizedMarket, normalizeProbabilities, probFromDecimal } from "../lib/odds";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import { TEAMS, TEAM_BY_CODE, GROUPS, GROUP_LETTERS } from "../data/teams";
import { STAGE_LABELS_HE, STAGE_ORDER } from "../lib/types";
import { championFrom } from "../lib/bracketState";
import { analyzeAudit } from "../lib/audit";
import { closestMisses, hypotheticalWinnings, mostDraws } from "../lib/funStats";
import { generalStats } from "../lib/stats";
import { relevantGeneralForMatch } from "../lib/matchSocial";
import FunStatCard, { type FunStatData } from "../components/FunStatCard";
import {
  fetchRevealedGeneral,
  fetchRevealedMatchPicks,
} from "../lib/social";
import {
  downloadCSV,
  generalPicksCSV,
  matchPicksCSV,
  stagesCSV,
  type ExportProfile,
} from "../lib/export";

interface Match {
  id: number;
  ext_id?: string | null;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const { lastUpdated } = useOdds();

  if (!isAdmin) {
    return (
      <div className="card animate-fade-up p-6 text-center">
        <div className="mb-2 text-4xl">🔒</div>
        <h2 className="text-lg font-extrabold text-grass-900">אין הרשאת ניהול</h2>
        <p className="mt-1 text-sm text-grass-500">מסך זה זמין למנהל בלבד.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up pb-4">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">⚙️ ניהול</h1>
      <FunStatsAdmin />
      <MissingPicksAdmin />
      <ExportPicks />
      <OddsRefresh lastUpdated={lastUpdated} />
      <MatchesAdmin />
      <MatchOddsEditor />
      <GroupStandingsAdmin />
      <KnockoutStagesAdmin />
      <ResultsAdmin />
      <ManualMarketEditor />
      <PlayersAdmin />
    </div>
  );
}

// ניהול משתתפים — הוצאה/החזרה של מי שלא שילם (לא מוחק נתונים)
interface PlayerRow {
  id: string;
  full_name: string | null;
  active: boolean;
}
function PlayersAdmin() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, active")
      .order("full_name");
    setPlayers((data ?? []) as PlayerRow[]);
    setLoading(false);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, []);

  async function setActive(id: string, active: boolean) {
    await supabase.from("profiles").update({ active }).eq("id", id);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
  }

  const activeCount = players.filter((p) => p.active !== false).length;

  if (loading) return null;

  return (
    <section className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-right"
      >
        <h2 className="text-base font-extrabold text-grass-900">
          ⚙️ ניהול משתתפים ({activeCount} פעילים)
        </h2>
        <span className="text-sm text-grass-400">{open ? "▲" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-black/5 p-4 pt-3">
          <p className="mb-3 text-sm text-grass-500">
            הוצא מהמשחק מי שלא שילם — הוא לא ייספר בדירוג ובקופה. ההוצאה אינה מוחקת
            את הניחושים; אפשר להחזיר בכל עת.
          </p>
          <div className="space-y-1.5">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-2xl border p-2 text-sm ${
                  p.active === false ? "border-red-200 bg-red-50/50" : "border-black/10"
                }`}
              >
                <span className="flex-1 font-bold text-grass-900">
                  {p.full_name ?? "אנונימי"}
                  {p.active === false && (
                    <span className="ms-2 text-xs font-semibold text-red-500">(הוצא)</span>
                  )}
                </span>
                {p.active === false ? (
                  <button onClick={() => setActive(p.id, true)} className="btn-ghost text-xs">
                    החזר
                  </button>
                ) : (
                  <button
                    onClick={() => setActive(p.id, false)}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    הוצא מהמשחק
                  </button>
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-grass-500">אין משתתפים עדיין.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// כרטיס סטטיסטיקה אחד — תצוגה רגילה באדמין + כפתור שיתוף שלוכד את
// FunStatCard (מוסתר, 620px קבוע) כתמונה ע"י html-to-image ומשתף/מוריד.
function ShareableFunCard({ data, filename }: { data: FunStatData; filename: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const empty = !data.rows?.length && !data.lines?.length;

  async function share() {
    if (!ref.current) return;
    setBusy(true);
    setMsg(null);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      const navAny = navigator as any;
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({ files: [file], title: data.title });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        a.click();
      }
    } catch {
      setMsg("השיתוף נכשל, נסה שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-black/5 bg-grass-50/50 px-4 py-2.5">
        <span className="text-lg">{data.emoji}</span>
        <span className="flex-1 text-sm font-extrabold text-grass-900">{data.title}</span>
        <button
          onClick={share}
          disabled={busy || empty}
          className="rounded-xl bg-grass-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {busy ? "…" : "📤 שתף"}
        </button>
      </div>
      {data.subtitle && <p className="px-4 pt-2 text-xs text-grass-500">{data.subtitle}</p>}
      <div className="p-4 pt-2">
        {data.rows && data.rows.length > 0 && (
          <div className="space-y-1">
            {data.rows.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-center font-bold text-grass-400">
                  {["🥇", "🥈", "🥉"][i] ?? i + 1}
                </span>
                <span className="flex-1 truncate font-semibold text-grass-800">{r.label}</span>
                <span className="shrink-0 font-bold text-grass-700">{r.value}</span>
              </div>
            ))}
          </div>
        )}
        {data.lines && data.lines.length > 0 && (
          <div className="space-y-1">
            {data.lines.slice(0, 12).map((l, i) => (
              <p key={i} className="text-sm text-grass-700">{l}</p>
            ))}
          </div>
        )}
        {empty && <p className="text-sm text-grass-400">אין עדיין מספיק נתונים לכרטיס הזה.</p>}
      </div>
      {msg && <p className="px-4 pb-2 text-xs font-semibold text-red-500">{msg}</p>}
      <div
        aria-hidden
        style={{ position: "fixed", width: 0, height: 0, overflow: "hidden", top: 0, insetInlineStart: 0 }}
      >
        <FunStatCard ref={ref} data={data} />
      </div>
    </div>
  );
}

// סטטיסטיקות משעשעות/מעניינות מוכנות לשיתוף בוואטסאפ — כל כרטיס מחושב
// מפונקציות טהורות קיימות (funStats.ts / stats.ts / matchSocial.ts / audit.ts).
function FunStatsAdmin() {
  const [cards, setCards] = useState<FunStatData[] | null>(null);

  async function load() {
    const [gen, mp, matchesRes, profsRes, oddsRes, auditRes] = await Promise.all([
      fetchRevealedGeneral(),
      fetchRevealedMatchPicks(),
      supabase
        .from("matches")
        .select("id, ext_id, stage, home_team, away_team, kickoff, home_score, away_score, finished")
        .order("kickoff"),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("odds").select("market, option_id, decimal"),
      supabase.from("match_picks_audit").select("*").order("changed_at", { ascending: false }).limit(300),
    ]);
    const matches = matchesRes.data ?? [];
    const nameMap = new Map<string, string>();
    (profsRes.data ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? "אנונימי"));
    const nameOf = (id: string) => nameMap.get(id) ?? "אנונימי";

    const oddsMap = new Map<string, number>();
    (oddsRes.data ?? []).forEach((r: any) => {
      if (r.decimal) oddsMap.set(`${r.market}|${r.option_id}`, r.decimal);
    });
    const decimalOf = (market: string, dir: string) => oddsMap.get(`${market}|${dir}`);

    const winnings = hypotheticalWinnings(mp as any, matches as any, decimalOf, 10);
    const draws = mostDraws(mp as any);
    const misses = closestMisses(mp as any, matches as any);
    const stats = generalStats(gen);

    const insights = auditRes.error
      ? []
      : analyzeAudit(
          (auditRes.data ?? []) as any,
          matches as any,
          nameOf,
          (c) => TEAM_BY_CODE[c]?.nameHe ?? c,
        ).filter((i) => i.kind === "dropped_winner" || i.kind === "switched_to_winner");

    const now = Date.now();
    const upcoming = (matches as any[])
      .filter((m) => !m.finished && new Date(m.kickoff).getTime() > now)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];
    let relevantCard: FunStatData | null = null;
    if (upcoming) {
      const rel = relevantGeneralForMatch(gen, nameOf, upcoming.home_team, upcoming.away_team);
      relevantCard = {
        emoji: "🔮",
        title: "מי קשור למשחק הבא",
        subtitle: `${TEAM_BY_CODE[upcoming.home_team]?.nameHe ?? upcoming.home_team} נגד ${TEAM_BY_CODE[upcoming.away_team]?.nameHe ?? upcoming.away_team}`,
        lines: rel.map((r) => `${r.emoji} ${r.who} — ${r.category}: ${r.what}`),
      };
    }

    const list: FunStatData[] = [
      {
        emoji: "💰",
        title: "אם הימרת ₪10 על כל משחק",
        subtitle: "רווח/הפסד וירטואלי מצטבר, לפי היחסים האמיתיים",
        rows: winnings.map((w) => ({
          label: nameOf(w.userId),
          value: `${w.value >= 0 ? "+" : ""}${Math.round(w.value)}₪`,
          sub: `${w.extra ?? 0} הימורים`,
        })),
      },
      {
        emoji: "👟",
        title: "מובילי מלך השערים",
        subtitle: "מי הכי הרבה חברים ניחשו",
        rows: stats.topScorer.slice(0, 10).map((it) => ({
          label: it.key,
          value: `${it.count} (${Math.round(it.pct * 100)}%)`,
        })),
      },
      {
        emoji: "🤝",
        title: "מלכי התיקו",
        subtitle: "מי ניחש הכי הרבה תוצאות תיקו",
        rows: draws.map((d) => ({ label: nameOf(d.userId), value: `${d.value} תיקו` })),
      },
      {
        emoji: "🎯",
        title: "הכי קרוב בלי לפגוע",
        subtitle: "כמה פעמים הוחמצה תוצאה מדויקת בשער אחד בדיוק",
        rows: misses.map((m) => ({ label: nameOf(m.userId), value: `${m.value} פעמים` })),
      },
      {
        emoji: "😅",
        title: "רגעים דרמטיים",
        subtitle: "מי ביטל ניחוש מנצח, ומי החליף ברגע האחרון ופגע",
        lines: insights.slice(0, 12).map((i) => i.note),
      },
      ...(relevantCard ? [relevantCard] : []),
    ];
    setCards(list);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setCards([]);
  }, []);

  if (cards === null) return <Card title="🎉 סטטיסטיקות לשיתוף"><Loading /></Card>;

  return (
    <div className="space-y-3">
      <h2 className="px-1 text-base font-extrabold text-grass-900">🎉 סטטיסטיקות לשיתוף</h2>
      {cards.map((c, i) => (
        <ShareableFunCard key={i} data={c} filename={`mondial-stat-${i}.png`} />
      ))}
    </div>
  );
}

// מי לא מילא ניחושים — כללי ו/או משחקים
interface MissingRow { id: string; name: string; general: boolean; matchCount: number }
function MissingPicksAdmin() {
  const [rows, setRows] = useState<MissingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: profs }, gen, mp] = await Promise.all([
      supabase.from("profiles").select("id, full_name, active").order("full_name"),
      supabase.rpc("reveal_general_picks"),
      supabase.rpc("reveal_match_picks"),
    ]);
    const genByUser = new Map<string, any>();
    (gen.data ?? []).forEach((g: any) => genByUser.set(g.user_id, g));
    const mpCount = new Map<string, number>();
    (mp.data ?? []).forEach((m: any) => mpCount.set(m.user_id, (mpCount.get(m.user_id) ?? 0) + 1));
    const hasGeneral = (g: any) =>
      !!g &&
      !!(
        (g.bracket && championFrom(g.bracket)) ||
        g.top_scorer || g.second_scorer || g.top_assists ||
        g.golden_ball || g.golden_glove || g.most_goals_team || g.best_defense_team
      );
    const list: MissingRow[] = (profs ?? [])
      .filter((p: any) => p.active !== false)
      .map((p: any) => ({
        id: p.id,
        name: p.full_name ?? "אנונימי",
        general: hasGeneral(genByUser.get(p.id)),
        matchCount: mpCount.get(p.id) ?? 0,
      }));
    setRows(list);
    setLoading(false);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, []);

  if (loading) return <Card title="📋 מי לא מילא"><Loading /></Card>;

  const missingGeneral = rows.filter((r) => !r.general).length;
  const noMatches = rows.filter((r) => r.matchCount === 0).length;

  return (
    <Card title="📋 מי לא מילא ניחושים">
      <p className="mb-3 text-sm text-grass-600">
        חסר ניחוש כללי: <b className="text-red-600">{missingGeneral}</b> · בלי אף ניחוש משחק:{" "}
        <b className="text-red-600">{noMatches}</b>
      </p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-2xl border border-black/10 p-2 text-sm">
            <span className="flex-1 font-bold text-grass-900">{r.name}</span>
            <span className={r.general ? "chip bg-grass-100 text-grass-700" : "chip bg-red-100 text-red-600"}>
              {r.general ? "כללי ✓" : "כללי ✗"}
            </span>
            <span className={r.matchCount > 0 ? "chip bg-grass-100 text-grass-700" : "chip bg-red-100 text-red-600"}>
              {r.matchCount} משחקים
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-grass-500">אין משתתפים.</p>}
      </div>
    </Card>
  );
}

// ייצוא כל ההימורים של כולם ל-CSV (נפתח ב-Excel / Google Sheets)
function ExportPicks() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const [{ data: profs }, general, matchPicks, { data: matches }] =
        await Promise.all([
          supabase.from("profiles").select("id, full_name"),
          fetchRevealedGeneral(),
          fetchRevealedMatchPicks(),
          supabase.from("matches").select("id, home_team, away_team, kickoff"),
        ]);

      const profiles: ExportProfile[] = (profs ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name ?? "אנונימי",
      }));

      const matchLabel = (id: number) => {
        const m = (matches ?? []).find((x: any) => x.id === id);
        if (!m) return `משחק ${id}`;
        const h = TEAM_BY_CODE[m.home_team]?.nameHe ?? m.home_team;
        const a = TEAM_BY_CODE[m.away_team]?.nameHe ?? m.away_team;
        return `${h} - ${a}`;
      };

      const stamp = new Date().toISOString().slice(0, 10);
      downloadCSV(`ניחושים-כלליים-${stamp}.csv`, generalPicksCSV(profiles, general));
      downloadCSV(`שלבים-${stamp}.csv`, stagesCSV(profiles, general));
      downloadCSV(
        `ניחושי-משחקים-${stamp}.csv`,
        matchPicksCSV(profiles, matchPicks, matchLabel),
      );

      setMsg(
        `✓ הורדו 3 קבצים (${profiles.length} משתתפים). שים לב: ניחושים שעדיין נעולים לא ייכללו עד שייחשפו.`,
      );
    } catch {
      setMsg("שגיאה בייצוא. נסה שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="📤 ייצוא כל ההימורים (גיבוי / Excel)">
      <p className="mb-3 text-sm text-grass-500">
        מוריד 3 קבצי CSV מסודרים (ניחושים כלליים, שלבים, ניחושי משחקים) —
        נפתחים ישירות ב-Excel או Google Sheets ונשמרים כגיבוי.
      </p>
      <button onClick={run} disabled={busy} className="btn-primary w-full">
        {busy ? "מייצא…" : "ייצוא ל-CSV"}
      </button>
      {msg && <p className="mt-2 text-sm font-semibold text-grass-700">{msg}</p>}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-base font-extrabold text-grass-900">{title}</h2>
      {children}
    </section>
  );
}

function OddsRefresh({ lastUpdated }: { lastUpdated: string | null }) {
  const [busy, setBusy] = useState<null | "odds" | "scores">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(fn: "fetch-odds" | "fetch-scores", kind: "odds" | "scores") {
    setBusy(kind);
    setMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { method: "POST" });
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error || "שגיאה לא ידועה");
      setMsg(
        kind === "odds"
          ? `✓ עודכנו ${data?.upserted ?? 0} יחסים`
          : `✓ עודכנו ${data?.updated ?? 0} תוצאות` +
            (data?.remaining != null ? ` · נותרו ${data.remaining} קריאות API החודש` : ""),
      );
    } catch (e: any) {
      setMsg("שגיאה: " + (e?.message || String(e)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="🔄 עדכון אוטומטי (יחסים + תוצאות)">
      <p className="mb-3 text-sm text-grass-500">
        עדכון יחסים אחרון:{" "}
        {lastUpdated ? new Date(lastUpdated).toLocaleString("he-IL") : "טרם נמשכו יחסים"}
        <br />
        התוצאות מתעדכנות אוטומטית בשעות הערב (cron). הכפתורים כאן לרענון ידני מיידי.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => run("fetch-scores", "scores")}
          disabled={busy != null}
          className="btn-primary"
        >
          {busy === "scores" ? "מעדכן…" : "רענן תוצאות עכשיו"}
        </button>
        <button
          onClick={() => run("fetch-odds", "odds")}
          disabled={busy != null}
          className="btn-ghost ring-1 ring-grass-200"
        >
          {busy === "odds" ? "מעדכן…" : "רענן יחסים עכשיו"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm font-semibold text-grass-700">{msg}</p>}
    </Card>
  );
}

function MatchesAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [home, setHome] = useState("ARG");
  const [away, setAway] = useState("FRA");
  const [kickoff, setKickoff] = useState("");
  const [stage, setStage] = useState("r16");
  const [msg, setMsg] = useState<string | null>(null);
  const [showGroups, setShowGroups] = useState(false);

  async function load() {
    const { data } = await supabase.from("matches").select("*").order("kickoff");
    setMatches((data ?? []) as Match[]);
    setLoading(false);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, []);

  async function addMatch() {
    if (!kickoff) return;
    const { error } = await supabase.from("matches").insert({
      home_team: home,
      away_team: away,
      kickoff: new Date(kickoff).toISOString(),
      stage,
    });
    setMsg(error ? "שגיאת הוספה: " + error.message : "✓ המשחק נוסף");
    setKickoff("");
    load();
  }

  async function saveResult(
    m: Match,
    hs: number,
    as: number,
    finished: boolean,
  ): Promise<{ ok: boolean; error?: string }> {
    const { data, error } = await supabase
      .from("matches")
      .update({ home_score: hs, away_score: as, finished, live: !finished })
      .eq("id", m.id)
      .select("id");
    if (error) {
      setMsg("שגיאת שמירה: " + error.message);
      return { ok: false, error: error.message };
    }
    // RLS חוסם בשקט (0 שורות) אם is_admin() לא מחזיר true — הרץ security-hardening.sql
    if (!data || data.length === 0) {
      const hint =
        "השמירה נחסמה (אין הרשאת אדמין). הרץ את supabase/security-hardening.sql כדי לתקן את is_admin().";
      setMsg("⚠️ " + hint);
      return { ok: false, error: hint };
    }
    setMsg(`✓ נשמרה תוצאה ${hs}-${as}`);
    await load();
    return { ok: true };
  }

  if (loading) return <Card title="⚽ משחקים"><Loading /></Card>;

  return (
    <Card title="⚽ משחקים ותוצאות">
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl bg-grass-50 p-3 sm:grid-cols-5">
        <select value={home} onChange={(e) => setHome(e.target.value)} className="input">
          {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
        </select>
        <select value={away} onChange={(e) => setAway(e.target.value)} className="input">
          {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="input">
          {STAGE_ORDER.filter((s) => s !== "winner").map((s) => (
            <option key={s} value={s}>{STAGE_LABELS_HE[s]}</option>
          ))}
        </select>
        <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="input" />
        <button onClick={addMatch} className="btn-primary">הוסף משחק</button>
      </div>

      {msg && <p className="mb-2 text-sm font-semibold text-grass-700">{msg}</p>}

      {(() => {
        const finishedGroups = matches.filter((m) => m.stage === "groups" && m.finished).length;
        return finishedGroups > 0 ? (
          <button
            onClick={() => setShowGroups((s) => !s)}
            className="mb-2 text-xs font-bold text-grass-500 underline"
          >
            {showGroups ? "הסתר" : `הצג גם`} משחקי שלב הבתים שהסתיימו ({finishedGroups})
          </button>
        ) : null;
      })()}

      <div className="space-y-2">
        {matches
          .filter((m) => {
            if (!m.finished) return true;
            if (showGroups) return true;
            if (m.stage !== "groups") return true;
            // הצג גם משחקי-קבוצות שהסתיימו לאחרונה (14 יום) — מנע הסתרה בגלל שגיאת שלב
            return Date.now() - new Date(m.kickoff).getTime() < 14 * 24 * 60 * 60 * 1000;
          })
          .map((m) => (
            <ResultRow key={m.id} match={m} onSave={saveResult} />
          ))}
        {matches.length === 0 && (
          <p className="text-sm text-grass-500">אין משחקים עדיין.</p>
        )}
      </div>
    </Card>
  );
}

function ResultRow({
  match,
  onSave,
}: {
  match: Match;
  onSave: (
    m: Match,
    hs: number,
    as: number,
    finished: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [hs, setHs] = useState(match.home_score ?? 0);
  const [as, setAs] = useState(match.away_score ?? 0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");
  const [advancer, setAdvancer] = useState("");

  async function handle(finished: boolean) {
    setStatus("saving");
    const r = await onSave(match, hs, as, finished);
    if (r.ok && advancer && match.stage !== "groups") {
      const stageIdx = STAGE_ORDER.indexOf(match.stage as any);
      const nextStage = STAGE_ORDER[stageIdx + 1];
      if (nextStage) {
        await supabase.from("results").upsert({ key: `stage:${advancer}`, value: nextStage });
      }
    }
    setStatus(r.ok ? "saved" : "err");
    if (r.ok) setTimeout(() => setStatus("idle"), 2000);
  }

  async function updateStage(newStage: string) {
    await supabase.from("matches").update({ stage: newStage }).eq("id", match.id);
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 p-2 text-sm">
      <span className="flex-1 font-bold text-grass-900">
        {TEAM_BY_CODE[match.home_team]?.nameHe} – {TEAM_BY_CODE[match.away_team]?.nameHe}
        {match.finished && (
          <span className="ms-2 text-xs font-semibold text-grass-400">
            (שמור: {match.home_score}-{match.away_score})
          </span>
        )}
      </span>
      <select
        defaultValue={match.stage}
        onChange={(e) => updateStage(e.target.value)}
        className="h-9 rounded-lg border border-black/10 px-1 text-xs"
      >
        {STAGE_ORDER.filter((s) => s !== "winner").map((s) => (
          <option key={s} value={s}>{STAGE_LABELS_HE[s]}</option>
        ))}
      </select>
      <input type="number" min={0} value={hs} onChange={(e) => setHs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
      <span>:</span>
      <input type="number" min={0} value={as} onChange={(e) => setAs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
      {match.stage !== "groups" && (
        <select
          value={advancer}
          onChange={(e) => setAdvancer(e.target.value)}
          className="h-9 rounded-lg border border-black/10 px-1 text-xs"
        >
          <option value="">— מי עלתה?</option>
          <option value={match.home_team}>{TEAM_BY_CODE[match.home_team]?.nameHe ?? match.home_team}</option>
          <option value={match.away_team}>{TEAM_BY_CODE[match.away_team]?.nameHe ?? match.away_team}</option>
        </select>
      )}
      {match.finished && (
        <button
          onClick={() => handle(false)}
          disabled={status === "saving"}
          className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-50"
          title="החזר למצב לייב"
        >
          🔴 חי
        </button>
      )}
      <button
        onClick={() => handle(true)}
        disabled={status === "saving"}
        className="btn-ghost text-xs disabled:opacity-50"
      >
        {status === "saving"
          ? "שומר…"
          : status === "saved"
            ? "✓"
            : status === "err"
              ? "שגיאה"
              : match.finished
                ? "עדכן"
                : "סיים"}
      </button>
    </div>
  );
}

// דירוג בתים ידני — קובע מקום 1–4 לכל בית (5 נק' לכל מיקום מדויק).
// נשמר ב-results['group:X'] ועוקף את החישוב האוטומטי בדירוג.
function GroupStandingsAdmin() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [group, setGroup] = useState(GROUP_LETTERS[0]);
  const [order, setOrder] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("results").select("*");
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => (map[r.key] = r.value));
    setResults(map);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
  }, []);
  useEffect(() => {
    const saved = results[`group:${group}`];
    setOrder(saved ? saved.split(",").map((s) => s.trim()) : GROUPS[group].map((t) => t.code));
  }, [group, results]);

  const teams = GROUPS[group];
  function setPos(i: number, code: string) {
    setOrder((prev) => {
      const n = [...prev];
      n[i] = code;
      return n;
    });
  }
  async function save() {
    if (order.length !== 4 || new Set(order).size !== 4) {
      setMsg("בחר 4 קבוצות שונות (מקום 1–4)");
      return;
    }
    const { data, error } = await supabase
      .from("results")
      .upsert({ key: `group:${group}`, value: order.join(",") })
      .select("key");
    if (error) { setMsg("שגיאה: " + error.message); return; }
    if (!data || data.length === 0) { setMsg("⚠️ נחסם (אין הרשאת אדמין). הרץ security-hardening.sql."); return; }
    setMsg(`✓ נשמר דירוג בית ${group}`);
    load();
  }

  return (
    <Card title="🏟️ דירוג בתים — מיקומים (5 נק' לכל מיקום)">
      <p className="mb-2 text-xs text-grass-500">
        קבע מקום 1–4 לכל בית. זה קובע את ניקוד המיקומים בדירוג ועוקף את החישוב
        האוטומטי. את העולות בנוקאאוט מסמנים למטה ב"שלב סופי של נבחרת".
      </p>
      <select value={group} onChange={(e) => setGroup(e.target.value)} className="input mb-2">
        {GROUP_LETTERS.map((g) => <option key={g} value={g}>בית {g}</option>)}
      </select>
      <div className="space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-sm font-bold text-grass-700">מקום {i + 1}</span>
            <select value={order[i] ?? ""} onChange={(e) => setPos(i, e.target.value)} className="input flex-1">
              {teams.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-primary mt-3 w-full">שמור דירוג בית {group}</button>
      {msg && <p className="mt-2 text-sm font-semibold text-grass-700">{msg}</p>}
    </Card>
  );
}

function KnockoutStagesAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stageResults, setStageResults] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: mData }, { data: rData }] = await Promise.all([
      supabase.from("matches").select("id, home_team, away_team, stage, finished, home_score, away_score"),
      supabase.from("results").select("key, value"),
    ]);
    setMatches((mData ?? []) as Match[]);
    const map: Record<string, string> = {};
    (rData ?? []).forEach((r: any) => {
      if (r.key.startsWith("stage:")) map[r.key.slice(6)] = r.value;
    });
    setStageResults(map);
    setLoading(false);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, []);

  const koTeams = new Set<string>();
  matches
    .filter((m) => m.stage && m.stage !== "groups")
    .forEach((m) => {
      if (m.home_team) koTeams.add(m.home_team);
      if (m.away_team) koTeams.add(m.away_team);
    });

  const koStages: { value: string; label: string }[] = [
    { value: "", label: "—" },
    { value: "groups", label: "הודחה בבתים" },
    { value: "r32", label: "הודחה ב-R32" },
    { value: "r16", label: "שמינית גמר (R16)" },
    { value: "qf", label: "רבע גמר" },
    { value: "sf", label: "חצי גמר" },
    { value: "final", label: "גמר" },
    { value: "winner", label: "אלופה" },
  ];

  async function updateStage(code: string, stage: string) {
    if (!stage) return;
    const { data, error } = await supabase
      .from("results")
      .upsert({ key: `stage:${code}`, value: stage })
      .select("key");
    if (error) {
      setMsg("שגיאה: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      setMsg("⚠️ נחסם — הרץ security-hardening.sql.");
      return;
    }
    setStageResults((prev) => ({ ...prev, [code]: stage }));
    setMsg(`✓ ${TEAM_BY_CODE[code]?.nameHe ?? code} → ${STAGE_LABELS_HE[stage as keyof typeof STAGE_LABELS_HE] ?? stage}`);
  }

  async function autoDetect() {
    const stageMap: Record<string, number> = {};
    const stageIdx = (s: string) => STAGE_ORDER.indexOf(s as any);
    for (const m of matches) {
      if (!m.stage || m.stage === "groups" || !m.finished) continue;
      const nextStage = STAGE_ORDER[stageIdx(m.stage) + 1];
      if (!nextStage) continue;
      const winner =
        m.home_score != null && m.away_score != null
          ? m.home_score > m.away_score
            ? m.home_team
            : m.home_score < m.away_score
              ? m.away_team
              : null
          : null;
      if (winner) {
        const cur = stageMap[winner] ?? 0;
        const next = stageIdx(nextStage);
        if (next > cur) stageMap[winner] = next;
      }
    }
    let count = 0;
    for (const [code, idx] of Object.entries(stageMap)) {
      const stage = STAGE_ORDER[idx];
      if (stageResults[code] !== stage) {
        await updateStage(code, stage);
        count++;
      }
    }
    setMsg(count > 0 ? `✓ עודכנו ${count} קבוצות אוטומטית` : "הכול כבר מעודכן");
  }

  if (loading) return <Card title="🏆 שלבי נוקאאוט"><Loading /></Card>;

  const sorted = [...koTeams].sort((a, b) => {
    const ai = STAGE_ORDER.indexOf((stageResults[a] ?? "groups") as any);
    const bi = STAGE_ORDER.indexOf((stageResults[b] ?? "groups") as any);
    return bi - ai || a.localeCompare(b);
  });

  return (
    <Card title="🏆 שלבי נוקאאוט — לאיזה שלב הגיעה כל קבוצה">
      <p className="mb-2 text-xs text-grass-500">
        קובע את נקודות ההתקדמות בנוקאאוט (10 נק' לכל שלב מ-R16+). בחר שלב לכל
        קבוצה, או לחץ "זהה אוטומטית" לעדכן לפי תוצאות שנשמרו.
      </p>
      <button onClick={autoDetect} className="btn-ghost mb-3 w-full ring-1 ring-grass-200">
        🔍 זהה אוטומטית מתוצאות המשחקים
      </button>
      {msg && <p className="mb-2 text-sm font-semibold text-grass-700">{msg}</p>}
      {sorted.length === 0 ? (
        <p className="text-sm text-grass-500">אין עדיין משחקי נוקאאוט.</p>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {sorted.map((code) => {
            const team = TEAM_BY_CODE[code];
            const cur = stageResults[code] ?? "";
            return (
              <div
                key={code}
                className={`flex items-center gap-2 rounded-2xl border p-2 text-sm ${
                  cur ? "border-grass-200 bg-grass-50/40" : "border-black/10"
                }`}
              >
                <span className="flex-1 font-bold text-grass-900">
                  {team?.flag} {team?.nameHe ?? code}
                </span>
                <select
                  value={cur}
                  onChange={(e) => updateStage(code, e.target.value)}
                  className="h-8 rounded-lg border border-black/10 px-1 text-xs"
                >
                  {koStages.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ResultsAdmin() {
  const [results, setResults] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("results").select("*");
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => (map[r.key] = r.value));
    setResults(map);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
  }, []);

  async function setResult(key: string, value: string) {
    if (!value) return;
    await supabase.from("results").upsert({ key, value });
    load();
  }

  const teamSelect = (key: string) => (
    <div className="flex items-center gap-2">
      <span className="w-28 text-sm font-bold text-grass-800">{LABELS[key]}</span>
      <select
        defaultValue={results[key] ?? ""}
        onChange={(e) => setResult(key, e.target.value)}
        className="input flex-1"
      >
        <option value="">בחר…</option>
        {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
      </select>
    </div>
  );
  const textResult = (key: string) => (
    <div className="flex items-center gap-2">
      <span className="w-28 text-sm font-bold text-grass-800">{LABELS[key]}</span>
      <input
        defaultValue={results[key] ?? ""}
        onBlur={(e) => setResult(key, e.target.value)}
        placeholder="שם השחקן"
        className="input flex-1"
      />
    </div>
  );

  return (
    <Card title="🎖️ תוצאות אמת (מפעיל חישוב ניקוד מחדש)">
      <div className="space-y-2">
        {teamSelect("champion")}
        {teamSelect("runnerUp")}
        {textResult("topScorer")}
        {textResult("secondScorer")}
        {textResult("topAssists")}
        {textResult("goldenBall")}
        {textResult("goldenGlove")}
        {teamSelect("mostGoalsTeam")}
        {teamSelect("bestDefenseTeam")}
      </div>
      <p className="mt-3 text-xs text-grass-400">
        לעדכון "לאיזה שלב הגיעה כל נבחרת" — ראו את הכרטיס "🏆 שלבי נוקאאוט" למעלה.
      </p>
    </Card>
  );
}

const LABELS: Record<string, string> = {
  champion: "אלוף",
  runnerUp: "סגנית",
  topScorer: "מלך שערים",
  secondScorer: "סגן מלך שערים",
  topAssists: "מלך בישולים",
  goldenBall: "כדור הזהב",
  goldenGlove: "כפפת הזהב",
  mostGoalsTeam: "קבוצה כובשת",
  bestDefenseTeam: "הגנה הכי טובה",
};

// עורך יחסי 1X2 ידני לכל משחק — מתקן יחסים שהתבלבלו מה-API.
// נשמר עם source='manual-fix' כך ש-fetch-odds לעולם לא ידרוס אותם שוב.
function MatchOddsEditor() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [homeDec, setHomeDec] = useState("");
  const [drawDec, setDrawDec] = useState("");
  const [awayDec, setAwayDec] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("matches")
      .select("id, ext_id, stage, home_team, away_team, kickoff, home_score, away_score, finished")
      .order("kickoff");
    const list = (data ?? []) as Match[];
    setMatches(list);
    if (matchId == null && list.length) setMatchId(list[0].id);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
  }, []);

  const selected = matches.find((m) => m.id === matchId) ?? null;

  async function save() {
    if (!selected) return;
    const h = Number(homeDec), d = Number(drawDec), a = Number(awayDec);
    if (![h, d, a].every((x) => Number.isFinite(x) && x > 1)) {
      setMsg("הזן יחס עשרוני תקין (>1) לשלושת הכיוונים, למשל 1.32 / 5.0 / 9.0");
      return;
    }
    // נרמול ההסתברויות ל-100% (הסרת מרווח הבית), שמירת היחס הגולמי
    const probs = normalizeProbabilities([probFromDecimal(h), probFromDecimal(d), probFromDecimal(a)]);
    const market = `match:${selected.ext_id ?? selected.id}`;
    const rows = [
      { option_id: "home", label: TEAM_BY_CODE[selected.home_team]?.nameHe ?? selected.home_team, prob: probs[0], decimal: h },
      { option_id: "draw", label: "Draw", prob: probs[1], decimal: d },
      { option_id: "away", label: TEAM_BY_CODE[selected.away_team]?.nameHe ?? selected.away_team, prob: probs[2], decimal: a },
    ].map((r) => ({ market, source: "manual-fix", ...r }));

    const { data, error } = await supabase
      .from("odds")
      .upsert(rows, { onConflict: "market,option_id" })
      .select("market");
    if (error) {
      setMsg("שגיאה: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      setMsg("⚠️ נחסם (אין הרשאת אדמין). הרץ את supabase/security-hardening.sql.");
      return;
    }
    setMsg(`✓ נשמרו יחסי 1X2 ל-${selected.home_team}–${selected.away_team} (מוגן מדריסה אוטומטית)`);
  }

  return (
    <Card title="🎯 תיקון יחסי 1X2 למשחק (ידני)">
      <p className="mb-2 text-xs text-grass-500">
        אם היחסים של משחק התבלבלו (למשל התיקו קיבל את היחס של הפייבוריט), הזן כאן
        את היחסים הנכונים מאתר ההימורים. הם יינעלו (source=manual-fix) כך
        שהעדכון האוטומטי לא ידרוס אותם.
      </p>
      <select
        value={matchId ?? ""}
        onChange={(e) => setMatchId(Number(e.target.value))}
        className="input mb-2"
      >
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {TEAM_BY_CODE[m.home_team]?.nameHe ?? m.home_team} – {TEAM_BY_CODE[m.away_team]?.nameHe ?? m.away_team}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-center text-xs font-bold text-grass-600">
          {selected ? TEAM_BY_CODE[selected.home_team]?.nameHe ?? selected.home_team : "בית"}
          <input value={homeDec} onChange={(e) => setHomeDec(e.target.value)} inputMode="decimal" placeholder="1.32" className="input mt-1 text-center" />
        </label>
        <label className="text-center text-xs font-bold text-grass-600">
          תיקו
          <input value={drawDec} onChange={(e) => setDrawDec(e.target.value)} inputMode="decimal" placeholder="5.00" className="input mt-1 text-center" />
        </label>
        <label className="text-center text-xs font-bold text-grass-600">
          {selected ? TEAM_BY_CODE[selected.away_team]?.nameHe ?? selected.away_team : "חוץ"}
          <input value={awayDec} onChange={(e) => setAwayDec(e.target.value)} inputMode="decimal" placeholder="9.00" className="input mt-1 text-center" />
        </label>
      </div>
      <button onClick={save} className="btn-primary mt-3 w-full">שמור יחסים (מוגן)</button>
      {msg && <p className="mt-2 text-sm font-semibold text-grass-700">{msg}</p>}
    </Card>
  );
}

// עורך יחסים ידני לשווקים שה-API לא מכסה — מזין כמה אופציות, מנרמל ל-100% ושומר.
function ManualMarketEditor() {
  const [market, setMarket] = useState("topScorer");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    // פורמט שורות: "שם, יחס_אמריקאי"  (למשל: הולנד +500)
    const entries = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        const [label, odds] = l.split(",").map((s) => s.trim());
        return { id: label || `opt${i}`, label: label || `opt${i}`, odds: Number(odds) };
      })
      .filter((e) => Number.isFinite(e.odds) && e.odds !== 0);

    if (!entries.length) {
      setMsg("הזן לפחות שורה אחת בפורמט: שם, יחס_אמריקאי");
      return;
    }
    const normalized = buildNormalizedMarket(entries, "american");
    await supabase.from("odds").delete().eq("market", market);
    await supabase.from("odds").insert(
      normalized.map((o) => ({
        market,
        option_id: o.id,
        label: o.label,
        prob: o.prob,
        source: "manual",
      })),
    );
    setMsg(`✓ נשמרו ${normalized.length} אופציות (מנורמל ל-100%)`);
  }

  return (
    <Card title="✍️ הזנת יחסים ידנית (מלך שערים / בישולים וכו')">
      <p className="mb-2 text-xs text-grass-500">
        בחר שוק, ובכל שורה כתוב: <b>שם, יחס אמריקאי</b>. למשל: <code>הרי קיין, +450</code>.
        ההסתברויות ינורמלו אוטומטית ל-100%.
      </p>
      <select value={market} onChange={(e) => setMarket(e.target.value)} className="input mb-2">
        <option value="topScorer">מלך שערים</option>
        <option value="secondScorer">סגן מלך שערים</option>
        <option value="topAssists">מלך בישולים</option>
        <option value="runnerUp">סגנית</option>
      </select>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"הרי קיין, +450\nמבאפה, +500\nחאלנד, +550"}
        className="input font-mono"
      />
      <button onClick={save} className="btn-primary mt-2 w-full">שמור יחסים (מנורמל)</button>
      {msg && <p className="mt-2 text-sm font-semibold text-grass-700">{msg}</p>}
    </Card>
  );
}

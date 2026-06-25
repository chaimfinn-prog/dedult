import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { buildNormalizedMarket, normalizeProbabilities, probFromDecimal } from "../lib/odds";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import { TEAMS, TEAM_BY_CODE, GROUPS, GROUP_LETTERS } from "../data/teams";
import { STAGE_LABELS_HE, STAGE_ORDER } from "../lib/types";
import { championFrom } from "../lib/bracketState";
import { analyzeAudit, type AuditInsight } from "../lib/audit";
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
      <PlayersAdmin />
      <MissingPicksAdmin />
      <AuditAdmin />
      <ExportPicks />
      <OddsRefresh lastUpdated={lastUpdated} />
      <MatchesAdmin />
      <MatchOddsEditor />
      <GroupStandingsAdmin />
      <ResultsAdmin />
      <ManualMarketEditor />
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

  if (loading) return <Card title="👥 משתתפים"><Loading /></Card>;

  return (
    <Card title={`👥 משתתפים (${activeCount} פעילים)`}>
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
    </Card>
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

// שינויי ניחושים מעניינים — מתוך לוג הביקורת (match_picks_audit)
function AuditAdmin() {
  const [insights, setInsights] = useState<AuditInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [audit, { data: matches }, { data: profs }] = await Promise.all([
      supabase.from("match_picks_audit").select("*").order("changed_at", { ascending: false }).limit(300),
      supabase.from("matches").select("id, home_team, away_team, kickoff, home_score, away_score, finished"),
      supabase.from("profiles").select("id, full_name"),
    ]);
    if (audit.error) {
      setErr("טבלת הביקורת עדיין לא קיימת — הרץ את security-hardening.sql.");
      setLoading(false);
      return;
    }
    const nameMap = new Map<string, string>();
    (profs ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? "אנונימי"));
    setInsights(
      analyzeAudit(
        (audit.data ?? []) as any,
        (matches ?? []) as any,
        (id) => nameMap.get(id) ?? "אנונימי",
        (c) => TEAM_BY_CODE[c]?.nameHe ?? c,
      ),
    );
    setLoading(false);
  }
  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, []);

  if (loading) return <Card title="🕵️ שינויים מעניינים"><Loading /></Card>;

  return (
    <Card title="🕵️ שינויי ניחושים מעניינים">
      <p className="mb-2 text-xs text-grass-500">
        מי ביטל ניחוש מנצח, מי החליף ברגע האחרון ופגע, ושינויים סמוך לנעילה.
      </p>
      {err ? (
        <p className="text-sm text-amber-600">{err}</p>
      ) : insights.length === 0 ? (
        <p className="text-sm text-grass-500">
          עדיין אין שינויים מתועדים. הלוג מתחיל לתעד מרגע הרצת security-hardening.sql.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {insights.slice(0, 40).map((it, i) => (
            <li
              key={i}
              className={`rounded-2xl border p-2 text-sm ${
                it.kind === "dropped_winner"
                  ? "border-red-200 bg-red-50/40"
                  : it.kind === "switched_to_winner"
                    ? "border-grass-200 bg-grass-50/40"
                    : "border-black/10"
              }`}
            >
              {it.note}
            </li>
          ))}
        </ul>
      )}
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
  const [msg, setMsg] = useState<string | null>(null);

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
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl bg-grass-50 p-3 sm:grid-cols-4">
        <select value={home} onChange={(e) => setHome(e.target.value)} className="input">
          {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
        </select>
        <select value={away} onChange={(e) => setAway(e.target.value)} className="input">
          {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
        </select>
        <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="input" />
        <button onClick={addMatch} className="btn-primary">הוסף משחק</button>
      </div>

      {msg && <p className="mb-2 text-sm font-semibold text-grass-700">{msg}</p>}

      <div className="space-y-2">
        {matches.map((m) => (
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

  async function handle(finished: boolean) {
    setStatus("saving");
    const r = await onSave(match, hs, as, finished);
    setStatus(r.ok ? "saved" : "err");
    if (r.ok) setTimeout(() => setStatus("idle"), 2000);
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
      <input type="number" min={0} value={hs} onChange={(e) => setHs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
      <span>:</span>
      <input type="number" min={0} value={as} onChange={(e) => setAs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
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

function ResultsAdmin() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [stageTeam, setStageTeam] = useState("ARG");
  const [stageVal, setStageVal] = useState("winner");

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

      <h3 className="mt-4 mb-2 text-sm font-extrabold text-grass-800">שלב סופי של נבחרת</h3>
      <div className="flex items-center gap-2">
        <select value={stageTeam} onChange={(e) => setStageTeam(e.target.value)} className="input flex-1">
          {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.nameHe}</option>)}
        </select>
        <select value={stageVal} onChange={(e) => setStageVal(e.target.value)} className="input flex-1">
          {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABELS_HE[s]}</option>)}
        </select>
        <button onClick={() => setResult(`stage:${stageTeam}`, stageVal)} className="btn-ghost text-xs">שמור</button>
      </div>
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

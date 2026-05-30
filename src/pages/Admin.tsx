import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { buildNormalizedMarket } from "../lib/odds";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import { TEAMS, TEAM_BY_CODE } from "../data/teams";
import { STAGE_LABELS_HE, STAGE_ORDER } from "../lib/types";

interface Match {
  id: number;
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
      <OddsRefresh lastUpdated={lastUpdated} />
      <MatchesAdmin />
      <ResultsAdmin />
      <ManualMarketEditor />
    </div>
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-odds", {
        method: "POST",
      });
      if (error) throw error;
      setMsg(`✓ עודכנו ${data?.upserted ?? 0} יחסים`);
    } catch (e) {
      setMsg("שגיאה ברענון — בדוק שה-Edge Function פרוס ושמפתח ה-API מוגדר.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="🔄 יחסים (Odds)">
      <p className="mb-3 text-sm text-grass-500">
        עדכון אחרון:{" "}
        {lastUpdated
          ? new Date(lastUpdated).toLocaleString("he-IL")
          : "טרם נמשכו יחסים"}
      </p>
      <button onClick={refresh} disabled={busy} className="btn-primary w-full">
        {busy ? "מרענן…" : "רענן יחסים עכשיו"}
      </button>
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
    await supabase.from("matches").insert({
      home_team: home,
      away_team: away,
      kickoff: new Date(kickoff).toISOString(),
    });
    setKickoff("");
    load();
  }

  async function saveResult(m: Match, hs: number, as: number, finished: boolean) {
    await supabase
      .from("matches")
      .update({ home_score: hs, away_score: as, finished })
      .eq("id", m.id);
    load();
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
  onSave: (m: Match, hs: number, as: number, finished: boolean) => void;
}) {
  const [hs, setHs] = useState(match.home_score ?? 0);
  const [as, setAs] = useState(match.away_score ?? 0);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 p-2 text-sm">
      <span className="flex-1 font-bold text-grass-900">
        {TEAM_BY_CODE[match.home_team]?.nameHe} – {TEAM_BY_CODE[match.away_team]?.nameHe}
      </span>
      <input type="number" min={0} value={hs} onChange={(e) => setHs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
      <span>:</span>
      <input type="number" min={0} value={as} onChange={(e) => setAs(+e.target.value)} className="h-9 w-12 rounded-lg border border-black/10 text-center" />
      <button onClick={() => onSave(match, hs, as, true)} className="btn-ghost text-xs">
        {match.finished ? "עדכן" : "סיים"}
      </button>
    </div>
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
};

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
        updated_at: new Date().toISOString(),
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

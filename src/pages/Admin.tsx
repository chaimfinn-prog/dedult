import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import Loading from "../components/Loading";
import { TEAM_BY_CODE } from "../data/teams";
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

export default function Admin() {
  const { isAdmin } = useAuth();

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
      <div className="card p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
        🏆 הטורניר הסתיים — כל עדכון מתבצע ישירות ב-Supabase
      </div>
      <FunStatsAdmin />
      <MissingPicksAdmin />
      <ExportPicks />
    </div>
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


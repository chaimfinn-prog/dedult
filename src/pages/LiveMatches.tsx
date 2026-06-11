import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import Flag from "../components/Flag";
import { potentialDirectionPoints } from "../lib/scoring";
import { exactBonusFor } from "../lib/matchOdds";
import { MATCH_LOCK_MINUTES_BEFORE } from "../config";
import { TEAM_BY_CODE } from "../data/teams";
import {
  DIRECTION_LABELS_HE,
  type Direction,
  type MarketOption,
} from "../lib/types";

interface Match {
  id: number;
  ext_id: string | null;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
  live: boolean;
  finished: boolean;
}
interface Pick {
  direction: Direction;
  pred_home: number;
  pred_away: number;
}
interface ProfileLite {
  name: string;
  avatar: string | null;
}

const EQUAL: MarketOption[] = [
  { id: "home", label: "בית", prob: 1 / 3 },
  { id: "draw", label: "תיקו", prob: 1 / 3 },
  { id: "away", label: "חוץ", prob: 1 / 3 },
];

export interface RevealRow extends Pick {
  user_id: string;
  match_id: number;
}

export default function LiveMatches() {
  const { user } = useAuth();
  const { loading: oddsLoading, market } = useOdds();
  const [matches, setMatches] = useState<Match[]>([]);
  const [picks, setPicks] = useState<Record<number, Pick>>({});
  const [revealed, setRevealed] = useState<RevealRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }
      const [{ data: m }, reveal, { data: profs }] = await Promise.all([
        supabase.from("matches").select("*").order("kickoff"),
        supabase.rpc("reveal_match_picks"), // חשוף רק אחרי שריקת הפתיחה
        supabase.from("profiles").select("id, full_name, avatar_url"),
      ]);
      if (!alive) return;
      setMatches((m ?? []) as Match[]);

      const rows = (reveal.data ?? []) as RevealRow[];
      setRevealed(rows);

      // הניחושים שלי (תמיד מגיעים ב-reveal)
      const map: Record<number, Pick> = {};
      rows
        .filter((r) => r.user_id === user.id)
        .forEach((r) => {
          map[r.match_id] = {
            direction: r.direction,
            pred_home: r.pred_home,
            pred_away: r.pred_away,
          };
        });
      setPicks(map);

      const pm: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p: any) => {
        pm[p.id] = { name: p.full_name ?? "אנונימי", avatar: p.avatar_url };
      });
      setProfiles(pm);

      setLoading(false);
    }
    refresh();
    // רענון אוטומטי כל 60 שניות — תוצאות חיות מתעדכנות מאליהן
    const t = setInterval(refresh, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user]);

  const revealedByMatch = useMemo(() => {
    const out: Record<number, RevealRow[]> = {};
    for (const r of revealed) (out[r.match_id] ??= []).push(r);
    return out;
  }, [revealed]);

  if (loading || oddsLoading) return <Loading />;

  if (matches.length === 0) {
    return (
      <div className="card animate-fade-up p-6 text-center">
        <div className="mb-2 text-4xl">⚽</div>
        <h2 className="text-lg font-extrabold text-grass-900">עדיין אין משחקים</h2>
        <p className="mt-1 text-sm text-grass-500">
          המשחקים יתווספו ע"י האדמין לקראת הטורניר. כל ניחוש משחק נסגר עם
          שריקת הפתיחה שלו.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">משחקים</h1>
      {matches.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          pick={picks[m.id]}
          marketOptions={market(`match:${m.ext_id ?? m.id}`)}
          revealed={revealedByMatch[m.id] ?? []}
          profiles={profiles}
          meId={user?.id}
          onSave={(pick) => setPicks((prev) => ({ ...prev, [m.id]: pick }))}
        />
      ))}
    </div>
  );
}

function MatchCard({
  match,
  pick,
  marketOptions,
  revealed,
  profiles,
  meId,
  onSave,
}: {
  match: Match;
  pick?: Pick;
  marketOptions: MarketOption[];
  revealed: RevealRow[];
  profiles: Record<string, ProfileLite>;
  meId?: string;
  onSave: (p: Pick) => void;
}) {
  const { user } = useAuth();
  const home = TEAM_BY_CODE[match.home_team];
  const away = TEAM_BY_CODE[match.away_team];

  // דדליין: נסגר MATCH_LOCK_MINUTES_BEFORE דקות לפני שריקת הפתיחה
  const lockTime =
    new Date(match.kickoff).getTime() - MATCH_LOCK_MINUTES_BEFORE * 60_000;
  const locked = match.finished || match.live || Date.now() >= lockTime;
  // המשחק התחיל (שריקת הפתיחה) — מכאן ניחושי החברים נחשפים
  const started =
    match.finished || match.live || Date.now() >= new Date(match.kickoff).getTime();

  const probOf = useMemo(() => {
    const src = marketOptions.length ? marketOptions : EQUAL;
    return (d: Direction) => src.find((o) => o.id === d)?.prob ?? 1 / 3;
  }, [marketOptions]);

  const [h, setH] = useState(pick?.pred_home ?? 0);
  const [a, setA] = useState(pick?.pred_away ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // הכיוון נגזר אוטומטית מהתוצאה שהוזנה — המשתמש מזין רק תוצאה
  const dir: Direction = h > a ? "home" : h < a ? "away" : "draw";
  const dirPts = potentialDirectionPoints(probOf(dir));
  // בונוס התוצאה המדויקת הנוכחית (לפי נדירות התוצאה — מודל הפואסון)
  const exactBonus = useMemo(
    () => exactBonusFor(probOf("home"), probOf("draw"), probOf("away"), h, a),
    [probOf, h, a],
  );

  async function save() {
    if (!user || locked) return;
    setSaving(true);
    await supabase.from("match_picks").upsert({
      user_id: user.id,
      match_id: match.id,
      direction: dir,
      pred_home: h,
      pred_away: a,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave({ direction: dir, pred_home: h, pred_away: a });
  }

  const kickoffStr = new Date(match.kickoff).toLocaleString("he-IL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-grass-50/60 px-4 py-2 text-xs font-bold text-grass-600">
        <span>{kickoffStr}</span>
        {match.live ? (
          <span className="chip animate-pulse bg-red-500/15 text-red-600">
            🔴 חי <Score h={match.home_score} a={match.away_score} />
          </span>
        ) : match.finished ? (
          <span className="chip bg-black/5 text-grass-700">
            הסתיים <Score h={match.home_score} a={match.away_score} />
          </span>
        ) : locked ? (
          <span className="chip bg-black/5 text-grass-700">🔒 ננעל</span>
        ) : (
          <span className="chip bg-grass-100 text-grass-700">פתוח לניחוש</span>
        )}
      </div>

      {/* שורת קבוצות — LTR קבוע (בית משמאל, חוץ מימין) למניעת בלבול RTL */}
      <div dir="ltr" className="flex items-center justify-center gap-4 px-4 py-4">
        <TeamSide name={home?.nameHe ?? match.home_team} code={match.home_team} sub="בית" />
        <div className="text-lg font-black text-grass-400">VS</div>
        <TeamSide name={away?.nameHe ?? match.away_team} code={match.away_team} sub="חוץ" />
      </div>

      {/* יחסי 1X2 — כמה נקודות על כל כיוון (לפי אתרי ההימורים) */}
      <div className="px-4">
        <OddsRow
          home={home?.nameHe ?? match.home_team}
          away={away?.nameHe ?? match.away_team}
          probOf={probOf}
          activeDir={dir}
        />
      </div>

      {/* תוצאה מדויקת בלבד — הכיוון נגזר אוטומטית (LTR: בית משמאל) */}
      <div dir="ltr" className="mt-3 flex items-center justify-center gap-3 px-4">
        <ScoreInput value={h} onChange={setH} disabled={locked} />
        <span className="text-xl font-black text-grass-400">:</span>
        <ScoreInput value={a} onChange={setA} disabled={locked} />
      </div>

      {/* תצוגת הניקוד הצפוי: כיוון + בונוס דינמי לפי נדירות התוצאה */}
      <div className="mt-3 px-4 text-center text-xs">
        <span className="chip bg-grass-100 text-grass-700">
          {DIRECTION_LABELS_HE[dir]} ≈ {dirPts} נק'
        </span>{" "}
        <span className="chip bg-accent-400/15 text-accent-600">
          תוצאה מדויקת +{exactBonus} בונוס
        </span>
        <div className="mt-1 font-bold text-grass-700">
          סה"כ אם תפגע במדויק: {dirPts + exactBonus} נק'
        </div>
      </div>

      {!locked ? (
        <div className="p-4">
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "שומר…" : saved ? "✓ נשמר!" : "שמירת ניחוש"}
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold text-grass-400">
            ⏱️ ניתן לנחש עד {MATCH_LOCK_MINUTES_BEFORE} דקות לפני שריקת הפתיחה
          </p>
        </div>
      ) : (
        pick && (
          <p className="px-4 pt-1 text-center text-xs font-bold text-grass-600">
            הניחוש שלך: <Score h={pick.pred_home} a={pick.pred_away} />
          </p>
        )
      )}

      <RevealSection
        started={started}
        revealed={revealed}
        profiles={profiles}
        meId={meId}
      />
    </div>
  );
}

// "מה כולם ניחשו" — נחשף רק אחרי שריקת הפתיחה של המשחק (גם בצד השרת).
function RevealSection({
  started,
  revealed,
  profiles,
  meId,
}: {
  started: boolean;
  revealed: RevealRow[];
  profiles: Record<string, ProfileLite>;
  meId?: string;
}) {
  const [open, setOpen] = useState(false);
  // ניחושים של אחרים (לא שלי) — מגיעים מה-RPC רק אם המשחק התחיל
  const others = revealed.filter((r) => r.user_id !== meId);

  if (!started) {
    return (
      <div className="border-t border-black/5 bg-grass-50/40 px-4 py-2 text-center text-[11px] font-semibold text-grass-400">
        🔒 ניחושי החברים ייחשפו עם שריקת הפתיחה
      </div>
    );
  }
  if (others.length === 0) return null;

  return (
    <div className="border-t border-black/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-grass-50/40 px-4 py-2 text-xs font-bold text-grass-700"
      >
        <span>👥 מה {others.length} החברים ניחשו</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="divide-y divide-black/5">
          {others.map((r) => {
            const p = profiles[r.user_id];
            return (
              <li key={r.user_id} className="flex items-center gap-2 px-4 py-1.5 text-sm">
                {p?.avatar ? (
                  <img src={p.avatar} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-grass-100 text-xs font-bold text-grass-700">
                    {(p?.name ?? "?")[0]}
                  </span>
                )}
                <span className="flex-1 truncate font-semibold text-grass-800">
                  {p?.name ?? "אנונימי"}
                </span>
                <span className="chip bg-grass-100 text-grass-700">
                  <Score h={r.pred_home} a={r.pred_away} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TeamSide({ name, code, sub }: { name: string; code: string; sub?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <Flag code={code} size={48} />
      <span className="text-sm font-extrabold text-grass-900">{name}</span>
      {sub && <span className="text-[10px] font-bold text-grass-400">{sub}</span>}
    </div>
  );
}

/** שורת יחסי 1X2 — מציגה לכל כיוון את אחוז הסיכוי ואת הנקודות אם יצדיק */
function OddsRow({
  home,
  away,
  probOf,
  activeDir,
}: {
  home: string;
  away: string;
  probOf: (d: Direction) => number;
  activeDir: Direction;
}) {
  const cells: { dir: Direction; label: string }[] = [
    { dir: "home", label: `ניצחון ${home}` },
    { dir: "draw", label: "תיקו" },
    { dir: "away", label: `ניצחון ${away}` },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cells.map((c) => {
        const p = probOf(c.dir);
        const pts = potentialDirectionPoints(p);
        const active = c.dir === activeDir;
        return (
          <div
            key={c.dir}
            className={[
              "rounded-xl border p-2 text-center transition",
              active
                ? "border-grass-400 bg-grass-50 ring-1 ring-grass-300"
                : "border-black/10",
            ].join(" ")}
          >
            <div className="truncate text-[11px] font-bold text-grass-700">
              {c.label}
            </div>
            <div className="text-base font-black text-grass-900">{pts}</div>
            <div className="text-[10px] font-semibold text-grass-400">
              נק' · {(p * 100).toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** תצוגת תוצאה עקבית LTR: בית:חוץ — נמנע מהיפוך RTL */
function Score({ h, a }: { h: number | null; a: number | null }) {
  return (
    <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {h ?? 0}:{a ?? 0}
    </span>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="h-14 w-14 rounded-2xl border border-black/10 text-center text-2xl font-black text-grass-900 outline-none focus:border-grass-500 focus:ring-2 focus:ring-grass-200 disabled:opacity-60"
    />
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import { potentialDirectionPoints } from "../lib/scoring";
import { EXACT_SCORE_BONUS } from "../config";
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

const EQUAL: MarketOption[] = [
  { id: "home", label: "בית", prob: 1 / 3 },
  { id: "draw", label: "תיקו", prob: 1 / 3 },
  { id: "away", label: "חוץ", prob: 1 / 3 },
];

export default function LiveMatches() {
  const { user } = useAuth();
  const { loading: oddsLoading, market } = useOdds();
  const [matches, setMatches] = useState<Match[]>([]);
  const [picks, setPicks] = useState<Record<number, Pick>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from("matches").select("*").order("kickoff"),
        supabase.from("match_picks").select("*").eq("user_id", user.id),
      ]);
      if (!alive) return;
      setMatches((m ?? []) as Match[]);
      const map: Record<number, Pick> = {};
      (p ?? []).forEach((row: any) => {
        map[row.match_id] = {
          direction: row.direction,
          pred_home: row.pred_home,
          pred_away: row.pred_away,
        };
      });
      setPicks(map);
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
  onSave,
}: {
  match: Match;
  pick?: Pick;
  marketOptions: MarketOption[];
  onSave: (p: Pick) => void;
}) {
  const { user } = useAuth();
  const locked = match.finished || Date.now() >= new Date(match.kickoff).getTime();
  const home = TEAM_BY_CODE[match.home_team];
  const away = TEAM_BY_CODE[match.away_team];

  const probOf = useMemo(() => {
    const src = marketOptions.length ? marketOptions : EQUAL;
    return (d: Direction) => src.find((o) => o.id === d)?.prob ?? 1 / 3;
  }, [marketOptions]);

  const [dir, setDir] = useState<Direction | "">(pick?.direction ?? "");
  const [h, setH] = useState(pick?.pred_home ?? 0);
  const [a, setA] = useState(pick?.pred_away ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // כיוון ניגזר אוטומטית מהתוצאה המדויקת אם הוזנה
  const derivedDir: Direction = h > a ? "home" : h < a ? "away" : "draw";
  const effectiveDir = (dir || derivedDir) as Direction;

  async function save() {
    if (!user || locked) return;
    setSaving(true);
    await supabase.from("match_picks").upsert({
      user_id: user.id,
      match_id: match.id,
      direction: effectiveDir,
      pred_home: h,
      pred_away: a,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave({ direction: effectiveDir, pred_home: h, pred_away: a });
  }

  const kickoffStr = new Date(match.kickoff).toLocaleString("he-IL", {
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
            🔴 חי {match.home_score}:{match.away_score}
          </span>
        ) : match.finished ? (
          <span className="chip bg-black/5 text-grass-700">
            הסתיים {match.home_score}:{match.away_score}
          </span>
        ) : locked ? (
          <span className="chip bg-black/5 text-grass-700">🔒 ננעל</span>
        ) : (
          <span className="chip bg-grass-100 text-grass-700">פתוח לניחוש</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-4">
        <TeamSide name={home?.nameHe ?? match.home_team} flag={home?.flag} />
        <div className="text-lg font-black text-grass-400">VS</div>
        <TeamSide name={away?.nameHe ?? match.away_team} flag={away?.flag} />
      </div>

      {/* בחירת כיוון 1X2 */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {(["home", "draw", "away"] as Direction[]).map((d) => {
          const pts = potentialDirectionPoints(probOf(d));
          const active = effectiveDir === d;
          return (
            <button
              key={d}
              disabled={locked}
              onClick={() => setDir(d)}
              className={[
                "rounded-2xl border p-2.5 text-center transition disabled:opacity-60",
                active
                  ? "border-grass-500 bg-grass-50 ring-2 ring-grass-300"
                  : "border-black/10 hover:bg-grass-50/50",
              ].join(" ")}
            >
              <div className="text-sm font-bold text-grass-900">
                {DIRECTION_LABELS_HE[d]}
              </div>
              <div className="text-[11px] font-semibold text-grass-500">
                {(probOf(d) * 100).toFixed(0)}% · {pts} נק'
              </div>
            </button>
          );
        })}
      </div>

      {/* תוצאה מדויקת */}
      <div className="mt-3 flex items-center justify-center gap-3 px-4">
        <ScoreInput value={h} onChange={setH} disabled={locked} />
        <span className="text-xl font-black text-grass-400">:</span>
        <ScoreInput value={a} onChange={setA} disabled={locked} />
        <span className="text-xs font-semibold text-accent-600">
          תוצאה מדויקת = +{EXACT_SCORE_BONUS} בונוס
        </span>
      </div>

      {!locked && (
        <div className="p-4">
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "שומר…" : saved ? "✓ נשמר!" : "שמירת ניחוש"}
          </button>
        </div>
      )}
    </div>
  );
}

function TeamSide({ name, flag }: { name: string; flag?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <span className="text-3xl">{flag ?? "🏳️"}</span>
      <span className="text-sm font-extrabold text-grass-900">{name}</span>
    </div>
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

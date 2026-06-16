import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import Flag from "../components/Flag";
import { directionPointsFromDecimal } from "../lib/scoring";
import { exactBonusFor } from "../lib/matchOdds";
import { MATCH_LOCK_MINUTES_BEFORE } from "../config";
import { TEAM_BY_CODE } from "../data/teams";
import type { RevealedGeneral } from "../lib/social";
import {
  buildMatchShareText,
  relevantGeneralForMatch,
  type RelevantPickLine,
} from "../lib/matchSocial";
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
  const [general, setGeneral] = useState<RevealedGeneral[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const todayRef = useRef<HTMLDivElement | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }
      const [{ data: m }, reveal, gen, { data: profs }] = await Promise.all([
        supabase.from("matches").select("*").order("kickoff"),
        supabase.rpc("reveal_match_picks"), // חשוף רק אחרי שריקת הפתיחה
        supabase.rpc("reveal_general_picks"), // לקישור ניחושים כלליים למשחק
        supabase.from("profiles").select("id, full_name, avatar_url"),
      ]);
      if (!alive) return;
      setMatches((m ?? []) as Match[]);
      setGeneral((gen.data ?? []) as RevealedGeneral[]);

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
      setLastSync(new Date());
      setLoading(false);
    }
    refresh();
    // רענון אוטומטי כל 30 שניות — תוצאות חיות מתעדכנות מאליהן
    const t = setInterval(refresh, 30_000);
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

  const nameOf = (id: string) => profiles[id]?.name ?? "אנונימי";

  // משחקים פעילים/עתידיים מול ארכיון (משחקים שהסתיימו)
  const upcoming = useMemo(() => matches.filter((m) => !m.finished), [matches]);
  const archive = useMemo(
    () => matches.filter((m) => m.finished).reverse(), // האחרון שהסתיים למעלה
    [matches],
  );
  // "משחק היום" — הראשון ששודר חי, אחרת הקרוב הבא; אליו נגלול אוטומטית
  const todayId = (upcoming.find((m) => m.live) ?? upcoming[0])?.id ?? null;

  // גלילה אוטומטית למשחק של היום בכניסה (פעם אחת)
  useEffect(() => {
    if (loading || scrolledRef.current || !todayRef.current) return;
    todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    scrolledRef.current = true;
  }, [loading, todayId]);

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

  const anyLive = matches.some((m) => m.live);

  const renderCard = (m: Match) => (
    <MatchCard
      key={m.id}
      match={m}
      pick={picks[m.id]}
      marketOptions={market(`match:${m.ext_id ?? m.id}`)}
      revealed={revealedByMatch[m.id] ?? []}
      general={general}
      nameOf={nameOf}
      profiles={profiles}
      meId={user?.id}
      onSave={(pick) => setPicks((prev) => ({ ...prev, [m.id]: pick }))}
    />
  );

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-extrabold text-grass-900">משחקים</h1>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-grass-400">
          {anyLive && (
            <span className="inline-flex items-center gap-1 text-red-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              שידור חי
            </span>
          )}
          {lastSync && (
            <span>
              עודכן{" "}
              {lastSync.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </span>
      </div>

      {upcoming.length === 0 && (
        <p className="card p-5 text-center text-sm text-grass-500">
          אין כרגע משחקים קרובים — כל המשחקים בארכיון למטה. 👇
        </p>
      )}

      {upcoming.map((m) =>
        m.id === todayId ? (
          <div key={m.id} ref={todayRef} className="scroll-mt-4">
            {renderCard(m)}
          </div>
        ) : (
          renderCard(m)
        ),
      )}

      {archive.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowArchive((s) => !s)}
            className="flex w-full items-center justify-between rounded-2xl bg-grass-50 px-4 py-3 text-sm font-extrabold text-grass-700"
          >
            <span>📁 ארכיון משחקים ({archive.length})</span>
            <span>{showArchive ? "הסתר ▲" : "הצג ▼"}</span>
          </button>
          {showArchive && (
            <div className="mt-3 space-y-3">{archive.map((m) => renderCard(m))}</div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  pick,
  marketOptions,
  revealed,
  general,
  nameOf,
  profiles,
  meId,
  onSave,
}: {
  match: Match;
  pick?: Pick;
  marketOptions: MarketOption[];
  revealed: RevealRow[];
  general: RevealedGeneral[];
  nameOf: (id: string) => string;
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

  // היחס העשרוני הגולמי מאתר ההימורים (אם נשמר); אחרת נגזר מההסתברות
  const decimalOf = useMemo(() => {
    const src = marketOptions.length ? marketOptions : EQUAL;
    return (d: Direction) => {
      const o = src.find((x) => x.id === d);
      if (o?.decimal && o.decimal > 1) return o.decimal;
      return 1 / (o?.prob ?? 1 / 3);
    };
  }, [marketOptions]);

  const [h, setH] = useState(pick?.pred_home ?? 0);
  const [a, setA] = useState(pick?.pred_away ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // הכיוון נגזר אוטומטית מהתוצאה שהוזנה — המשתמש מזין רק תוצאה
  const dir: Direction = h > a ? "home" : h < a ? "away" : "draw";
  const dirPts = directionPointsFromDecimal(decimalOf(dir));
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
      direction: dir, // השרת גוזר מחדש מהתוצאה — נשלח רק לנוחות
      pred_home: h,
      pred_away: a,
      // updated_at נקבע בשרת (טריגר) — לא נשלח מהלקוח
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
          <span className="chip animate-pulse bg-red-500/15 text-red-600">🔴 חי עכשיו</span>
        ) : match.finished ? (
          <span className="chip bg-black/5 text-grass-700">הסתיים</span>
        ) : locked ? (
          <span className="chip bg-black/5 text-grass-700">🔒 ננעל</span>
        ) : (
          <span className="chip bg-grass-100 text-grass-700">פתוח לניחוש</span>
        )}
      </div>

      {/* קבוצות + תוצאה: כל ניקוד מתחת לדגל של אותה קבוצה (בלי בלבול RTL) */}
      <div className="flex items-stretch justify-center gap-2 px-4 py-4">
        <TeamSide
          name={home?.nameHe ?? match.home_team}
          code={match.home_team}
          score={match.live || match.finished ? match.home_score : null}
        />
        <div className="flex flex-col items-center justify-center px-1">
          {match.live || match.finished ? (
            <span className="text-[10px] font-bold text-grass-400">
              {match.live ? "חי" : "סופי"}
            </span>
          ) : (
            <span className="text-lg font-black text-grass-300">VS</span>
          )}
        </div>
        <TeamSide
          name={away?.nameHe ?? match.away_team}
          code={match.away_team}
          score={match.live || match.finished ? match.away_score : null}
        />
      </div>

      {/* יחסי 1X2 — כמה נקודות על כל כיוון (לפי אתרי ההימורים / API) */}
      <div className="px-4">
        <OddsRow
          home={home?.nameHe ?? match.home_team}
          away={away?.nameHe ?? match.away_team}
          probOf={probOf}
          decimalOf={decimalOf}
          activeDir={dir}
          hasOdds={marketOptions.length > 0}
        />
      </div>

      {/* ניחוש תוצאה — כל שדה מתחת לקבוצה שלו (בלי נקודתיים / היפוך) */}
      <div className="mt-3 flex items-start justify-center gap-2 px-4">
        <PredictInput
          teamName={home?.nameHe ?? match.home_team}
          value={h}
          onChange={setH}
          disabled={locked}
        />
        <div className="px-1 pt-7 text-lg font-black text-grass-300">-</div>
        <PredictInput
          teamName={away?.nameHe ?? match.away_team}
          value={a}
          onChange={setA}
          disabled={locked}
        />
      </div>

      {/* תצוגת הניקוד הצפוי — רק כשיש יחסים אמיתיים מה-API */}
      {marketOptions.length > 0 && (
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
      )}

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
            הניחוש שלך:{" "}
            <ScoreLine
              home={home?.nameHe ?? match.home_team}
              away={away?.nameHe ?? match.away_team}
              h={pick.pred_home}
              a={pick.pred_away}
            />
          </p>
        )
      )}

      <RevealSection
        started={started}
        revealed={revealed}
        general={general}
        nameOf={nameOf}
        profiles={profiles}
        meId={meId}
        actual={
          match.live || match.finished
            ? { h: match.home_score ?? 0, a: match.away_score ?? 0 }
            : null
        }
        homeName={home?.nameHe ?? match.home_team}
        awayName={away?.nameHe ?? match.away_team}
        homeCode={match.home_team}
        awayCode={match.away_team}
        kickoffLabel={kickoffStr}
      />
    </div>
  );
}

// "מה כולם ניחשו" — נחשף רק אחרי שריקת הפתיחה של המשחק (גם בצד השרת).
function RevealSection({
  started,
  revealed,
  general,
  nameOf,
  profiles,
  meId,
  actual,
  homeName,
  awayName,
  homeCode,
  awayCode,
  kickoffLabel,
}: {
  started: boolean;
  revealed: RevealRow[];
  general: RevealedGeneral[];
  nameOf: (id: string) => string;
  profiles: Record<string, ProfileLite>;
  meId?: string;
  actual: { h: number; a: number } | null;
  homeName: string;
  awayName: string;
  homeCode: string;
  awayCode: string;
  kickoffLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // ניחושים של אחרים (לא שלי) — מגיעים מה-RPC רק אם המשחק התחיל
  const others = revealed.filter((r) => r.user_id !== meId);
  // ניחושים כלליים שקשורים לשתי הקבוצות (אלוף / מלך שערים מהקבוצות וכו')
  const relevant: RelevantPickLine[] = relevantGeneralForMatch(
    general,
    nameOf,
    homeCode,
    awayCode,
  );

  if (!started) {
    return (
      <div className="border-t border-black/5 bg-grass-50/40 px-4 py-2 text-center text-[11px] font-semibold text-grass-400">
        🔒 ניחושי החברים ייחשפו עם שריקת הפתיחה
      </div>
    );
  }
  if (others.length === 0 && relevant.length === 0) return null;

  // סטטיסטיקה: פילוח כיוונים + התוצאה הנפוצה ביותר
  const dirCount = { home: 0, draw: 0, away: 0 };
  const scoreCount: Record<string, number> = {};
  for (const r of revealed) {
    const d = r.pred_home > r.pred_away ? "home" : r.pred_home < r.pred_away ? "away" : "draw";
    dirCount[d]++;
    const key = `${r.pred_home}-${r.pred_away}`;
    scoreCount[key] = (scoreCount[key] ?? 0) + 1;
  }
  const topScore = Object.entries(scoreCount).sort((a, b) => b[1] - a[1])[0];
  const totalDir = revealed.length || 1;

  const dirOf = (r: RevealRow) =>
    r.pred_home > r.pred_away ? "home" : r.pred_home < r.pred_away ? "away" : "draw";
  const actualDir = actual
    ? actual.h > actual.a ? "home" : actual.h < actual.a ? "away" : "draw"
    : null;

  const shareText = buildMatchShareText({
    homeName,
    awayName,
    kickoffLabel,
    picks: revealed,
    nameOf,
    relevant,
    actual,
  });
  function shareWhatsapp() {
    window.open(
      "https://wa.me/?text=" + encodeURIComponent(shareText),
      "_blank",
      "noopener,noreferrer",
    );
  }
  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* התעלמות — דפדפנים מסוימים חוסמים clipboard */
    }
  }

  return (
    <div className="border-t border-black/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-grass-50/40 px-4 py-2 text-xs font-bold text-grass-700"
      >
        <span>👥 מה {others.length} החברים ניחשו + סטטיסטיקה</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div>
          {/* שיתוף סיכום המשחק */}
          <div className="flex gap-2 px-4 pb-1 pt-2">
            <button
              onClick={shareWhatsapp}
              className="flex-1 rounded-xl bg-[#25D366] py-2 text-xs font-extrabold text-white"
            >
              שתף לוואטסאפ 💬
            </button>
            <button
              onClick={copyText}
              className="rounded-xl bg-grass-100 px-3 py-2 text-xs font-bold text-grass-700"
            >
              {copied ? "✓ הועתק" : "העתק 📋"}
            </button>
          </div>
          {/* סטטיסטיקת כיוונים */}
          {revealed.length > 0 && (
            <div className="grid grid-cols-3 gap-1 bg-grass-50/40 px-4 py-2 text-center text-[11px] font-bold">
              <div className="rounded-lg bg-white py-1 text-grass-700">
                {homeName}<br />
                <span className="text-base">{Math.round((dirCount.home / totalDir) * 100)}%</span>
              </div>
              <div className="rounded-lg bg-white py-1 text-grass-700">
                תיקו<br />
                <span className="text-base">{Math.round((dirCount.draw / totalDir) * 100)}%</span>
              </div>
              <div className="rounded-lg bg-white py-1 text-grass-700">
                {awayName}<br />
                <span className="text-base">{Math.round((dirCount.away / totalDir) * 100)}%</span>
              </div>
            </div>
          )}
          {topScore && (
            <p className="px-4 py-1 text-center text-[11px] text-grass-500">
              התוצאה הכי מנוחשת:{" "}
              <b className="text-grass-800">{topScore[0].replace("-", " - ")}</b>{" "}
              ({topScore[1]} חברים)
            </p>
          )}
          <ul className="divide-y divide-black/5">
            {others.map((r) => {
              const p = profiles[r.user_id];
              const exactHit = actual && r.pred_home === actual.h && r.pred_away === actual.a;
              const dirHit = actual && dirOf(r) === actualDir;
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
                  {exactHit && <span className="chip bg-accent-400/20 text-accent-600">🎯 בינגו</span>}
                  {!exactHit && dirHit && <span className="chip bg-grass-100 text-grass-600">✓ כיוון</span>}
                  <ScoreLine home={homeName} away={awayName} h={r.pred_home} a={r.pred_away} />
                </li>
              );
            })}
          </ul>

          {/* ניחושים כלליים שקשורים למשחק הזה (אלוף / מלך שערים מהקבוצות וכו') */}
          {relevant.length > 0 && (
            <div className="border-t border-black/5 bg-grass-50/30 px-4 py-2">
              <div className="mb-1 text-[11px] font-extrabold text-grass-600">
                🔮 ניחושים כלליים שקשורים למשחק
              </div>
              <ul className="space-y-1">
                {relevant.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-[12px]"
                  >
                    <span className="truncate text-grass-700">
                      {r.emoji} <b className="text-grass-900">{r.who}</b> · {r.category}
                    </span>
                    <span className="shrink-0 font-bold text-grass-800">{r.what}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TeamSide({
  name,
  code,
  score,
}: {
  name: string;
  code: string;
  score?: number | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <Flag code={code} size={44} />
      <span className="text-sm font-extrabold leading-tight text-grass-900">{name}</span>
      {score != null && (
        <span className="text-3xl font-black leading-none text-grass-800">{score}</span>
      )}
    </div>
  );
}

/** שדה ניחוש תוצאה לקבוצה אחת — שם הקבוצה מעל, מספר מתחת (בלי בלבול RTL) */
function PredictInput({
  teamName,
  value,
  onChange,
  disabled,
}: {
  teamName: string;
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="max-w-[90px] truncate text-[11px] font-bold text-grass-600">
        {teamName}
      </span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-14 w-14 rounded-2xl border border-black/10 text-center text-2xl font-black text-grass-900 outline-none focus:border-grass-500 focus:ring-2 focus:ring-grass-200 disabled:opacity-60"
      />
    </div>
  );
}

/** שורת יחסי 1X2 — מציגה לכל כיוון את אחוז הסיכוי ואת הנקודות אם יצדיק.
 *  היחסים מגיעים מ-The Odds API (שוק h2h). אם אין יחסים אמיתיים — מציגים הודעה
 *  ולא ממציאים מספרים. */
function OddsRow({
  home,
  away,
  probOf,
  decimalOf,
  activeDir,
  hasOdds,
}: {
  home: string;
  away: string;
  probOf: (d: Direction) => number;
  decimalOf: (d: Direction) => number;
  activeDir: Direction;
  hasOdds: boolean;
}) {
  if (!hasOdds) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-grass-50/40 p-2 text-center text-[11px] font-semibold text-grass-400">
        יחסי 1X2 יופיעו כאן ברגע שיתפרסמו באתר ההימורים
      </div>
    );
  }
  const cells: { dir: Direction; label: string }[] = [
    { dir: "home", label: `ניצחון ${home}` },
    { dir: "draw", label: "תיקו" },
    { dir: "away", label: `ניצחון ${away}` },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cells.map((c) => {
        const dec = decimalOf(c.dir); // היחס העשרוני הגולמי מאתר ההימורים
        const pts = directionPointsFromDecimal(dec);
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
            {/* היחס העשרוני הגולמי — בדיוק כמו אתר הימורים */}
            <div className="text-lg font-black text-grass-900">{dec.toFixed(2)}</div>
            <div className="text-[10px] font-semibold text-grass-400">
              {pts} נק' · {(probOf(c.dir) * 100).toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** תצוגת תוצאה חד-משמעית: "בית H - A חוץ" עם שמות הקבוצות (בלי בלבול RTL) */
function ScoreLine({
  home,
  away,
  h,
  a,
}: {
  home: string;
  away: string;
  h: number;
  a: number;
}) {
  return (
    <span className="font-black text-grass-800">
      {home} {h} - {a} {away}
    </span>
  );
}

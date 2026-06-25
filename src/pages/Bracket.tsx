import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import Loading from "../components/Loading";
import Flag from "../components/Flag";
import { TOURNAMENT_KICKOFF_ISO } from "../config";
import { GROUPS, GROUP_LETTERS, TEAM_BY_CODE } from "../data/teams";
import { FINAL, QF, R16, R32, SF, type BracketMatch, type SlotRef } from "../data/bracket";
import {
  emptyBracketPick,
  matchTeams,
  resolveSlot,
  type BracketPick,
} from "../lib/bracketState";
import { computeGroupStandings } from "../lib/groups";
import { STAGE_ORDER, type Stage } from "../lib/types";

/** האם הקבוצה הגיעה בפועל לפחות לשלב הנדרש (מ-results['stage:CODE']). */
function reachedAtLeast(actual: Stage | undefined, needed: Stage): boolean | null {
  if (!actual) return null; // עוד לא ידוע
  return STAGE_ORDER.indexOf(actual) >= STAGE_ORDER.indexOf(needed);
}

// טקסט עזר למשבצת ריקה (כשעוד לא ידועה הנבחרת)
function slotPlaceholder(slot: SlotRef): string {
  switch (slot.type) {
    case "winner": return `מנצחת ${slot.group}`;
    case "runner": return `סגנית ${slot.group}`;
    case "third": return `שלישית ?`;
    case "match": return `מנצחת ${slot.match}`;
  }
}

export default function Bracket() {
  const { user } = useAuth();
  const [pick, setPick] = useState<BracketPick>(emptyBracketPick());
  const [results, setResults] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [tab, setTab] = useState<"groups" | "knockout">("groups");

  const locked = Date.now() >= new Date(TOURNAMENT_KICKOFF_ISO).getTime();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }
      const [{ data }, res, mt] = await Promise.all([
        supabase.from("general_picks").select("bracket").eq("user_id", user.id).maybeSingle(),
        supabase.from("results").select("*"),
        supabase.from("matches").select("home_team, away_team, home_score, away_score, finished"),
      ]);
      if (!alive) return;
      const rmap: Record<string, string> = {};
      (res.data ?? []).forEach((r: any) => (rmap[r.key] = r.value));
      setResults(rmap);
      setMatches(mt.data ?? []);
      if (data?.bracket && data.bracket.groupRankings) {
        // מיזוג בטוח עם ברירת המחדל (אם נוספו בתים)
        const base = emptyBracketPick();
        const loaded: BracketPick = {
          groupRankings: { ...base.groupRankings, ...data.bracket.groupRankings },
          // השלישיות נקבעות אוטומטית — תמיד נחשב מחדש (מתעלם מערכים ישנים)
          thirdSlots: base.thirdSlots,
          winners: data.bracket.winners ?? {},
        };
        setPick(loaded);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  async function save() {
    if (!user || locked) return;
    setSaving(true);
    await supabase.from("general_picks").upsert({
      user_id: user.id,
      bracket: pick,
      // updated_at נקבע בשרת (טריגר) — לא נשלח מהלקוח כדי שלא ניתן יהיה לזייף
    });
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading) return <Loading />;

  // דירוג בתים בפועל (אוטומטי + עקיפת אדמין) ושלב בפועל לכל קבוצה — לסימוני ✓/✗
  const autoStandings = computeGroupStandings(matches);
  const groupStandings: Record<string, string[]> = { ...autoStandings };
  for (const [k, v] of Object.entries(results)) {
    if (k.startsWith("group:") && v) groupStandings[k.slice(6)] = v.split(",").map((s) => s.trim());
  }
  const stageOf = (code: string) => results[`stage:${code}`] as Stage | undefined;
  const hasResults =
    Object.keys(groupStandings).length > 0 ||
    Object.keys(results).some((k) => k.startsWith("stage:"));

  return (
    <div className="space-y-5 animate-fade-up pb-4">
      <Hero locked={locked} />

      {hasResults && (
        <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-grass-50 px-3 py-2 text-[11px] font-bold">
          <span className="text-grass-600">✓ ניחוש מדויק</span>
          <span className="text-amber-600">↑ עלתה (מקום אחר)</span>
          <span className="text-red-500">✗ פספוס</span>
        </div>
      )}

      {/* טאבים: בתים / נוקאאוט */}
      <div className="flex gap-1 rounded-2xl bg-grass-50 p-1">
        <TabBtn active={tab === "groups"} onClick={() => setTab("groups")}>
          1️⃣ דירוג הבתים
        </TabBtn>
        <TabBtn active={tab === "knockout"} onClick={() => setTab("knockout")}>
          2️⃣ שלבי הנוקאאוט
        </TabBtn>
      </div>

      {tab === "groups" ? (
        <GroupsStage pick={pick} setPick={setPick} locked={locked} standings={groupStandings} />
      ) : (
        <KnockoutStage pick={pick} setPick={setPick} locked={locked} stageOf={stageOf} />
      )}

      {!locked && (
        <div className="sticky bottom-24 z-10">
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "שומר…" : savedAt ? "✓ הלוח נשמר!" : "שמירת לוח הניחושים"}
          </button>
        </div>
      )}
    </div>
  );
}

function Hero({ locked }: { locked: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="relative bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
        <span className="pointer-events-none absolute -left-3 -top-4 text-7xl opacity-15">🗺️</span>
        <h1 className="text-xl font-extrabold">לוח הניחושים</h1>
        <p className="mt-1 text-sm text-grass-100/90">
          דרגו כל בית 1–4 → המקומות שעולים נשלחים אוטומטית לנוקאאוט →
          בחרו מי מנצח בכל שלב עד האלוף.
        </p>
      </div>
      {locked && (
        <div className="bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700">
          🔒 הלוח ננעל — הטורניר התחיל.
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
        active ? "bg-grass-600 text-white shadow-lift" : "text-grass-600"
      }`}
    >
      {children}
    </button>
  );
}

// ============ שלב 1: דירוג הבתים ============
function GroupsStage({
  pick,
  setPick,
  locked,
  standings,
}: {
  pick: BracketPick;
  setPick: (p: BracketPick) => void;
  locked: boolean;
  standings: Record<string, string[]>;
}) {
  // סימון ✓/↑/✗ למיקום שניחשת מול הדירוג בפועל (אם הבית הוכרע)
  function mark(g: string, idx: number, code: string) {
    const actual = standings[g];
    if (!actual) return null;
    if (actual[idx] === code) return { sym: "✓", cls: "text-grass-600" };
    if (idx < 2 && actual.slice(0, 2).includes(code))
      return { sym: "↑", cls: "text-amber-600" };
    return { sym: "✗", cls: "text-red-500" };
  }
  function move(group: string, idx: number, dir: -1 | 1) {
    const arr = [...pick.groupRankings[group]];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setPick({ ...pick, groupRankings: { ...pick.groupRankings, [group]: arr } });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {GROUP_LETTERS.map((g) => (
        <div key={g} className="card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-extrabold text-grass-700">בית {g}</span>
            <span className="text-[11px] text-grass-400">1–2 עולים · 3 אולי</span>
          </div>
          <div className="space-y-1.5">
            {pick.groupRankings[g].map((code, idx) => {
              const t = TEAM_BY_CODE[code];
              const qualColor =
                idx < 2 ? "bg-grass-50 ring-1 ring-grass-200"
                : idx === 2 ? "bg-amber-50/60"
                : "bg-black/[0.02]";
              return (
                <div key={code} className={`flex items-center gap-2 rounded-xl p-1.5 ${qualColor}`}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass-600 text-xs font-black text-white">
                    {idx + 1}
                  </span>
                  <Flag code={code} size={24} />
                  <span className="flex-1 truncate text-sm font-bold text-grass-900">
                    {t?.nameHe ?? code}
                  </span>
                  {(() => {
                    const m = mark(g, idx, code);
                    return m ? <span className={`text-sm font-black ${m.cls}`}>{m.sym}</span> : null;
                  })()}
                  {!locked && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => move(g, idx, -1)}
                        disabled={idx === 0}
                        className="px-1 text-grass-500 disabled:opacity-20"
                        aria-label="העלה"
                      >▲</button>
                      <button
                        onClick={() => move(g, idx, 1)}
                        disabled={idx === 3}
                        className="px-1 text-grass-500 disabled:opacity-20"
                        aria-label="הורד"
                      >▼</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ שלב 2: נוקאאוט ============
// grant = השלב שהמנצח במשחק זה מגיע אליו (לבדיקת ✓/✗ מול results['stage:'])
const KO_ROUNDS = [
  { key: "r32", title: "שמינית-של-32", matches: R32, grant: "r16" as Stage },
  { key: "r16", title: "שמינית גמר", matches: R16, grant: "qf" as Stage },
  { key: "qf", title: "רבע גמר", matches: QF, grant: "sf" as Stage },
  { key: "sf", title: "חצי גמר", matches: SF, grant: "final" as Stage },
  { key: "final", title: "הגמר", matches: [FINAL], grant: "winner" as Stage },
];

function KnockoutStage({
  pick,
  setPick,
  locked,
  stageOf,
}: {
  pick: BracketPick;
  setPick: (p: BracketPick) => void;
  locked: boolean;
  stageOf: (code: string) => Stage | undefined;
}) {
  const champion = pick.winners[FINAL.match];

  function chooseWinner(match: number, code: string | null) {
    if (!code || locked) return;
    setPick({ ...pick, winners: { ...pick.winners, [match]: code } });
  }

  return (
    <div className="space-y-5">
      {champion && (
        <div className="card flex items-center gap-3 bg-gradient-to-l from-accent-400/20 to-grass-50 p-4">
          <span className="text-3xl">🏆</span>
          <div>
            <div className="text-xs font-bold text-grass-500">האלוף שניחשת</div>
            <div className="flex items-center gap-2 text-lg font-extrabold text-grass-900">
              <Flag code={champion} size={28} />
              {TEAM_BY_CODE[champion]?.nameHe}
            </div>
          </div>
        </div>
      )}

      {KO_ROUNDS.map((round) => (
        <div key={round.key}>
          <div className="mb-2 px-1 text-sm font-extrabold text-accent-600">
            {round.title}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {round.matches.map((m) => (
              <KnockoutMatch
                key={m.match}
                match={m}
                pick={pick}
                locked={locked}
                onPickWinner={chooseWinner}
                grant={round.grant}
                stageOf={stageOf}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KnockoutMatch({
  match,
  pick,
  locked,
  onPickWinner,
  grant,
  stageOf,
}: {
  match: BracketMatch;
  pick: BracketPick;
  locked: boolean;
  onPickWinner: (match: number, code: string | null) => void;
  grant: Stage;
  stageOf: (code: string) => Stage | undefined;
}) {
  const { home, away } = matchTeams(match, pick);
  const winner = pick.winners[match.match];
  // האם הקבוצה שניחשת כמנצחת אכן עלתה לשלב הבא בפועל
  const winnerOk = winner ? reachedAtLeast(stageOf(winner), grant) : null;

  return (
    <div className="card p-2.5">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-grass-400">משחק #{match.match}</span>
        <span className="text-[11px] text-grass-400">
          {new Date(match.date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SideBtn
          code={home}
          placeholder={slotPlaceholder(match.home)}
          selected={winner != null && winner === home}
          result={winner === home ? winnerOk : null}
          disabled={locked || !home}
          onClick={() => onPickWinner(match.match, home)}
        />
        <SideBtn
          code={away}
          placeholder={slotPlaceholder(match.away)}
          selected={winner != null && winner === away}
          result={winner === away ? winnerOk : null}
          disabled={locked || !away}
          onClick={() => onPickWinner(match.match, away)}
        />
      </div>
    </div>
  );
}

function SideBtn({
  code,
  placeholder,
  selected,
  result,
  disabled,
  onClick,
}: {
  code: string | null;
  placeholder: string;
  selected: boolean;
  result: boolean | null; // האם הניחוש התברר כנכון (null = לא ידוע עדיין)
  disabled: boolean;
  onClick: () => void;
}) {
  const t = code ? TEAM_BY_CODE[code] : null;
  const border =
    selected && result === true ? "border-grass-500 bg-grass-50 ring-2 ring-grass-400"
    : selected && result === false ? "border-red-300 bg-red-50 ring-2 ring-red-200"
    : selected ? "border-grass-500 bg-grass-50 ring-2 ring-grass-300"
    : "border-black/10 hover:bg-grass-50/50";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center gap-2 rounded-xl border p-2 text-right transition disabled:cursor-not-allowed",
        border,
        !code ? "opacity-50" : "",
      ].join(" ")}
    >
      {code ? <Flag code={code} size={26} /> : <span className="h-[26px] w-[26px] rounded-full bg-grass-100" />}
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-grass-900">
        {t?.nameHe ?? placeholder}
      </span>
      {selected && result === true && <span className="font-black text-grass-600">✓</span>}
      {selected && result === false && <span className="font-black text-red-500">✗</span>}
      {selected && result === null && <span className="text-grass-600">•</span>}
    </button>
  );
}

export { GROUPS, resolveSlot };

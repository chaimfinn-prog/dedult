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
      const { data } = await supabase
        .from("general_picks")
        .select("bracket")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data?.bracket && data.bracket.groupRankings) {
        // מיזוג בטוח עם ברירת המחדל (אם נוספו בתים)
        const base = emptyBracketPick();
        setPick({
          groupRankings: { ...base.groupRankings, ...data.bracket.groupRankings },
          thirdSlots: data.bracket.thirdSlots ?? {},
          winners: data.bracket.winners ?? {},
        });
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
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 animate-fade-up pb-4">
      <Hero locked={locked} />

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
        <GroupsStage pick={pick} setPick={setPick} locked={locked} />
      ) : (
        <KnockoutStage pick={pick} setPick={setPick} locked={locked} />
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
}: {
  pick: BracketPick;
  setPick: (p: BracketPick) => void;
  locked: boolean;
}) {
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
const KO_ROUNDS = [
  { key: "r32", title: "שמינית-של-32", matches: R32 },
  { key: "r16", title: "שמינית גמר", matches: R16 },
  { key: "qf", title: "רבע גמר", matches: QF },
  { key: "sf", title: "חצי גמר", matches: SF },
  { key: "final", title: "הגמר", matches: [FINAL] },
];

function KnockoutStage({
  pick,
  setPick,
  locked,
}: {
  pick: BracketPick;
  setPick: (p: BracketPick) => void;
  locked: boolean;
}) {
  const champion = pick.winners[FINAL.match];

  function chooseWinner(match: number, code: string | null) {
    if (!code || locked) return;
    setPick({ ...pick, winners: { ...pick.winners, [match]: code } });
  }
  function chooseThird(match: number, group: string) {
    setPick({ ...pick, thirdSlots: { ...pick.thirdSlots, [match]: group } });
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
                onPickThird={chooseThird}
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
  onPickThird,
}: {
  match: BracketMatch;
  pick: BracketPick;
  locked: boolean;
  onPickWinner: (match: number, code: string | null) => void;
  onPickThird: (match: number, group: string) => void;
}) {
  const { home, away } = matchTeams(match, pick);
  const winner = pick.winners[match.match];

  // אם יש משבצת "שלישית" — צריך לבחור מאיזה בית
  const thirdSlot = match.home.type === "third" ? match.home : match.away.type === "third" ? match.away : null;

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
          disabled={locked || !home}
          onClick={() => onPickWinner(match.match, home)}
        />
        <SideBtn
          code={away}
          placeholder={slotPlaceholder(match.away)}
          selected={winner != null && winner === away}
          disabled={locked || !away}
          onClick={() => onPickWinner(match.match, away)}
        />
      </div>

      {thirdSlot && thirdSlot.type === "third" && !locked && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-amber-600">שלישית עולה מ:</span>
          <select
            value={pick.thirdSlots[match.match] ?? ""}
            onChange={(e) => onPickThird(match.match, e.target.value)}
            className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold"
          >
            <option value="">בחר בית…</option>
            {thirdSlot.groups.map((g) => {
              const third = pick.groupRankings[g]?.[2];
              return (
                <option key={g} value={g}>
                  בית {g} — {third ? TEAM_BY_CODE[third]?.nameHe : "?"}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}

function SideBtn({
  code,
  placeholder,
  selected,
  disabled,
  onClick,
}: {
  code: string | null;
  placeholder: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const t = code ? TEAM_BY_CODE[code] : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center gap-2 rounded-xl border p-2 text-right transition disabled:cursor-not-allowed",
        selected
          ? "border-grass-500 bg-grass-50 ring-2 ring-grass-300"
          : "border-black/10 hover:bg-grass-50/50",
        !code ? "opacity-50" : "",
      ].join(" ")}
    >
      {code ? <Flag code={code} size={26} /> : <span className="h-[26px] w-[26px] rounded-full bg-grass-100" />}
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-grass-900">
        {t?.nameHe ?? placeholder}
      </span>
      {selected && <span className="text-grass-600">✓</span>}
    </button>
  );
}

export { GROUPS, resolveSlot };

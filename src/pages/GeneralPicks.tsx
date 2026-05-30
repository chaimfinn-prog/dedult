import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import OptionCard from "../components/OptionCard";
import {
  potentialGeneralPoints,
  potentialStagePoints,
} from "../lib/scoring";
import { TOURNAMENT_KICKOFF_ISO } from "../config";
import { TEAMS } from "../data/teams";
import {
  STAGE_LABELS_HE,
  STAGE_ORDER,
  type GeneralCategory,
  type MarketOption,
  type Stage,
} from "../lib/types";

// הסתברויות ברירת מחדל לשלב שאליו מגיעה נבחרת (מנורמל פר נבחרת),
// משמש כשאין יחסים ידניים ב-DB. אדמין יכול לדרוס.
const DEFAULT_STAGE_PROB: Record<Stage, number> = {
  groups: 0.42,
  r32: 0.26,
  r16: 0.15,
  qf: 0.09,
  sf: 0.045,
  final: 0.022,
  winner: 0.013,
};
const STAGE_PROB_SUM = Object.values(DEFAULT_STAGE_PROB).reduce((a, b) => a + b, 0);
function stageProb(s: Stage) {
  return DEFAULT_STAGE_PROB[s] / STAGE_PROB_SUM;
}

interface GP {
  champion: string;
  runner_up: string;
  top_scorer: string;
  second_scorer: string;
  top_assists: string;
  stages: Record<string, string>;
}
const EMPTY: GP = {
  champion: "",
  runner_up: "",
  top_scorer: "",
  second_scorer: "",
  top_assists: "",
  stages: {},
};

const PLAYER_MARKETS: { key: keyof GP; cat: GeneralCategory; title: string }[] = [
  { key: "champion", cat: "champion", title: "🏆 אלוף המונדיאל" },
  { key: "runner_up", cat: "runnerUp", title: "🥈 מקום שני (סגנית)" },
  { key: "top_scorer", cat: "topScorer", title: "👟 מלך השערים (נעל הזהב)" },
  { key: "second_scorer", cat: "secondScorer", title: "🎯 סגן מלך השערים" },
  { key: "top_assists", cat: "topAssists", title: "🅰️ מלך הבישולים" },
];

export default function GeneralPicks() {
  const { user } = useAuth();
  const { loading, market } = useOdds();
  const [picks, setPicks] = useState<GP>(EMPTY);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const locked = Date.now() >= new Date(TOURNAMENT_KICKOFF_ISO).getTime();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured || !user) {
        setLoadingPicks(false);
        return;
      }
      const { data } = await supabase
        .from("general_picks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setPicks({
          champion: data.champion ?? "",
          runner_up: data.runner_up ?? "",
          top_scorer: data.top_scorer ?? "",
          second_scorer: data.second_scorer ?? "",
          top_assists: data.top_assists ?? "",
          stages: data.stages ?? {},
        });
      }
      setLoadingPicks(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function save() {
    if (!user || locked) return;
    setSaving(true);
    await supabase.from("general_picks").upsert({
      user_id: user.id,
      champion: picks.champion || null,
      runner_up: picks.runner_up || null,
      top_scorer: picks.top_scorer || null,
      second_scorer: picks.second_scorer || null,
      top_assists: picks.top_assists || null,
      stages: picks.stages,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading || loadingPicks) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-up">
      <Hero locked={locked} />

      {PLAYER_MARKETS.map(({ key, cat, title }) => (
        <MarketSection
          key={key}
          title={title}
          category={cat}
          options={market(cat)}
          selected={picks[key] as string}
          disabled={locked}
          onSelect={(id) => setPicks((p) => ({ ...p, [key]: id }))}
        />
      ))}

      <StageSection
        stages={picks.stages}
        disabled={locked}
        onChange={(code, stage) =>
          setPicks((p) => ({ ...p, stages: { ...p.stages, [code]: stage } }))
        }
      />

      {/* שמירה — סרגל דביק תחתון */}
      {!locked && (
        <div className="sticky bottom-24 z-10">
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "שומר…" : savedAt ? "✓ נשמר!" : "שמירת הניחושים"}
          </button>
        </div>
      )}
    </div>
  );
}

function Hero({ locked }: { locked: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
        <h1 className="text-xl font-extrabold">הניחושים הכלליים שלי</h1>
        <p className="mt-1 text-sm text-grass-100/90">
          נסגרים עם שריקת הפתיחה — 11.6.2026. ליד כל בחירה רואים את הסיכוי
          ואת הנקודות אם תצדיק.
        </p>
      </div>
      {locked && (
        <div className="bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700">
          🔒 הניחושים ננעלו — הטורניר התחיל.
        </div>
      )}
    </div>
  );
}

function MarketSection({
  title,
  category,
  options,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  category: GeneralCategory;
  options: MarketOption[];
  selected: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // מראים 6 מובילים, ואת הבחירה הנוכחית גם אם רחוקה
  const visible = useMemo(() => {
    if (expanded) return options;
    const top = options.slice(0, 6);
    if (selected && !top.find((o) => o.id === selected)) {
      const sel = options.find((o) => o.id === selected);
      if (sel) return [...top, sel];
    }
    return top;
  }, [options, expanded, selected]);

  return (
    <section>
      <h2 className="mb-2 px-1 text-lg font-extrabold text-grass-900">{title}</h2>
      {options.length === 0 ? (
        <p className="card p-4 text-sm text-grass-500">
          טרם הוזנו יחסים לקטגוריה זו. האדמין יוסיף אותם במסך הניהול.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((o) => (
            <OptionCard
              key={o.id}
              title={o.label}
              prob={o.prob}
              points={potentialGeneralPoints(category, o.prob)}
              selected={selected === o.id}
              disabled={disabled}
              onSelect={() => onSelect(o.id)}
            />
          ))}
          {options.length > 6 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="btn-ghost w-full text-sm"
            >
              {expanded ? "הצג פחות" : `הצג את כל ${options.length} האפשרויות`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function StageSection({
  stages,
  disabled,
  onChange,
}: {
  stages: Record<string, string>;
  disabled: boolean;
  onChange: (code: string, stage: Stage) => void;
}) {
  const [open, setOpen] = useState(false);
  const chosen = Object.keys(stages).length;
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="card flex w-full items-center justify-between p-4 text-right"
      >
        <div>
          <h2 className="text-lg font-extrabold text-grass-900">
            📊 לאיזה שלב תגיע כל נבחרת?
          </h2>
          <p className="text-xs text-grass-500">
            נבחרו {chosen} מתוך {TEAMS.length} · ככל שהשלב מתקדם — יותר נקודות
          </p>
        </div>
        <span className="text-grass-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {TEAMS.map((t) => {
            const sel = (stages[t.code] as Stage) || "";
            const pts = sel ? potentialStagePoints(sel, stageProb(sel)) : 0;
            return (
              <div key={t.code} className="card flex items-center gap-3 p-3">
                <span className="text-xl">{t.flag}</span>
                <span className="flex-1 font-bold text-grass-900">{t.nameHe}</span>
                {sel && (
                  <span className="chip bg-accent-400/15 text-accent-600">
                    {pts} נק'
                  </span>
                )}
                <select
                  value={sel}
                  disabled={disabled}
                  onChange={(e) => onChange(t.code, e.target.value as Stage)}
                  className="rounded-xl border border-black/10 bg-white px-2 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  <option value="">בחר…</option>
                  {STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS_HE[s]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

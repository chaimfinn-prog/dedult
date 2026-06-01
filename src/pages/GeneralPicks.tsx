import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useOdds } from "../lib/data";
import Loading from "../components/Loading";
import OptionCard from "../components/OptionCard";
import { potentialGeneralPoints } from "../lib/scoring";
import { TOURNAMENT_KICKOFF_ISO } from "../config";
import { TEAM_BY_CODE } from "../data/teams";
import { type GeneralCategory, type MarketOption } from "../lib/types";

interface GP {
  top_scorer: string;
  second_scorer: string;
  top_assists: string;
}
const EMPTY: GP = { top_scorer: "", second_scorer: "", top_assists: "" };

// אלוף + סגנית נבחרים בלוח העץ (טאב "לוח עץ"), כאן רק שווקי השחקנים.
const PLAYER_MARKETS: { key: keyof GP; cat: GeneralCategory; title: string }[] = [
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
        .select("top_scorer, second_scorer, top_assists")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setPicks({
          top_scorer: data.top_scorer ?? "",
          second_scorer: data.second_scorer ?? "",
          top_assists: data.top_assists ?? "",
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
      top_scorer: picks.top_scorer || null,
      second_scorer: picks.second_scorer || null,
      top_assists: picks.top_assists || null,
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

      <Link
        to="/bracket"
        className="card flex items-center gap-3 p-4 transition hover:shadow-lift"
      >
        <span className="text-3xl">🗺️</span>
        <div className="flex-1">
          <div className="font-extrabold text-grass-900">
            אלוף, סגנית ולאיזה שלב תגיע כל נבחרת
          </div>
          <div className="text-xs text-grass-500">
            נבחרים בלוח העץ — דרגו בתים ובחרו מנצחים בנוקאאוט
          </div>
        </div>
        <span className="text-2xl text-grass-400">‹</span>
      </Link>

      {PLAYER_MARKETS.map(({ key, cat, title }) => (
        <MarketSection
          key={key}
          title={title}
          category={cat}
          options={market(cat)}
          selected={picks[key]}
          disabled={locked}
          onSelect={(id) => setPicks((p) => ({ ...p, [key]: id }))}
        />
      ))}

      {!locked && (
        <div className="sticky bottom-24 z-10">
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "שומר…" : savedAt ? "✓ נשמר!" : "שמירת ניחושי השחקנים"}
          </button>
        </div>
      )}
    </div>
  );
}

function Hero({ locked }: { locked: boolean }) {
  const kickoffLabel = new Date(TOURNAMENT_KICKOFF_ISO).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="card overflow-hidden">
      <div className="relative bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
        <span className="pointer-events-none absolute -left-3 -top-4 text-7xl opacity-15">
          🏆
        </span>
        <h1 className="text-xl font-extrabold">הניחושים הכלליים שלי</h1>
        <p className="mt-1 text-sm text-grass-100/90">
          ליד כל בחירה רואים את הסיכוי ואת הנקודות אם תצדיק — ככל שמפתיע יותר, שווה יותר.
        </p>
      </div>
      {locked ? (
        <div className="bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700">
          🔒 הניחושים ננעלו — הטורניר התחיל.
        </div>
      ) : (
        <div className="bg-grass-50 px-5 py-3 text-sm font-bold text-grass-700">
          ⏱️ דדליין: עד שריקת הפתיחה של הטורניר ({kickoffLabel})
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
  const visible = useMemo(() => {
    if (expanded) return options;
    const top = options.slice(0, 6);
    if (selected && !top.find((o) => o.id === selected)) {
      const sel = options.find((o) => o.id === selected);
      if (sel) return [...top, sel];
    }
    return top;
  }, [options, expanded, selected]);

  const subtitleFor = (o: MarketOption) =>
    o.code && TEAM_BY_CODE[o.code]?.nameHe !== o.label
      ? TEAM_BY_CODE[o.code]?.nameHe
      : undefined;

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
              subtitle={subtitleFor(o)}
              code={o.code}
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

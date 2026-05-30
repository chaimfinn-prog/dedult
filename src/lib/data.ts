import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";
import { buildNormalizedMarket, probFromAmerican } from "./odds";
import { normalizeProbabilities } from "./odds";
import { CHAMPION_ODDS_AMERICAN } from "../data/seedOdds";
import { TEAM_BY_CODE } from "../data/teams";
import type { MarketOption } from "./types";

export interface OddsRow {
  market: string;
  option_id: string;
  label: string;
  prob: number;
  source: string;
  updated_at: string;
}

/** ברירת מחדל לשוק האלוף מנתוני הזריעה (אם אין נתונים ב-DB) */
export function seedChampionMarket(): MarketOption[] {
  const entries = Object.entries(CHAMPION_ODDS_AMERICAN).map(([code, odds]) => ({
    id: code,
    label: `${TEAM_BY_CODE[code]?.flag ?? ""} ${TEAM_BY_CODE[code]?.nameHe ?? code}`,
    odds,
  }));
  // המרה אמריקאית → הסתברות → נרמול ל-100%
  const raw = entries.map((e) => probFromAmerican(e.odds));
  const normalized = normalizeProbabilities(raw);
  return entries
    .map((e, i) => ({ id: e.id, label: e.label, prob: normalized[i] }))
    .sort((a, b) => b.prob - a.prob);
}

/** טוען את כל שורות היחסים מ-DB (פעם אחת) */
export function useOdds() {
  const [rows, setRows] = useState<OddsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (alive) setLoading(false);
        return;
      }
      const { data } = await supabase.from("odds").select("*");
      if (!alive) return;
      const list = (data ?? []) as OddsRow[];
      setRows(list);
      setLastUpdated(
        list.reduce<string | null>(
          (max, r) => (!max || r.updated_at > max ? r.updated_at : max),
          null,
        ),
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** מחזיר אופציות מנורמלות לשוק נתון (מ-DB), או fallback לזריעה לאלוף */
  function market(name: string): MarketOption[] {
    const sel = rows.filter((r) => r.market === name);
    if (sel.length) {
      return sel
        .map((r) => ({ id: r.option_id, label: r.label, prob: r.prob }))
        .sort((a, b) => b.prob - a.prob);
    }
    if (name === "champion" || name === "runnerUp") return seedChampionMarket();
    return [];
  }

  return { rows, loading, lastUpdated, market };
}

export { buildNormalizedMarket };

import { forwardRef } from "react";

export interface ShareCardData {
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  kickoffLabel: string;
  actual: { h: number; a: number } | null;
  dir: { home: number; draw: number; away: number };
  total: number;
  topScore: { score: string; count: number } | null;
  picks: { name: string; score: string; bingo: boolean; dirHit: boolean }[];
  relevant: { emoji: string; who: string; category: string; what: string }[];
}

/**
 * כרטיס שיתוף יפה למשחק — נלכד כתמונה (PNG) ע"י html-to-image.
 * רוחב קבוע (620px) כדי שייראה מקצועי ועקבי גם בוואטסאפ.
 * דגלים מוצגים כאמוג'י (בלי תמונות חיצוניות) כדי להימנע מבעיות CORS בלכידה.
 */
const MatchShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  ({ data }, ref) => {
    const total = data.total || 1;
    const pct = (n: number) => Math.round((n / total) * 100);
    return (
      <div
        ref={ref}
        dir="rtl"
        style={{ width: 620, fontFamily: "system-ui, 'Segoe UI', Arial, sans-serif" }}
        className="overflow-hidden rounded-3xl bg-white"
      >
        {/* כותרת */}
        <div className="bg-gradient-to-l from-grass-700 to-grass-500 px-6 py-5 text-white">
          <div className="mb-2 text-sm font-bold opacity-90">🏆 ניחושי המונדיאל 2026</div>
          {/* dir=ltr: הבית תמיד משמאל (כמו לוח תוצאות) — מונע היפוך בית/חוץ ב-RTL */}
          <div dir="ltr" className="flex items-center justify-center gap-4 text-center">
            <div className="flex-1">
              <div className="text-4xl">{data.homeFlag}</div>
              <div className="mt-1 text-lg font-extrabold">{data.homeName}</div>
            </div>
            <div className="text-3xl font-black" style={{ unicodeBidi: "isolate" }}>
              {data.actual ? `${data.actual.h} - ${data.actual.a}` : "vs"}
            </div>
            <div className="flex-1">
              <div className="text-4xl">{data.awayFlag}</div>
              <div className="mt-1 text-lg font-extrabold">{data.awayName}</div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs font-semibold opacity-80">
            {data.kickoffLabel}
            {data.actual ? " · סופי" : ""}
          </div>
        </div>

        {/* פילוח כיוונים — dir=ltr כך שהבית (משמאל) תואם לכותרת */}
        <div dir="ltr" className="grid grid-cols-3 gap-2 px-6 py-4">
          {[
            { label: data.homeName, v: data.dir.home },
            { label: "תיקו", v: data.dir.draw },
            { label: data.awayName, v: data.dir.away },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl bg-grass-50 py-3 text-center">
              <div className="truncate px-1 text-xs font-bold text-grass-600">{c.label}</div>
              <div className="text-2xl font-black text-grass-800">{pct(c.v)}%</div>
              <div className="text-[11px] font-semibold text-grass-400">{c.v} חברים</div>
            </div>
          ))}
        </div>

        {data.topScore && (
          <div className="px-6 pb-2 text-center text-sm text-grass-600">
            התוצאה הכי מנוחשת:{" "}
            <b dir="ltr" className="text-grass-900" style={{ unicodeBidi: "isolate", display: "inline-block" }}>
              {data.topScore.score.replace("-", " - ")}
            </b>{" "}
            ({data.topScore.count})
          </div>
        )}

        {/* רשימת המנחשים */}
        <div className="px-6 pb-2">
          <div className="mb-1 text-xs font-extrabold text-grass-500">מי ניחש מה</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {data.picks.slice(0, 30).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate font-semibold text-grass-800">
                  {p.bingo ? "🎯 " : p.dirHit ? "✓ " : ""}
                  {p.name}
                </span>
                <span dir="ltr" className="font-bold text-grass-600" style={{ unicodeBidi: "isolate" }}>
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.relevant.length > 0 && (
          <div className="mx-6 my-3 rounded-2xl bg-grass-50 p-3">
            <div className="mb-1 text-xs font-extrabold text-grass-500">🔮 ניחושים כלליים קשורים</div>
            {data.relevant.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="text-grass-700">
                  {r.emoji} <b className="text-grass-900">{r.who}</b> · {r.category}
                </span>
                <span className="font-bold text-grass-700">{r.what}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-grass-50 px-6 py-2 text-center text-[11px] font-bold text-grass-400">
          ניחושי המונדיאל שלנו · {data.picks.length} משתתפים
        </div>
      </div>
    );
  },
);

export default MatchShareCard;

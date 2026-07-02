import { forwardRef } from "react";

export interface FunStatRow {
  label: string; // שם המשתמש / קטגוריה
  value: string; // ערך מוצג (למשל "₪120" או "6 ניצחונות")
  sub?: string; // פירוט קטן מתחת לשם (אופציונלי)
}

export interface FunStatData {
  emoji: string;
  title: string;
  subtitle?: string;
  rows?: FunStatRow[]; // תצוגת "מקום / שם / ערך" (top N)
  lines?: string[]; // תצוגת טקסט חופשי (שורה לכל פריט)
  footer?: string;
}

/**
 * כרטיס סטטיסטיקה משעשע לשיתוף — נלכד כתמונה (PNG) ע"י html-to-image,
 * באותה תבנית בדיוק כמו MatchShareCard (רוחב קבוע 620px, בלי תמונות
 * חיצוניות כדי להימנע מבעיות CORS בלכידה).
 */
const FunStatCard = forwardRef<HTMLDivElement, { data: FunStatData }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      dir="rtl"
      style={{ width: 620, fontFamily: "system-ui, 'Segoe UI', Arial, sans-serif" }}
      className="overflow-hidden rounded-3xl bg-white"
    >
      <div className="bg-gradient-to-l from-grass-700 to-grass-500 px-6 py-5 text-white">
        <div className="mb-1 text-sm font-bold opacity-90">🏆 ניחושי המונדיאל 2026</div>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{data.emoji}</span>
          <span className="text-xl font-extrabold">{data.title}</span>
        </div>
        {data.subtitle && <div className="mt-1 text-xs font-semibold opacity-85">{data.subtitle}</div>}
      </div>

      {data.rows && data.rows.length > 0 && (
        <div className="px-6 py-4">
          <div className="space-y-1.5">
            {data.rows.slice(0, 10).map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                  i === 0 ? "bg-accent-400/15" : "bg-grass-50"
                }`}
              >
                <span className="w-6 shrink-0 text-center font-black text-grass-500">
                  {["🥇", "🥈", "🥉"][i] ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-grass-900">{r.label}</div>
                  {r.sub && <div className="text-[11px] text-grass-400">{r.sub}</div>}
                </div>
                <span className="font-black text-grass-700">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.lines && data.lines.length > 0 && (
        <div className="space-y-1.5 px-6 py-4">
          {data.lines.slice(0, 12).map((l, i) => (
            <div key={i} className="rounded-2xl bg-grass-50 px-3 py-2 text-sm text-grass-800">
              {l}
            </div>
          ))}
        </div>
      )}

      <div className="bg-grass-50 px-6 py-2 text-center text-[11px] font-bold text-grass-400">
        {data.footer ?? "ניחושי המונדיאל שלנו"}
      </div>
    </div>
  );
});

export default FunStatCard;

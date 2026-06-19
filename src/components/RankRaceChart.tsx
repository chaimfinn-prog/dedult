import { useEffect, useRef, useState } from "react";
import type { RankRaceData } from "../lib/rankRace";

const PALETTE = [
  "#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#0891b2",
  "#db2777", "#65a30d", "#ea580c", "#0d9488", "#9333ea", "#ca8a04",
];

/** גרף אינטראקטיבי של שינוי המקומות לאורך זמן (bump chart) עם אנימציה. */
export default function RankRaceChart({
  data,
  nameOf,
}: {
  data: RankRaceData;
  nameOf: (id: string) => string;
}) {
  const { buckets, series, maxRank } = data;
  const [progress, setProgress] = useState(buckets.length);
  const [sel, setSel] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setProgress(buckets.length);
  }, [buckets.length]);
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  function play() {
    if (buckets.length < 2) return;
    if (timer.current) window.clearInterval(timer.current);
    setProgress(1);
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= buckets.length) {
          if (timer.current) window.clearInterval(timer.current);
          timer.current = null;
          return p;
        }
        return p + 1;
      });
    }, 600);
  }

  if (buckets.length < 2) {
    return (
      <div className="card p-6 text-center text-sm text-grass-500">
        📈 הגרף יתחיל להראות תנועה אחרי שייאספו עוד כמה תצלומי דירוג —
        זה נאסף אוטומטית ככל שנכנסים לטבלת המובילים לאורך הטורניר.
      </div>
    );
  }

  const W = 1000;
  const H = Math.max(220, series.length * 24 + 80);
  const mx = 36, my = 24;
  const x = (i: number) => mx + (i / (buckets.length - 1)) * (W - 2 * mx);
  const y = (rank: number) =>
    my + (maxRank <= 1 ? 0 : ((rank - 1) / (maxRank - 1)) * (H - 2 * my));

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-extrabold text-grass-800">📈 מירוץ המקומות</div>
        <button onClick={play} className="rounded-xl bg-grass-600 px-3 py-1.5 text-xs font-bold text-white">
          ▶ הפעל אנימציה
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: "ltr" }}>
        {series.map((s, i) => {
          const color = PALETTE[i % PALETTE.length];
          const pts = s.points.filter((p) => p.x <= progress - 1);
          if (!pts.length) return null;
          const d = pts
            .map((p, j) => `${j === 0 ? "M" : "L"} ${x(p.x).toFixed(1)} ${y(p.rank).toFixed(1)}`)
            .join(" ");
          const dim = sel && sel !== s.userId;
          const last = pts[pts.length - 1];
          return (
            <g key={s.userId} opacity={dim ? 0.12 : 1}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={sel === s.userId ? 6 : 3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx={x(last.x)} cy={y(last.rank)} r={6} fill={color} />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {series.map((s, i) => (
          <button
            key={s.userId}
            onClick={() => setSel(sel === s.userId ? null : s.userId)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
              sel === s.userId ? "bg-grass-100" : "bg-grass-50"
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            {nameOf(s.userId)} · #{s.lastRank}
          </button>
        ))}
      </div>
    </div>
  );
}

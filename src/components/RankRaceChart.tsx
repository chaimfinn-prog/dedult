import { useEffect, useMemo, useRef, useState } from "react";
import { detectRankJumps, type RankRaceData, type RankSeries } from "../lib/rankRace";

const PALETTE = [
  "#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#0891b2",
  "#db2777", "#65a30d", "#ea580c", "#0d9488", "#9333ea", "#ca8a04",
  "#475569", "#be123c", "#1d4ed8", "#a16207", "#15803d", "#7e22ce",
];

/** מיקום (rank, מעוגל לרציף) של סדרה ב-x נתון (אינטרפולציה לאורך הקו). */
function rankAtX(points: RankSeries["points"], x: number): number {
  if (!points.length) return 1;
  if (x <= points[0].x) return points[0].rank;
  const last = points[points.length - 1];
  if (x >= last.x) return last.rank;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.rank + (b.rank - a.rank) * t;
    }
  }
  return last.rank;
}

/** גרף "מירוץ מקומות" — ציר זמן לפי תאריכים, שמות על הקווים, אנימציה חלקה. */
export default function RankRaceChart({
  data,
  nameOf,
}: {
  data: RankRaceData;
  nameOf: (id: string) => string;
}) {
  const { buckets, series, maxRank } = data;
  const last = Math.max(0, buckets.length - 1);
  const [prog, setProg] = useState(last); // מיקום הזמן (רציף) — ברירת מחדל: הסוף
  const [sel, setSel] = useState<string | null>(null);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [activeJump, setActiveJump] = useState<{ userId: string; atX: number; delta: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const raf = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const jumps = useMemo(() => detectRankJumps(series, 3), [series]);

  useEffect(() => {
    setProg(last);
  }, [last]);
  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  function play() {
    if (buckets.length < 2) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    setActiveJump(null);
    // איטי יותר כברירת מחדל, כדי שאפשר לעקוב אחרי חילופי המקומות; /speed מאט עוד יותר
    const base = Math.min(16000, Math.max(4500, buckets.length * 1200));
    const duration = base / speed;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
      setProg(eased * last);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  async function shareImage() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "מירוץ-מקומות.png", { type: "image/png" });
      const navAny = navigator as any;
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({ files: [file], title: "מירוץ המקומות" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch {
      /* אם הלכידה נכשלה — מתעלמים בשקט */
    } finally {
      setExporting(false);
    }
  }

  if (buckets.length < 2) {
    return (
      <div className="card p-6 text-center text-sm text-grass-500">
        📈 הגרף יתחיל להראות תנועה אחרי שייאספו עוד כמה תצלומי דירוג — נאסף
        אוטומטית ככל שנכנסים לטבלת המובילים לאורך הטורניר.
      </div>
    );
  }

  // קנבס גדול; שם בצד ימין (LTR → הסוף מימין)
  const W = 1100;
  const H = Math.max(340, series.length * 24 + 120);
  const mx = 30, mr = 150, my = 34, mb = 34;
  const x = (i: number) => mx + (i / last) * (W - mx - mr);
  const y = (rank: number) =>
    my + (maxRank <= 1 ? 0 : ((rank - 1) / (maxRank - 1)) * (H - my - mb));

  // תוויות תאריך לאורך הציר (עד 6)
  const tickCount = Math.min(6, buckets.length);
  const ticks = Array.from({ length: tickCount }, (_, k) => {
    const i = Math.round((k / (tickCount - 1)) * last);
    // buckets הם מחרוזות YYYY-MM-DD; חלץ ישירות כדי להימנע מהזזת אזור-זמן
    const [, mm, dd] = buckets[i].split("-");
    return { i, label: `${parseInt(dd)}/${parseInt(mm)}` };
  });

  const selJumps = sel ? jumps.filter((j) => j.userId === sel) : [];

  return (
    <div ref={cardRef} className="card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-extrabold text-grass-800">📈 מירוץ המקומות</div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 0.5 : 1))}
            className="rounded-xl bg-grass-50 px-2.5 py-1.5 text-xs font-bold text-grass-600 ring-1 ring-grass-200"
          >
            {speed === 1 ? "1×" : "0.5×"}
          </button>
          <button onClick={play} className="rounded-xl bg-grass-600 px-3 py-1.5 text-xs font-bold text-white">
            ▶ הרץ אנימציה
          </button>
          <button
            onClick={shareImage}
            disabled={exporting}
            className="rounded-xl bg-accent-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {exporting ? "…" : "📤 שתף"}
          </button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: "ltr" }}>
        {/* קווי תאריך */}
        {ticks.map((t) => (
          <g key={t.i}>
            <line x1={x(t.i)} y1={my - 6} x2={x(t.i)} y2={H - mb + 4} stroke="#e5e7eb" strokeWidth={1} />
            <text x={x(t.i)} y={H - mb + 20} textAnchor="middle" fontSize={14} fill="#9ca3af">{t.label}</text>
          </g>
        ))}
        {series.map((s, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const dim = sel && sel !== s.userId;
          // נקודות עד למיקום הזמן הנוכחי + ראש מאינטרפולציה
          const drawn = s.points.filter((p) => p.x <= Math.floor(prog));
          const headRank = rankAtX(s.points, prog);
          const path = [...drawn.map((p) => ({ x: p.x, r: p.rank })), { x: prog, r: headRank }];
          const d = path.map((p, j) => `${j === 0 ? "M" : "L"} ${x(p.x).toFixed(1)} ${y(p.r).toFixed(1)}`).join(" ");
          const hx = x(prog), hy = y(headRank);
          return (
            <g key={s.userId} opacity={dim ? 0.12 : 1} onClick={() => setSel(sel === s.userId ? null : s.userId)} style={{ cursor: "pointer" }}>
              <path d={d} fill="none" stroke={color} strokeWidth={sel === s.userId ? 5 : 3} strokeLinejoin="round" strokeLinecap="round" />
              {/* סמני "קפיצה גדולה" — רק לסדרה הנבחרת, כדי לא לעמוס ויזואלית */}
              {sel === s.userId &&
                selJumps
                  .filter((j) => j.atX <= Math.floor(prog))
                  .map((j, ji) => {
                    const p = s.points.find((pt) => pt.x === j.atX);
                    if (!p) return null;
                    return (
                      <text
                        key={ji}
                        x={x(j.atX)}
                        y={y(p.rank) - 12}
                        textAnchor="middle"
                        fontSize={16}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveJump(j);
                        }}
                      >
                        ⭐
                      </text>
                    );
                  })}
              <circle cx={hx} cy={hy} r={6} fill={color} />
              <text x={hx + 12} y={hy + 5} fontSize={16} fontWeight={700} fill={color}>
                {nameOf(s.userId)}
              </text>
            </g>
          );
        })}
      </svg>
      {activeJump && (
        <p className="mt-1 rounded-xl bg-accent-400/15 px-3 py-1.5 text-center text-xs font-bold text-accent-600">
          {activeJump.delta > 0
            ? `🚀 ${nameOf(activeJump.userId)} טיפס ${activeJump.delta} מקומות!`
            : `📉 ${nameOf(activeJump.userId)} ירד ${-activeJump.delta} מקומות`}
        </p>
      )}
      <p className="mt-1 px-1 text-center text-[11px] text-grass-400">
        לחיצה על שם מדגישה את הקו שלו ומראה ⭐ בקפיצות דירוג גדולות. ▲ למעלה = מקום טוב יותר.
      </p>
    </div>
  );
}

// כרטיס אופציה לבחירה — הלב של האפליקציה:
// מציג ליד כל בחירה את אחוז הסיכוי ואת מספר הנקודות אם יצדיק (שקיפות).

interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  /** הסתברות מנורמלת 0..1 */
  prob: number;
  /** נקודות פוטנציאליות אם יצדיק */
  points: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export default function OptionCard({
  title,
  subtitle,
  emoji,
  prob,
  points,
  selected,
  disabled,
  onSelect,
}: Props) {
  const pct = (prob * 100).toFixed(prob < 0.1 ? 1 : 0);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={[
        "group w-full text-right transition active:scale-[0.99] disabled:cursor-not-allowed",
        "card flex items-center gap-3 p-3.5",
        selected
          ? "ring-2 ring-grass-500 border-grass-300 bg-grass-50"
          : "hover:shadow-lift hover:-translate-y-0.5",
        disabled && !selected ? "opacity-60" : "",
      ].join(" ")}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-grass-900">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-grass-600">{subtitle}</div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="chip bg-accent-400/15 text-accent-600">
          {points.toLocaleString("he-IL")} נק'
        </span>
        <span className="text-xs font-semibold text-grass-500">
          סיכוי {pct}%
        </span>
      </div>

      <span
        className={[
          "ms-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
          selected
            ? "border-grass-600 bg-grass-600 text-white"
            : "border-grass-300 text-transparent",
        ].join(" ")}
        aria-hidden
      >
        ✓
      </span>
    </button>
  );
}

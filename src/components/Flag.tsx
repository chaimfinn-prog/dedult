import { useState } from "react";
import { flagUrl } from "../data/flags";
import { TEAM_BY_CODE } from "../data/teams";

interface Props {
  code: string;
  size?: number; // קוטר בפיקסלים
  className?: string;
}

// דגל מדינה עגול ומלוטש (תמונה אמיתית מ-flagcdn), עם נפילה לאימוג'י אם אין רשת.
export default function Flag({ code, size = 32, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const url = flagUrl(code, size > 40 ? 160 : 80);
  const team = TEAM_BY_CODE[code];

  if (!url || failed) {
    return (
      <span
        className={`inline-grid place-items-center rounded-full bg-grass-100 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        {team?.flag ?? "🏳️"}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={team?.nameHe ?? code}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`inline-block rounded-full object-cover shadow-sm ring-1 ring-black/10 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

import { useMemo, useState } from "react";
import Flag from "../components/Flag";
import { GROUP_LETTERS, GROUPS, TEAMS, TEAM_BY_CODE } from "../data/teams";
import { BRACKET_ROUNDS, type SlotRef } from "../data/bracket";
import { pathToFinal } from "../lib/bracketPath";

function slotLabel(slot: SlotRef): string {
  switch (slot.type) {
    case "winner":
      return `מנצחת ${slot.group}`;
    case "runner":
      return `סגנית ${slot.group}`;
    case "third":
      return `3' (${slot.groups.join("/")})`;
    case "match":
      return `מנצחת ${slot.match}`;
  }
}

export default function Bracket() {
  const [teamCode, setTeamCode] = useState("ARG");
  const [position, setPosition] = useState<"winner" | "runner">("winner");

  const team = TEAM_BY_CODE[teamCode];
  const path = useMemo(
    () => pathToFinal(team.group, position),
    [team.group, position],
  );

  return (
    <div className="space-y-6 animate-fade-up pb-4">
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-l from-grass-700 to-grass-600 p-5 text-white">
          <span className="pointer-events-none absolute -left-3 -top-4 text-7xl opacity-15">
            🗺️
          </span>
          <h1 className="text-xl font-extrabold">לוח המשחקים והדרך לגמר</h1>
          <p className="mt-1 text-sm text-grass-100/90">
            הבתים הסופיים, מבנה הנוקאאוט, והמסלול התיאורטי של כל נבחרת עד הגמר.
          </p>
        </div>
      </div>

      {/* בוחר נבחרת + מיקום בבית → מציג מסלול */}
      <section className="card p-4">
        <h2 className="mb-3 text-base font-extrabold text-grass-900">
          🎯 הדרך לגמר של נבחרת
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            className="input flex-1"
          >
            {TEAMS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.nameHe} (בית {t.group})
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-2xl bg-grass-50 p-1">
            <button
              onClick={() => setPosition("winner")}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                position === "winner" ? "bg-grass-600 text-white" : "text-grass-600"
              }`}
            >
              מקום ראשון
            </button>
            <button
              onClick={() => setPosition("runner")}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                position === "runner" ? "bg-grass-600 text-white" : "text-grass-600"
              }`}
            >
              מקום שני
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-grass-50 p-3">
          <Flag code={team.code} size={36} />
          <div className="text-sm font-bold text-grass-900">
            {team.nameHe} · {position === "winner" ? "מנצחת" : "סגנית"} בית {team.group}
          </div>
        </div>

        <ol className="mt-3 space-y-2">
          {path.map((step, i) => (
            <li key={step.match} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-grass-600 text-xs font-black text-white">
                {i + 1}
              </span>
              <div className="flex-1 rounded-xl border border-black/5 bg-white px-3 py-2">
                <div className="text-sm font-bold text-grass-900">
                  {step.roundTitle}
                </div>
                <div className="text-xs text-grass-500">
                  מול {step.opponent} · משחק #{step.match} ·{" "}
                  {new Date(step.date).toLocaleDateString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-grass-400">
          * מסלול תיאורטי בהנחה שהנבחרת מנצחת בכל שלב. היריבים המדויקים ייקבעו לפי התוצאות.
        </p>
      </section>

      {/* הבתים */}
      <section>
        <h2 className="mb-2 px-1 text-lg font-extrabold text-grass-900">
          הבתים (12 בתים)
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GROUP_LETTERS.map((g) => (
            <div key={g} className="card p-3">
              <div className="mb-2 text-sm font-extrabold text-grass-700">בית {g}</div>
              <div className="space-y-1.5">
                {GROUPS[g].map((t) => (
                  <div key={t.code} className="flex items-center gap-2">
                    <Flag code={t.code} size={22} />
                    <span className="text-sm font-semibold text-grass-900">
                      {t.nameHe}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* מבנה הנוקאאוט */}
      <section>
        <h2 className="mb-2 px-1 text-lg font-extrabold text-grass-900">
          מבנה הנוקאאוט
        </h2>
        <div className="space-y-4">
          {BRACKET_ROUNDS.map((round) => (
            <div key={round.key}>
              <div className="mb-2 px-1 text-sm font-extrabold text-accent-600">
                {round.title}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {round.matches.map((m) => (
                  <div
                    key={m.match}
                    className="card flex items-center justify-between p-3 text-sm"
                  >
                    <span className="font-semibold text-grass-900">
                      {slotLabel(m.home)} <span className="text-grass-400">מול</span>{" "}
                      {slotLabel(m.away)}
                    </span>
                    <span className="chip bg-grass-50 text-grass-500">
                      {new Date(m.date).toLocaleDateString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

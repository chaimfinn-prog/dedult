import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "ניחושים", icon: "🎯", end: true },
  { to: "/matches", label: "משחקים", icon: "⚽" },
  { to: "/leaderboard", label: "דירוג", icon: "🏆" },
  { to: "/rules", label: "חוקים", icon: "📖" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      {/* כותרת עליונה — בסגנון יציע/מגרש */}
      <header className="sticky top-0 z-20 overflow-hidden border-b border-black/5 bg-gradient-to-l from-grass-700 via-grass-600 to-grass-700 px-4 py-3 text-white backdrop-blur">
        {/* קווי מגרש עדינים ברקע הכותרת */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect x="1" y="6" width="398" height="48" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="200" cy="30" r="16" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="200" y1="6" x2="200" y2="54" stroke="white" strokeWidth="1.5" />
        </svg>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div className="leading-tight">
              <div className="text-base font-extrabold">ניחושי מונדיאל 2026</div>
              <div className="text-[11px] font-medium text-grass-100/90">
                חבורת החברים
              </div>
            </div>
          </div>
          {user && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-full bg-white/10 py-1 pe-3 ps-1 transition hover:bg-white/20"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-sm">
                  {(user.user_metadata?.full_name ?? "?")[0]}
                </span>
              )}
              <span className="text-xs font-semibold">יציאה</span>
            </button>
          )}
        </div>
      </header>

      {/* תוכן */}
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      {/* ניווט תחתון (מובייל-פירסט) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl border-t border-black/5 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold transition",
                  isActive
                    ? "bg-grass-50 text-grass-700"
                    : "text-grass-400 hover:text-grass-600",
                ].join(" ")
              }
            >
              <span className="text-lg leading-none">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="mt-1 w-full rounded-xl bg-accent-500/10 py-1.5 text-[11px] font-bold text-accent-600"
          >
            ⚙️ ניהול (אדמין)
          </button>
        )}
      </nav>
    </div>
  );
}

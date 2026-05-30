import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signInWithGoogle, configured } = useAuth();

  return (
    <div className="grid min-h-full place-items-center px-6">
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-grass-600 text-4xl shadow-lift">
          ⚽
        </div>
        <h1 className="text-3xl font-extrabold text-grass-900">
          ניחושי מונדיאל 2026
        </h1>
        <p className="mt-2 text-grass-600">
          נחשו, צברו נקודות, ותתחרו על צמרת הטבלה. ככל שהניחוש מפתיע יותר —
          שווה יותר נקודות.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={!configured}
          className="btn-primary mt-8 w-full bg-white !text-grass-800 shadow-card ring-1 ring-black/10 hover:bg-grass-50"
        >
          <GoogleIcon />
          התחברות עם Google
        </button>

        {!configured && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
            ⚠️ Supabase לא הוגדר עדיין. השלם את משתני הסביבה
            (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) לפי ה-README.
          </p>
        )}

        <p className="mt-6 text-xs text-grass-400">
          הכניסה דרך Google בלבד · הנתונים משותפים בין כל החברים
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 5 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 5 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.9 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.6 5.1C9 40.3 15.9 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.6 36.4 44 30.8 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

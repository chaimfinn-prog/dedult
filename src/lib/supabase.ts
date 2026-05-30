import { createClient } from "@supabase/supabase-js";

// משתני סביבה מ-Vite (.env). אף סוד אמיתי לא נשמר כאן —
// מפתח ה-anon הוא ציבורי ומוגן ב-RLS בצד Supabase.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// אם לא הוגדר — נוצר לקוח "דמה" שמאפשר לאפליקציה לעלות במצב הדגמה
// ומציג למשתמש הודעה ברורה להשלמת ההגדרה (ראו README).
export const supabase = createClient(
  url ?? "https://demo.supabase.co",
  anonKey ?? "public-anon-demo-key",
);

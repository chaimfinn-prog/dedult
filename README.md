# ⚽ ניחושי מונדיאל 2026

אפליקציית ווב לניחושי מונדיאל 2026 לחבורת חברים — **בעברית מלאה, RTL, מובייל-פירסט**.
הכול רץ על שירותים חינמיים לגמרי, בלי כרטיס אשראי: **Supabase** (התחברות + מסד נתונים) +
**Vercel/Netlify** (אחסון) + **The Odds API** (יחסים).

> ⚠️ זהו פרויקט **חדש ונפרד לחלוטין**. הוא חי בענף `claude/new-session-R6B4u` בלבד —
> ענף ה-`main` עם האפליקציה הקודמת לא נגעו בו.

---

## ✨ מה יש כאן

- **התחברות Google בלבד** (Supabase Auth). אין גישה לתוכן בלי התחברות.
- **שני שלבי ניחושים:**
  - שלב 1 — ניחושים כלליים (אלוף, סגנית, מלך שערים, סגן, מלך בישולים, ולאיזה שלב מגיעה כל נבחרת). נסגר עם שריקת הפתיחה.
  - שלב 2 — ניחוש לכל משחק: כיוון (1X2) + תוצאה מדויקת. נסגר עם שריקת הפתיחה של המשחק.
- **מנוע ניקוד פרופורציונלי להסתברות** — ככל שהניחוש מפתיע יותר, שווה יותר נקודות. ליד כל בחירה מוצגים האחוז והנקודות הפוטנציאליות.
- **טבלת מובילים** עם פירוט מקור הנקודות.
- **מסך ניהול לאדמין:** הזנת תוצאות, ניהול משחקים, רענון יחסים, והזנת יחסים ידנית.

## 🧮 מנוע הניקוד (הלב)

נוסחה כללית:

```
נקודות = round( משקל_הקטגוריה × (1 / p) )
```

כאשר `p` היא ההסתברות **המנורמלת** (כל שוק מסתכם ל-100% אחרי הסרת מרווח הבית).

- ניחוש כללי נכון → נקודות לפי הנוסחה; שגוי → 0.
- ניחוש משחק: כיוון נכון → `round(1.5 × 1/p)`; תוצאה מדויקת → **בונוס קבוע +10** מעל ניקוד הכיוון.
- כל המשקלים והקבועים בקובץ אחד נוח לעריכה: [`src/config.ts`](src/config.ts).

המרת יחסים (`src/lib/odds.ts`):
- עשרוני: `p = 1 / יחס`
- אמריקאי `+X`: `p = 100 / (X+100)` · אמריקאי `-X`: `p = |X| / (|X|+100)`

הכול מכוסה בטסטים: `npm test` (מנוע הניקוד, המרת יחסים, וטבלת המובילים).

## 🚀 הרצה מקומית

```bash
npm install
cp .env.example .env      # מלא VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
npm test                  # הרצת הטסטים
npm run build             # בילד לפרודקשן (תיקיית dist)
```

האפליקציה עולה גם בלי Supabase (מצב הדגמה) ותציג הודעה להשלמת ההגדרה.

## 🛠️ הקמת Supabase (חינם, בלי כרטיס אשראי)

1. היכנס ל-[supabase.com](https://supabase.com) → **New Project** (חינם).
2. **מסד נתונים:** Dashboard → **SQL Editor** → הדבק את [`supabase/schema.sql`](supabase/schema.sql) → הרץ.
   - ערוך בקובץ את `admin_email()` לאימייל שלך (כרגע `chaimfinn@gmail.com`). זה קובע מי אדמין, גם ב-RLS.
3. **Google Sign-In:** Dashboard → **Authentication → Providers → Google** → הפעל,
   והדבק Client ID/Secret מ-[Google Cloud Console](https://console.cloud.google.com) (OAuth consent + OAuth client).
   הוסף ל-Authorized redirect URI את `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
4. **מפתחות:** Project Settings → API → העתק `Project URL` ו-`anon public key` אל `.env`.

## 💱 הקמת היחסים (The Odds API + Edge Function)

1. הירשם ב-[the-odds-api.com](https://the-odds-api.com) (חינם, 500 קריאות/חודש) וקבל API key.
2. שמור את המפתח כ-**Secret** ב-Supabase (לא בקוד!):
   ```bash
   supabase secrets set ODDS_API_KEY=xxxxxxxx
   ```
3. פרוס את ה-Edge Function:
   ```bash
   supabase functions deploy fetch-odds
   ```
4. במסך הניהול לחץ **"רענן יחסים עכשיו"**. הפונקציה מושכת `outrights` (אלוף) ו-`h2h` (1X2),
   מנרמלת ל-100%, ושומרת בטבלת `odds`. כדי לא לבזבז קריאות — רעננו פעם-פעמיים ביום.
5. שווקים שה-API לא מכסה (מלך שערים, בישולים, שלב לכל נבחרת) — הזן ידנית במסך הניהול.

> אם אין עדיין יחסים ב-DB, שוק האלוף מוצג מתוך נתוני זריעה ב-[`src/data/seedOdds.ts`](src/data/seedOdds.ts).

## ☁️ פריסה (Vercel / Netlify — חינם)

- **Vercel:** חבר את ה-repo, בחר את הענף, Framework=Vite. הגדר Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. קובץ `vercel.json` כבר מטפל ב-SPA routing.
- **Netlify:** קובץ `netlify.toml` מוכן (build=`npm run build`, publish=`dist`). הוסף את אותם משתני סביבה.
- אחרי הפריסה, הוסף את כתובת האתר ל-Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).

## 📁 מבנה

```
src/
  config.ts            # כל המשקלים והקבועים של הניקוד
  lib/
    scoring.ts         # מנוע הניקוד (+ scoring.test.ts)
    odds.ts            # המרת יחסים + נרמול (+ odds.test.ts)
    leaderboard.ts     # צבירת נקודות (+ leaderboard.test.ts)
    supabase.ts        # לקוח Supabase
    data.ts            # טעינת יחסים + fallback לזריעה
    types.ts
  data/                # 48 נבחרות + יחסי זריעה
  context/AuthContext.tsx
  components/          # Layout, OptionCard, Loading
  pages/               # Login, GeneralPicks, LiveMatches, Leaderboard, Admin, Rules
supabase/
  schema.sql           # טבלאות + RLS + טריגר פרופיל
  functions/fetch-odds # Edge Function למשיכת יחסים
```

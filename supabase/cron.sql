-- ============================================================
--  תזמון אוטומטי — עדכון תוצאות ויחסים בלי שאף אחד צריך ללחוץ.
--  הרץ פעם אחת ב-SQL Editor של Supabase, אחרי שהחלפת את הערכים למטה.
--
--  החלף:
--    <PROJECT_REF>  → מזהה הפרויקט (מתוך כתובת ה-URL של Supabase)
--    <ANON_KEY>     → Project Settings → API → anon public key
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---- תוצאות: כל 30 דקות, רק בשעות משחקים (16:00–23:00 UTC) ----
--  (חיסכון בקרדיטים — ה-tier החינמי = 500 קריאות/חודש)
select cron.schedule(
  'fetch-scores-live',
  '*/30 16-22 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- יחסים (אלוף + 1X2 + יצירת משחקים): פעם ביום (12:00 UTC) ----
select cron.schedule(
  'fetch-odds-daily',
  '0 12 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-odds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- שים לב: ה-tier החינמי = 500 קריאות/חודש. התזמון כאן (~450/חודש) נשאר בתוך
-- המכסה. אם תרצה תוצאות תכופות יותר (כל 10 דק') — דרוש tier בתשלום.

-- לצפייה בתזמונים:   select * from cron.job;
-- לביטול תזמון:      select cron.unschedule('fetch-scores-live');

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

-- ---- תוצאות חיות: כל 10 דקות ----
select cron.schedule(
  'fetch-scores-live',
  '*/10 * * * *',
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

-- ---- יחסים (אלוף + 1X2 + יצירת משחקים): פעמיים ביום (06:00 ו-18:00 UTC) ----
select cron.schedule(
  'fetch-odds-daily',
  '0 6,18 * * *',
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

-- לצפייה בתזמונים:   select * from cron.job;
-- לביטול תזמון:      select cron.unschedule('fetch-scores-live');

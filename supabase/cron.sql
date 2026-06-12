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

-- ---- תוצאות: כל 15 דקות, בחלון משחקי המונדיאל (15:00–03:00 UTC) ----
--  משחקי ארה"ב/קנדה/מקסיקו רצים בערב/לילה אמריקה = ערב/לילה בישראל.
--  (שים לב לקרדיטים — ראו הערה בתחתית)
select cron.schedule(
  'fetch-scores-live',
  '*/15 0-3,15-23 * * *',
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

-- שים לב לקרדיטים: ה-tier החינמי = 500 קריאות/חודש. החלון כאן (~16 שעות ביום,
-- כל 15 דק') צורך הרבה אם רץ כל יום. מומלץ להפעיל את התזמון רק בימי משחקים,
-- או להחזיק 2 מפתחות API (ראו ההסבר על מפתח שני). אפשר לצמצם ל-'*/30' אם צריך.

-- לצפייה בתזמונים:   select * from cron.job;
-- לביטול תזמון:      select cron.unschedule('fetch-scores-live');

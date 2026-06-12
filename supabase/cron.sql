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

-- ---- תוצאות: כל 10 דקות בשעות הצפייה (20:00–00:00 שעון ישראל),
--       + עדכון יחיד ב-07:00 בוקר ישראל (תופס משחקי לילה שהסתיימו).
--   שעון ישראל קיץ = UTC+3:  20:00–24:00 IL = 17:00–21:00 UTC ; 07:00 IL = 04:00 UTC.
select cron.schedule(
  'fetch-scores-evening',
  '*/10 17-20 * * *',   -- כל 10 דק' בין 17:00–20:59 UTC (=20:00–23:59 ישראל)
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

-- עדכון אחד בבוקר (07:00 שעון ישראל = 04:00 UTC) — תופס תוצאות משחקי הלילה
select cron.schedule(
  'fetch-scores-morning',
  '0 4 * * *',
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

-- קרדיטים: ערב (4 שעות × 6/שעה = 24) + בוקר (1) + יחסים (1) = ~26 קריאות/יום.
-- ~26 × 30 ימים ≈ 780/חודש. ה-tier החינמי = 500, אז זה דורש 2 מפתחות API
-- (שני חשבונות = 1000 קרדיטים), או הפעלה רק בימי משחקים. לצמצום: '*/15' בערב.

-- לצפייה בתזמונים:   select * from cron.job;
-- לביטול תזמון:      select cron.unschedule('fetch-scores-live');

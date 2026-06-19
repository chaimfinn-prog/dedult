-- ============================================================
--  תזמון אוטומטי — עדכון תוצאות ויחסים בלי שאף אחד צריך ללחוץ.
--  הרץ פעם אחת ב-SQL Editor של Supabase, אחרי שהחלפת את הערכים למטה.
--
--  החלף:
--    <PROJECT_REF>  → מזהה הפרויקט (מתוך כתובת ה-URL של Supabase)
--    <ANON_KEY>     → Project Settings → API → anon public key
--
--  שעון: pg_cron רץ ב-UTC. קיץ בישראל = UTC+3 (IDT) לאורך כל המונדיאל.
--  שמירת שבת: לא מושכים תוצאות מ-19:00 יום ו' (=16:00 UTC) עד מוצ"ש,
--             ומושכים עדכון יחיד ב-20:15 מוצ"ש (=17:15 UTC).
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ניקוי תזמונים קודמים (כדי שאפשר להריץ את הקובץ שוב בבטחה)
do $$
declare j text;
begin
  foreach j in array array[
    'fetch-scores-evening','fetch-scores-morning','fetch-scores-live',
    'fetch-scores-sun-thu','fetch-scores-friday','fetch-scores-motzash',
    'fetch-scores-motzash-night','fetch-odds-daily'
  ] loop
    perform cron.unschedule(jobid) from cron.job where jobname = j;
  end loop;
end $$;

-- פונקציית עזר: שולחת POST ל-Edge Function (מקצרת חזרתיות)
-- (נשארת inline בכל job כי cron.schedule דורש מחרוזת SQL)

-- ---- תוצאות: ימים א'–ה' בערב (20:00–23:59 IL = 17:00–20:59 UTC), כל 20 דק' ----
select cron.schedule(
  'fetch-scores-sun-thu',
  '*/20 17-20 * * 0-4',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- יום ו' (לפני כניסת שבת): רק עד 15:59 UTC (=18:59 IL), כל 20 דק' ----
select cron.schedule(
  'fetch-scores-friday',
  '*/20 10-15 * * 5',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- מוצ"ש: עדכון יחיד ב-20:15 IL (=17:15 UTC) ----
select cron.schedule(
  'fetch-scores-motzash',
  '15 17 * * 6',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- מוצ"ש בלילה: משחקי שבת בערב (21:00–23:59 IL = 18:00–20:59 UTC), כל 20 דק' ----
select cron.schedule(
  'fetch-scores-motzash-night',
  '*/20 18-20 * * 6',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- סריקת בוקר (07:00 IL = 04:00 UTC) ימים א'–ו' (לא שבת) — תופס משחקי לילה ----
select cron.schedule(
  'fetch-scores-morning',
  '0 4 * * 0-5',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-scores',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---- יחסים (אלוף + 1X2 + יצירת משחקים): פעם ביום (12:00 UTC), לא בשבת ----
select cron.schedule(
  'fetch-odds-daily',
  '0 12 * * 0-5',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-odds',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    body    := '{}'::jsonb
  );
  $$
);

-- אומדן קריאות/שבוע: א'-ה' ערב 12×5=60 · ו' יום 18 · מוצ"ש 1+9=10 · בוקר 6 · יחסים 6
--   ≈ 100/שבוע ≈ 400/חודש — בנוח מתחת ל-500. אפשר לצמצם עוד ע"י */30.

-- לצפייה בתזמונים:   select jobname, schedule from cron.job order by jobname;
-- לביטול:           select cron.unschedule('<jobname>');

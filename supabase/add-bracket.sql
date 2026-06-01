-- ============================================================
--  מיגרציה: עמודת bracket (לוח העץ האינטראקטיבי) ב-general_picks.
--  הרץ פעם אחת ב-SQL Editor אם כבר הרצת את schema.sql בעבר.
-- ============================================================
alter table public.general_picks
  add column if not exists bracket jsonb not null default '{}'::jsonb;

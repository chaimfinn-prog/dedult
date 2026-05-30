-- ============================================================
--  מיגרציה: תמיכה בעדכון תוצאות אוטומטי (לייב)
--  הרץ פעם אחת ב-SQL Editor אם כבר הרצת את schema.sql בעבר.
-- ============================================================
alter table public.matches add column if not exists ext_id text;
alter table public.matches add column if not exists live boolean not null default false;

-- ייחודיות על ext_id (אם עדיין לא קיימת)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_ext_id_key'
  ) then
    alter table public.matches add constraint matches_ext_id_key unique (ext_id);
  end if;
end $$;

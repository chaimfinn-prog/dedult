-- ============================================================
--  מיגרציה: דגל "פעיל" למשתתפים — אדמין יכול להוציא מי שלא שילם.
--  לא מוחק נתונים! רק מסמן לא-פעיל, וכך לא נספר בדירוג/קופה.
--  הרץ פעם אחת ב-SQL Editor (בטוח להריץ שוב).
-- ============================================================
alter table public.profiles
  add column if not exists active boolean not null default true;

-- רק אדמין רשאי לעדכן את שדה ה-active של אחרים
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

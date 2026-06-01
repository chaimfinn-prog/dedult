-- ============================================================
--  אבטחה: מניעת עריכת ניחושים אחרי שהמשחק/הטורניר התחיל — גם בצד השרת.
--  ה-UI כבר נועל, אבל זה אוכף את זה ברמת מסד הנתונים (RLS + טריגרים),
--  כך שאי אפשר לעקוף דרך קריאות API ישירות.
--  הרץ פעם אחת ב-SQL Editor.
-- ============================================================

-- מועד שריקת הפתיחה של הטורניר (לניחושים הכלליים)
create or replace function public.tournament_kickoff() returns timestamptz
language sql immutable as $$ select '2026-06-11T19:00:00Z'::timestamptz $$;

-- כמה דקות לפני משחק הניחוש נסגר
create or replace function public.match_lock_minutes() returns int
language sql immutable as $$ select 15 $$;

-- ---- ניחושים כלליים: חסומים אחרי שריקת הפתיחה ----
create or replace function public.enforce_general_lock() returns trigger
language plpgsql as $$
begin
  if now() >= public.tournament_kickoff() then
    raise exception 'הניחושים הכלליים ננעלו (הטורניר התחיל)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_general_lock on public.general_picks;
create trigger trg_general_lock
  before insert or update on public.general_picks
  for each row execute function public.enforce_general_lock();

-- ---- ניחושי משחק: חסומים מ-15 דקות לפני שריקת הפתיחה של אותו משחק ----
create or replace function public.enforce_match_lock() returns trigger
language plpgsql as $$
declare
  ko timestamptz;
begin
  select kickoff into ko from public.matches where id = new.match_id;
  if ko is null then
    raise exception 'משחק לא קיים';
  end if;
  if now() >= ko - make_interval(mins => public.match_lock_minutes()) then
    raise exception 'הניחוש למשחק זה ננעל (פחות מ-% דקות לשריקה)', public.match_lock_minutes();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_match_lock on public.match_picks;
create trigger trg_match_lock
  before insert or update on public.match_picks
  for each row execute function public.enforce_match_lock();

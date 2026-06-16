-- ============================================================
--  security-hardening.sql — סגירת פרצות אבטחה במערכת הניחושים
--  הרץ פעם אחת ב-Supabase → SQL Editor (אחרי schema.sql).
--  אידמפוטנטי — אפשר להריץ שוב בבטחה.
--
--  מה זה סוגר:
--   1. is_admin() קרא מ-auth.users (שאין לתפקיד authenticated הרשאה אליו)
--      ולכן החזיר תמיד false → כל כתיבת אדמין מה-UI נחסמה בשקט (RLS).
--      התיקון קורא את האימייל מתוך ה-JWT, ועובד גם בהקשר invoker.
--   2. שדה direction ב-match_picks היה מנותק מהתוצאה → ניתן היה לכתוב ב-API
--      ישיר תוצאה של פייבוריט עם direction של אנדרדוג ולנפח נקודות.
--      טריגר קובע את direction מהתוצאה בשרת, ו-CHECK אוכף עקביות.
--   3. updated_at נשלח מהלקוח (ניתן לזיוף) → טריגר קובע now() בשרת.
--   4. נעילת ניחושים אחרי שריקת הפתיחה לא נאכפה בצד השרת (הטריגרים לא הותקנו).
--   5. אין תיעוד לשינויים → טבלת audit + טריגר שמתעדים כל שינוי.
-- ============================================================

-- ============================================================
--  1. תיקון is_admin() — קריאת אימייל מה-JWT (לא מ-auth.users)
-- ============================================================
create or replace function public.admin_email() returns text
language sql immutable as $$ select 'chaimfinn@gmail.com'::text $$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    lower(coalesce(
      nullif(auth.jwt() ->> 'email', ''),
      auth.jwt() -> 'user_metadata' ->> 'email'
    )) = lower(public.admin_email()),
    false
  )
$$;

-- ============================================================
--  2. נעילת זמן — קבועים (תואם config.ts)
-- ============================================================
create or replace function public.tournament_kickoff() returns timestamptz
language sql immutable as $$ select '2026-06-11T19:00:00Z'::timestamptz $$;

create or replace function public.match_lock_minutes() returns int
language sql immutable as $$ select 15 $$;

-- ============================================================
--  3. ניחושים כלליים — נעילה אחרי שריקת הפתיחה + updated_at בשרת
--     (אדמין פטור מהנעילה כדי שיוכל לתקן)
-- ============================================================
create or replace function public.enforce_general_lock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();                 -- חותמת שרת, מתעלם מהלקוח
  if public.is_admin() then return new; end if;
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

-- ============================================================
--  4. ניחושי משחק — נעילה 15 דק' לפני שריקה + direction נגזר מהתוצאה
--     + updated_at בשרת. (אדמין פטור מהנעילה)
-- ============================================================
create or replace function public.enforce_match_pick() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ko timestamptz;
begin
  -- direction תמיד נגזר מהתוצאה — מבטל ניתוק כיוון/תוצאה (הניצול)
  if new.pred_home > new.pred_away then new.direction := 'home';
  elsif new.pred_home < new.pred_away then new.direction := 'away';
  else new.direction := 'draw';
  end if;

  new.updated_at := now();                 -- חותמת שרת, מתעלם מהלקוח

  if public.is_admin() then return new; end if;

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

drop trigger if exists trg_match_lock on public.match_picks;       -- הישן (אם קיים)
drop trigger if exists trg_match_pick on public.match_picks;
create trigger trg_match_pick
  before insert or update on public.match_picks
  for each row execute function public.enforce_match_pick();

-- ============================================================
--  5. CHECK constraint — direction חייב להתאים לתוצאה (הגנה כפולה).
--     NOT VALID: לא נכשל על שורות ישנות, אך נאכף על כל כתיבה חדשה.
-- ============================================================
alter table public.match_picks
  drop constraint if exists match_picks_direction_matches_score;
alter table public.match_picks
  add constraint match_picks_direction_matches_score
  check (
    direction = case
      when pred_home > pred_away then 'home'
      when pred_home < pred_away then 'away'
      else 'draw'
    end
  ) not valid;

-- ============================================================
--  6. לוג ביקורת — מתעד כל שינוי ב-match_picks (מי, מתי, ערך ישן→חדש)
-- ============================================================
create table if not exists public.match_picks_audit (
  id          bigint generated always as identity primary key,
  user_id     uuid,
  match_id    bigint,
  op          text,                         -- INSERT / UPDATE / DELETE
  old_home    int, old_away int, old_dir text,
  new_home    int, new_away int, new_dir text,
  changed_by  uuid,                         -- מי ביצע (auth.uid)
  changed_at  timestamptz not null default now()
);

alter table public.match_picks_audit enable row level security;
drop policy if exists "mpa_admin_read" on public.match_picks_audit;
create policy "mpa_admin_read" on public.match_picks_audit for select
  to authenticated using (public.is_admin());

create or replace function public.log_match_pick_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.match_picks_audit(
    user_id, match_id, op,
    old_home, old_away, old_dir,
    new_home, new_away, new_dir,
    changed_by
  ) values (
    coalesce(new.user_id, old.user_id),
    coalesce(new.match_id, old.match_id),
    tg_op,
    old.pred_home, old.pred_away, old.direction,
    new.pred_home, new.pred_away, new.direction,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_match_pick_audit on public.match_picks;
create trigger trg_match_pick_audit
  after insert or update or delete on public.match_picks
  for each row execute function public.log_match_pick_change();

-- ============================================================
--  בדיקה מהירה אחרי הרצה:
--   select public.is_admin();                         -- אמור להחזיר true עבור האדמין
--   select tgname from pg_trigger
--     where tgname in ('trg_match_pick','trg_general_lock','trg_match_pick_audit');
-- ============================================================

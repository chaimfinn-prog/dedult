-- ============================================================
--  סכמת מסד הנתונים לאפליקציית ניחושי מונדיאל 2026 (Supabase / Postgres)
--  הרצה: Supabase Dashboard → SQL Editor → הדבק והרץ.
-- ============================================================

-- --- הגדרת האדמין לפי אימייל (ערוך לאימייל שלך) ---
-- משמש בפונקציית is_admin() ובכללי ה-RLS.
create or replace function public.admin_email() returns text
language sql immutable as $$ select 'chaimfinn@gmail.com'::text $$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = public.admin_email(),
    false
  )
$$;

-- ============================================================
--  פרופילים — נוצר אוטומטית מ-Google בכניסה ראשונה
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text,
  active      boolean not null default true, -- אדמין יכול להוציא מי שלא שילם
  created_at  timestamptz not null default now()
);

-- טריגר: יצירת פרופיל אוטומטית כשמשתמש חדש נרשם
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  יחסים (odds) — מנורמלים ל-100%, נשמרים פר שוק/אופציה
-- ============================================================
-- market: 'champion' | 'runnerUp' | 'topScorer' | 'secondScorer' |
--         'topAssists' | 'stage:<TEAM>' | 'match:<MATCH_ID>'
create table if not exists public.odds (
  id          bigint generated always as identity primary key,
  market      text not null,
  option_id   text not null,           -- קוד נבחרת / שם שחקן / כיוון / שלב
  label       text not null,
  prob        double precision not null check (prob > 0 and prob <= 1), -- מנורמל
  source      text not null default 'manual',  -- 'api' | 'manual'
  updated_at  timestamptz not null default now(),
  unique (market, option_id)
);

-- ============================================================
--  משחקים
-- ============================================================
create table if not exists public.matches (
  id          bigint generated always as identity primary key,
  ext_id      text unique,              -- מזהה המשחק ב-The Odds API (לעדכון אוטומטי)
  stage       text not null default 'groups',
  home_team   text not null,
  away_team   text not null,
  kickoff     timestamptz not null,
  home_score  int,                      -- מתעדכן אוטומטית מ-fetch-scores (או ע"י אדמין)
  away_score  int,
  live        boolean not null default false,  -- משחק מתנהל כעת
  finished    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
--  ניחושים כלליים (שלב 1) — שורה אחת למשתמש
-- ============================================================
create table if not exists public.general_picks (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  champion       text,
  runner_up      text,
  top_scorer     text,
  second_scorer  text,
  top_assists    text,
  golden_glove      text, -- כפפת הזהב (שוער)
  golden_ball       text, -- כדור הזהב (מצטיין)
  most_goals_team   text, -- קבוצה שכובשת הכי הרבה
  best_defense_team text, -- הגנה הכי טובה
  stages         jsonb not null default '{}'::jsonb, -- { "ARG": "final", ... } (נגזר מהלוח)
  bracket        jsonb not null default '{}'::jsonb, -- לוח העץ המלא של המשתמש
  updated_at     timestamptz not null default now()
);

-- ============================================================
--  ניחושי משחקים (שלב 2)
-- ============================================================
create table if not exists public.match_picks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  match_id    bigint not null references public.matches(id) on delete cascade,
  direction   text not null check (direction in ('home','draw','away')),
  pred_home   int not null,
  pred_away   int not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- ============================================================
--  תוצאות אמת לקטגוריות הכלליות (מוזן ע"י אדמין)
-- ============================================================
create table if not exists public.results (
  key    text primary key,  -- 'champion' | 'runnerUp' | 'topScorer' | 'stage:<TEAM>' ...
  value  text not null
);

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.odds          enable row level security;
alter table public.matches       enable row level security;
alter table public.general_picks enable row level security;
alter table public.match_picks   enable row level security;
alter table public.results       enable row level security;

-- פרופילים: כולם רואים את כולם (לטבלת המובילים), כל אחד מעדכן רק את שלו
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select
  to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  to authenticated using (auth.uid() = id);

-- יחסים/משחקים/תוצאות: קריאה לכולם; כתיבה לאדמין בלבד
drop policy if exists "odds_select_all" on public.odds;
create policy "odds_select_all" on public.odds for select to authenticated using (true);
drop policy if exists "odds_admin_write" on public.odds;
create policy "odds_admin_write" on public.odds for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all" on public.matches for select to authenticated using (true);
drop policy if exists "matches_admin_write" on public.matches;
create policy "matches_admin_write" on public.matches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "results_select_all" on public.results;
create policy "results_select_all" on public.results for select to authenticated using (true);
drop policy if exists "results_admin_write" on public.results;
create policy "results_admin_write" on public.results for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ניחושים כלליים: כולם רואים (לשקיפות הדירוג), כל אחד כותב רק את שלו
drop policy if exists "gp_select_all" on public.general_picks;
create policy "gp_select_all" on public.general_picks for select to authenticated using (true);
drop policy if exists "gp_write_own" on public.general_picks;
create policy "gp_write_own" on public.general_picks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ניחושי משחקים: כולם רואים, כל אחד כותב רק את שלו
drop policy if exists "mp_select_all" on public.match_picks;
create policy "mp_select_all" on public.match_picks for select to authenticated using (true);
drop policy if exists "mp_write_own" on public.match_picks;
create policy "mp_write_own" on public.match_picks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

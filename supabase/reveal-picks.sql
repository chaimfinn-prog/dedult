-- ============================================================
--  חשיפת ניחושי החברים — רק אחרי שהדדליין נעל את אותו ניחוש.
--  אכיפה אמיתית בצד השרת: ניחושים של אחרים מוסתרים עד הנעילה.
--  הרץ פעם אחת ב-SQL Editor (אחרי schema.sql + lock-after-kickoff.sql).
-- ============================================================

-- ודא שהפונקציות מ-lock-after-kickoff.sql קיימות (מועד שריקה + דקות נעילה).
create or replace function public.tournament_kickoff() returns timestamptz
language sql immutable as $$ select '2026-06-11T19:00:00Z'::timestamptz $$;

-- ---- הקשחת RLS: כל אחד רואה ישירות רק את הניחושים של עצמו ----
drop policy if exists "gp_select_all" on public.general_picks;
drop policy if exists "gp_select_own" on public.general_picks;
create policy "gp_select_own" on public.general_picks for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "mp_select_all" on public.match_picks;
drop policy if exists "mp_select_own" on public.match_picks;
create policy "mp_select_own" on public.match_picks for select
  to authenticated using (auth.uid() = user_id);

-- ============================================================
--  RPC לחשיפה מבוקרת (SECURITY DEFINER עוקף RLS, אך עם שער-זמן)
-- ============================================================

-- ניחושים כלליים: נחשפים רק אחרי שריקת הפתיחה של הטורניר (ואת שלך תמיד).
-- אדמין רואה הכל בכל עת (לצורך גיבוי/ייצוא).
create or replace function public.reveal_general_picks()
returns setof public.general_picks
language sql stable security definer set search_path = public as $$
  select * from public.general_picks
  where user_id = auth.uid()
     or public.is_admin()
     or now() >= public.tournament_kickoff();
$$;

-- ניחושי משחק: נחשפים רק אחרי שריקת הפתיחה של אותו משחק (ואת שלך תמיד).
-- אדמין רואה הכל בכל עת.
create or replace function public.reveal_match_picks()
returns setof public.match_picks
language sql stable security definer set search_path = public as $$
  select mp.* from public.match_picks mp
  join public.matches m on m.id = mp.match_id
  where mp.user_id = auth.uid()
     or public.is_admin()
     or now() >= m.kickoff;
$$;

grant execute on function public.reveal_general_picks() to authenticated;
grant execute on function public.reveal_match_picks() to authenticated;

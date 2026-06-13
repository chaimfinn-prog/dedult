-- ============================================================
--  תיקון יחסי 1X2 פגומים במשחקי הפתיחה (id 1-8).
--  נמשכו ע"י גרסה ישנה של fetch-odds שמיפתה כיוונים שגוי (ה-draw בלע
--  את הפייבוריט). מעדכן להסתברויות הנכונות (מנורמלות) לפי יחסי אתר הימורים.
--  הרץ פעם אחת ב-SQL Editor. הניקוד יחושב מחדש אוטומטית.
-- ============================================================
do $$
declare
  ext text;
  rec record;
  vals jsonb := jsonb_build_object(
    '1', jsonb_build_object('home',0.580,'draw',0.248,'away',0.171),
    '2', jsonb_build_object('home',0.381,'draw',0.292,'away',0.327),
    '3', jsonb_build_object('home',0.514,'draw',0.262,'away',0.224),
    '4', jsonb_build_object('home',0.432,'draw',0.288,'away',0.280),
    '5', jsonb_build_object('home',0.079,'draw',0.147,'away',0.773),
    '6', jsonb_build_object('home',0.591,'draw',0.232,'away',0.177),
    '7', jsonb_build_object('home',0.133,'draw',0.221,'away',0.646),
    '8', jsonb_build_object('home',0.259,'draw',0.252,'away',0.489)
  );
begin
  for rec in select id, ext_id, home_team, away_team from public.matches where id between 1 and 8 loop
    ext := 'match:' || rec.ext_id;
    -- upsert של 3 הכיוונים להסתברויות הנכונות (יוצר אם חסר, מעדכן אם קיים)
    insert into public.odds (market, option_id, label, prob, source, updated_at)
    values
      (ext, 'home', rec.home_team, (vals->(rec.id::text)->>'home')::float8, 'manual-fix', now()),
      (ext, 'draw', 'Draw',        (vals->(rec.id::text)->>'draw')::float8, 'manual-fix', now()),
      (ext, 'away', rec.away_team, (vals->(rec.id::text)->>'away')::float8, 'manual-fix', now())
    on conflict (market, option_id) do update
      set prob = excluded.prob, label = excluded.label, updated_at = now();
  end loop;
end $$;

-- אימות
select m.id, m.home_team, m.away_team,
  max(case when o.option_id='home' then round(o.prob::numeric,2) end) p_home,
  max(case when o.option_id='draw' then round(o.prob::numeric,2) end) p_draw,
  max(case when o.option_id='away' then round(o.prob::numeric,2) end) p_away
from matches m join odds o on o.market='match:'||m.ext_id
where m.id between 1 and 8 group by m.id, m.home_team, m.away_team order by m.id;

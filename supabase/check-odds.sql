-- ============================================================
--  check-odds.sql — בדיקת תקינות יחסי 1X2 לכל המשחקים הקרובים.
--  מסמן משחקים חשודים:
--    • "התיקו פייבוריט" → כמעט תמיד באג מיפוי (היחס של הפייבוריט נכנס לתיקו)
--    • "חסרות אופציות" → פחות מ-3 שורות (home/draw/away)
--    • "סכום לא מנורמל" → סכום ההסתברויות רחוק מ-1
--  הרץ ב-SQL Editor כדי "לעבור על כל היחסים" במכה אחת.
-- ============================================================

with mx as (
  select o.market,
         max(o.prob) filter (where o.option_id = 'home') as ph,
         max(o.prob) filter (where o.option_id = 'draw') as pd,
         max(o.prob) filter (where o.option_id = 'away') as pa,
         count(*) as n,
         sum(o.prob) as tot
  from public.odds o
  where o.market like 'match:%'
  group by o.market
)
select m.id,
       m.home_team, m.away_team,
       to_char(m.kickoff, 'DD/MM HH24:MI') as kickoff,
       round(mx.ph::numeric, 3) as home,
       round(mx.pd::numeric, 3) as draw,
       round(mx.pa::numeric, 3) as away,
       mx.n as options,
       case
         when mx.n is null or mx.n < 3 then '❌ חסרות אופציות'
         when mx.pd >= mx.ph and mx.pd >= mx.pa then '⚠️ התיקו פייבוריט (חשוד!)'
         when abs(mx.tot - 1) > 0.05 then '⚠️ סכום לא מנורמל'
         else '✅ תקין'
       end as status
from public.matches m
left join mx on ('match:' || coalesce(m.ext_id, m.id::text)) = mx.market
where m.finished = false
order by
  case
    when mx.n is null or mx.n < 3 then 0
    when mx.pd >= mx.ph and mx.pd >= mx.pa then 1
    else 2
  end,
  m.kickoff;

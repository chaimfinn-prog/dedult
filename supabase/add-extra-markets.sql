-- ============================================================
--  מיגרציה: שווקים כלליים נוספים ב-general_picks.
--  הרץ פעם אחת ב-SQL Editor (בטוח להריץ שוב).
-- ============================================================
alter table public.general_picks
  add column if not exists golden_glove      text, -- כפפת הזהב (שוער)
  add column if not exists golden_ball       text, -- כדור הזהב (מצטיין)
  add column if not exists most_goals_team   text, -- קבוצה שכובשת הכי הרבה (קוד נבחרת)
  add column if not exists best_defense_team text; -- הגנה הכי טובה (קוד נבחרת)

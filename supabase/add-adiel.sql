-- ============================================================
--  הוספת משתתף "עדיאל הכט" עם ניחושים מלאים (פייבוריטים)
--  הרץ פעם אחת ב-SQL Editor. בטוח להריץ שוב (idempotent).
-- ============================================================
-- מנטרל זמנית את טריגרי הנעילה (כדי שאפשר יהיה למלא גם אחרי תחילת הטורניר)
alter table public.general_picks disable trigger trg_general_lock;
alter table public.match_picks   disable trigger trg_match_lock;

do $$
declare
  uid uuid;
begin
  -- צור משתמש auth (או מצא קיים לפי אימייל)
  select id into uid from auth.users where email = 'adiel.hecht@mondial.local';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data)
    values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'adiel.hecht@mondial.local', crypt('Mondial2026!', gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"עדיאל הכט"}'::jsonb);
  end if;

  -- פרופיל
  insert into public.profiles (id, full_name, email, active)
  values (uid, 'עדיאל הכט', 'adiel.hecht@mondial.local', true)
  on conflict (id) do update set full_name = excluded.full_name, active = true;

  -- ניחושים כלליים (פייבוריטים) + לוח עץ מלא
  insert into public.general_picks
    (user_id, top_scorer, second_scorer, top_assists, golden_ball, golden_glove,
     most_goals_team, best_defense_team, bracket, updated_at)
  values
    (uid, 'קיליאן אמבפה', 'הארי קיין', 'ליאו מסי', 'קיליאן אמבפה',
     'אמיליאנו מרטינס', 'ESP', 'FRA',
     '{"groupRankings":{"A":["MEX","RSA","KOR","CZE"],"B":["CAN","BIH","QAT","SUI"],"C":["BRA","MAR","HAI","SCO"],"D":["USA","PAR","AUS","TUR"],"E":["GER","CUW","CIV","ECU"],"F":["NED","JPN","SWE","TUN"],"G":["BEL","EGY","IRN","NZL"],"H":["ESP","CPV","KSA","URU"],"I":["FRA","SEN","IRQ","NOR"],"J":["ARG","ALG","AUT","JOR"],"K":["POR","COD","UZB","COL"],"L":["ENG","CRO","GHA","PAN"]},"thirdSlots":{"74":"A","77":"C","79":"E","80":"H","81":"B","82":"I","85":"F","87":"D"},"winners":{"73":"BIH","74":"GER","75":"NED","76":"BRA","77":"FRA","78":"SEN","79":"MEX","80":"ENG","81":"USA","82":"BEL","83":"CRO","84":"ESP","85":"SWE","86":"ARG","87":"POR","88":"PAR","89":"FRA","90":"NED","91":"BRA","92":"ENG","93":"ESP","94":"BEL","95":"ARG","96":"POR","97":"FRA","98":"ESP","99":"ENG","100":"ARG","101":"ESP","102":"ENG","104":"ESP"}}'::jsonb, now())
  on conflict (user_id) do update set
     top_scorer=excluded.top_scorer, second_scorer=excluded.second_scorer,
     top_assists=excluded.top_assists, golden_ball=excluded.golden_ball,
     golden_glove=excluded.golden_glove, most_goals_team=excluded.most_goals_team,
     best_defense_team=excluded.best_defense_team, bracket=excluded.bracket;

  -- שני משחקי הפתיחה של הערב (לפי שמות הקבוצות)
  insert into public.match_picks (user_id, match_id, direction, pred_home, pred_away, updated_at)
  select uid, m.id, 'home', 2, 0, now()
  from public.matches m
  where m.home_team='MEX' and m.away_team='RSA'
  on conflict (user_id, match_id) do nothing;

  insert into public.match_picks (user_id, match_id, direction, pred_home, pred_away, updated_at)
  select uid, m.id, 'away', 0, 1, now()
  from public.matches m
  where m.home_team='KOR' and m.away_team='CZE'
  on conflict (user_id, match_id) do nothing;
end $$;

-- מחזיר את טריגרי הנעילה
alter table public.general_picks enable trigger trg_general_lock;
alter table public.match_picks   enable trigger trg_match_lock;

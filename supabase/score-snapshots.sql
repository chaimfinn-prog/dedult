-- ============================================================
--  score-snapshots.sql — היסטוריית דירוג לגרף "מירוץ המקומות".
--  כל משתמש מתעד שורה אחת לכל "דלי שעה" (bucket) עם הנקודות והמקום שלו.
--  הגרף ב-Stats קורא את כל השורות ומצייר את שינוי המקומות לאורך זמן.
--  הרץ פעם אחת ב-SQL Editor (אחרי schema.sql).
-- ============================================================

create table if not exists public.score_snapshots (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  bucket      timestamptz not null,            -- תחילת השעה (date_trunc('hour'))
  total       int not null,
  rank        int not null,
  captured_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

create index if not exists score_snapshots_bucket_idx on public.score_snapshots(bucket);

alter table public.score_snapshots enable row level security;

-- כולם רואים (לגרף); כל אחד כותב רק את השורה של עצמו
drop policy if exists "snap_select_all" on public.score_snapshots;
create policy "snap_select_all" on public.score_snapshots for select
  to authenticated using (true);

drop policy if exists "snap_write_own" on public.score_snapshots;
create policy "snap_write_own" on public.score_snapshots for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ניקוי אוטומטי אופציונלי: אפשר להריץ מדי פעם כדי לדלל דליים ישנים.
-- delete from public.score_snapshots where bucket < now() - interval '60 days';

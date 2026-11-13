-- manual_visited_places (0001_init.sql) only ever stored a free-text
-- `name` ("آيسلندا" or "باريس، فرنسا"), with no structured country —
-- so the passport screen's "دولة"/"مدينة" counts, which group by
-- destination.country, had no way to credit a manually-added stamp at
-- all. AddVisitedPlaceScreen already knows the real country at add
-- time (either the picked country itself, or the city's region from
-- Google) — this just gives it somewhere real to land.
alter table public.manual_visited_places add column if not exists country text;
alter table public.manual_visited_places add column if not exists kind text not null default 'city'
  check (kind in ('country', 'city'));

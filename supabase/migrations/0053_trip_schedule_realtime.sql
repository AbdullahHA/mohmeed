-- Live collaborative trip planning: itinerary/budget/checklist edits need to
-- reach every trip member's screen instantly, same as trip_messages already
-- does (0014_trip_schedule_v2.sql). Add the three schedule-tab tables to the
-- realtime publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'itinerary_items'
  ) then
    alter publication supabase_realtime add table public.itinerary_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budget_items'
  ) then
    alter publication supabase_realtime add table public.budget_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_checklist'
  ) then
    alter publication supabase_realtime add table public.trip_checklist;
  end if;
end $$;

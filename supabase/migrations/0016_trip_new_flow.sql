-- Backs SPEC §22.1 (new-trip 3-question flow) and §22.7 (group date voting).
alter table public.trips add column if not exists traveler_type text
  check (traveler_type in ('solo', 'couple', 'family', 'group'));
alter table public.trips add column if not exists needs text[] not null default '{}';
alter table public.trips add column if not exists dates_mode text
  check (dates_mode in ('exact', 'flexible', 'vote')) not null default 'exact';
alter table public.trips add column if not exists flexible_month text;
alter table public.trips add column if not exists flexible_days int;

create table if not exists public.trip_date_votes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (trip_id, user_id, date)
);

alter table public.trip_date_votes enable row level security;

create policy "trip members read date votes" on public.trip_date_votes for select
  to authenticated using (public.is_trip_member(trip_id));

create policy "members vote for themselves" on public.trip_date_votes for insert
  to authenticated with check (public.is_trip_member(trip_id) and user_id = auth.uid());

create policy "members delete their own votes" on public.trip_date_votes for delete
  to authenticated using (user_id = auth.uid());

alter publication supabase_realtime add table public.trip_date_votes;

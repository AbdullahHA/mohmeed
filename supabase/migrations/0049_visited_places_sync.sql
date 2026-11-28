-- public.visited_stamps already exists (0001_init.sql) with profile_id/
-- destination_id columns and a write-only RLS policy — add a public-read
-- policy so a profile's stamps can be shown on someone else's screen too.
drop policy if exists "visited stamps are readable by any signed-in user" on public.visited_stamps;
create policy "visited stamps are readable by any signed-in user" on public.visited_stamps for select
  to authenticated using (true);

create table if not exists public.manual_visited_places (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  visited_at timestamptz not null default now()
);

alter table public.manual_visited_places enable row level security;

drop policy if exists "manual visited places are readable by any signed-in user" on public.manual_visited_places;
create policy "manual visited places are readable by any signed-in user" on public.manual_visited_places for select
  to authenticated using (true);

drop policy if exists "users manage their own manual visited places" on public.manual_visited_places;
create policy "users manage their own manual visited places" on public.manual_visited_places for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

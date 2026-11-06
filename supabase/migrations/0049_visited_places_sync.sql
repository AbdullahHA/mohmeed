create table if not exists public.visited_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination_id text not null,
  visited_at timestamptz not null default now(),
  unique (user_id, destination_id)
);

create table if not exists public.manual_visited_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  visited_at timestamptz not null default now()
);

alter table public.visited_stamps enable row level security;
alter table public.manual_visited_places enable row level security;

create policy "visited stamps are readable by any signed-in user" on public.visited_stamps for select
  to authenticated using (true);

create policy "users manage their own visited stamps" on public.visited_stamps for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "manual visited places are readable by any signed-in user" on public.manual_visited_places for select
  to authenticated using (true);

create policy "users manage their own manual visited places" on public.manual_visited_places for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

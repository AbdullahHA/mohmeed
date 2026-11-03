-- SPEC §22.14: quick post-visit ratings on places.
create table if not exists public.place_quick_ratings (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);

alter table public.place_quick_ratings enable row level security;

create policy "quick ratings are public to signed-in users" on public.place_quick_ratings for select
  to authenticated using (true);

create policy "users rate places themselves" on public.place_quick_ratings for insert
  to authenticated with check (user_id = auth.uid());

create policy "users update their own quick rating" on public.place_quick_ratings for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete their own quick rating" on public.place_quick_ratings for delete
  to authenticated using (user_id = auth.uid());

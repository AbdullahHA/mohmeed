-- Social profile rebuild: one-way follow graph, travel posts ("مدونات"),
-- and a lightweight trip-window mirror used only to detect friend overlap
-- ("نلتقي؟"). Full trip content (budget, itinerary, chat) stays local on
-- the device — only destination + dates are mirrored here.
-- Safe to re-run: every statement is idempotent.

-- ──────────────────────────────────────────────────────────────────────────
-- Follows (asymmetric, public graph — distinct from the existing mutual
-- friendships table, which stays as-is for trip collaborators/messaging)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "anyone can read the follow graph" on public.follows;
create policy "anyone can read the follow graph"
  on public.follows for select
  to authenticated
  using (true);

drop policy if exists "users follow others" on public.follows;
create policy "users follow others"
  on public.follows for insert
  to authenticated
  with check (
    auth.uid() = follower_id
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = follower_id and b.blocked_id = following_id)
         or (b.blocker_id = following_id and b.blocked_id = follower_id)
    )
  );

drop policy if exists "users unfollow others" on public.follows;
create policy "users unfollow others"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Travel posts ("مدونات") — a public photo + optional caption per user
-- ──────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('travel-posts', 'travel-posts', true)
on conflict (id) do nothing;

drop policy if exists "anyone can view travel post images" on storage.objects;
create policy "anyone can view travel post images"
  on storage.objects for select
  using (bucket_id = 'travel-posts');

drop policy if exists "users manage their own travel post images" on storage.objects;
create policy "users manage their own travel post images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'travel-posts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'travel-posts' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.travel_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  destination_id text,
  created_at timestamptz not null default now()
);

create index if not exists travel_posts_user_id_created_idx
  on public.travel_posts (user_id, created_at desc);

alter table public.travel_posts enable row level security;

drop policy if exists "anyone can read travel posts" on public.travel_posts;
create policy "anyone can read travel posts"
  on public.travel_posts for select
  to authenticated
  using (true);

drop policy if exists "users add their own travel posts" on public.travel_posts;
create policy "users add their own travel posts"
  on public.travel_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users delete their own travel posts" on public.travel_posts;
create policy "users delete their own travel posts"
  on public.travel_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Trip windows ("نلتقي؟") — just destination + dates, mirrored from a
-- locally-created trip, visible to people who follow you, used only to
-- surface genuine date/place overlaps.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trip_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_trip_id text not null,
  title text not null,
  destination_id text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (user_id, local_trip_id)
);

create index if not exists trip_windows_destination_dates_idx
  on public.trip_windows (destination_id, start_date, end_date);

alter table public.trip_windows enable row level security;

drop policy if exists "users see own trip windows and those they follow" on public.trip_windows;
create policy "users see own trip windows and those they follow"
  on public.trip_windows for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid() and f.following_id = trip_windows.user_id
    )
  );

drop policy if exists "users manage their own trip windows" on public.trip_windows;
create policy "users manage their own trip windows"
  on public.trip_windows for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

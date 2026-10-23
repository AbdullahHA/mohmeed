-- يلا نسافر: initial schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────
-- Profiles (one row per auth.users row)
-- ──────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text unique not null,
  emoji text not null default '🧳',
  color text not null default '#1359D3',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────
-- Friendships (symmetric: one row per accepted pair, user_id < friend_id)
-- ──────────────────────────────────────────────────────────────────────────
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

create policy "users see their own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "users add friendships they're part of"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "users remove friendships they're part of"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Destinations & places — admin-managed, public read
-- ──────────────────────────────────────────────────────────────────────────
create table public.destinations (
  id text primary key,
  name text not null,
  tagline text not null,
  image_url text not null,
  trending boolean not null default false,
  best_months int[] not null default '{}',
  why_visit text not null default '',
  top_hotels text[] not null default '{}',
  top_restaurants text[] not null default '{}',
  interests text[] not null default '{}',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.places (
  id text primary key,
  destination_id text not null references public.destinations (id) on delete cascade,
  name text not null,
  description text not null,
  image_url text not null,
  rating numeric(2, 1) not null default 4.5,
  price_level smallint not null default 2 check (price_level between 1 and 3),
  category text not null default 'الافتراضي',
  latitude double precision not null,
  longitude double precision not null,
  website text,
  updated_at timestamptz not null default now()
);

alter table public.destinations enable row level security;
alter table public.places enable row level security;

create policy "destinations are public" on public.destinations for select using (true);
create policy "places are public" on public.places for select using (true);

create policy "admins manage destinations" on public.destinations for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins manage places" on public.places for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ──────────────────────────────────────────────────────────────────────────
-- Trips
-- ──────────────────────────────────────────────────────────────────────────
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  destination text not null,
  cover_image_url text,
  start_date text not null default '—',
  end_date text not null default '—',
  budget_total numeric not null default 0,
  share_code text unique not null default upper(substr(md5(random()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_id, profile_id)
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category text not null,
  label text not null,
  amount numeric not null default 0
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day text not null,
  time text not null,
  title text not null,
  note text
);

create table public.trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  at timestamptz not null default now()
);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.budget_items enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.trip_messages enable row level security;

create function public.is_trip_member(_trip_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.trips t
    where t.id = _trip_id
      and (t.owner_id = auth.uid()
           or exists (select 1 from public.trip_members m where m.trip_id = t.id and m.profile_id = auth.uid()))
  );
$$;

create policy "trip members read/write their trip" on public.trips for all
  to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id))
  with check (owner_id = auth.uid());

create policy "trip members read membership" on public.trip_members for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "trip owner manages membership" on public.trip_members for insert
  to authenticated with check (public.is_trip_member(trip_id) or profile_id = auth.uid());
create policy "trip members leave" on public.trip_members for delete
  to authenticated using (profile_id = auth.uid() or public.is_trip_member(trip_id));

create policy "trip members read/write budget" on public.budget_items for all
  to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "trip members read/write itinerary" on public.itinerary_items for all
  to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "trip members read/write messages" on public.trip_messages for all
  to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- ──────────────────────────────────────────────────────────────────────────
-- Communities
-- ──────────────────────────────────────────────────────────────────────────
create table public.communities (
  id text primary key,
  name text not null,
  tagline text not null,
  emoji text not null,
  color text not null,
  base_member_count int not null default 0
);

create table public.community_members (
  community_id text not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  at timestamptz not null default now()
);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_messages enable row level security;

create policy "communities are public" on public.communities for select using (true);
create policy "admins manage communities" on public.communities for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "members readable by anyone signed in" on public.community_members for select to authenticated using (true);
create policy "users join communities" on public.community_members for insert to authenticated with check (profile_id = auth.uid());
create policy "users leave communities" on public.community_members for delete to authenticated using (profile_id = auth.uid());

create policy "community messages readable by members" on public.community_messages for select
  to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = community_messages.community_id and m.profile_id = auth.uid()));
create policy "members post community messages" on public.community_messages for insert
  to authenticated
  with check (from_id = auth.uid() and exists (select 1 from public.community_members m where m.community_id = community_messages.community_id and m.profile_id = auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────
-- Guide (AI) chat — per-user history
-- ──────────────────────────────────────────────────────────────────────────
create table public.guide_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  from_id text not null, -- 'me' | 'guide'
  text text not null,
  at timestamptz not null default now()
);

alter table public.guide_messages enable row level security;
create policy "users manage their own guide chat" on public.guide_messages for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- Travel passport: stamps, recommendations, airline reviews, check-ins
-- ──────────────────────────────────────────────────────────────────────────
create table public.visited_stamps (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  destination_id text not null references public.destinations (id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (profile_id, destination_id)
);

create table public.recommended_places (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  primary key (profile_id, place_id)
);

create table public.airline_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  from_city text not null,
  to_city text not null,
  airline text not null,
  note text not null default '',
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.check_ins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  destination_id text references public.destinations (id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

alter table public.visited_stamps enable row level security;
alter table public.recommended_places enable row level security;
alter table public.airline_reviews enable row level security;
alter table public.check_ins enable row level security;

create policy "users manage their own stamps" on public.visited_stamps for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "users manage their own recommendations" on public.recommended_places for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "reviews are public to signed-in users" on public.airline_reviews for select to authenticated using (true);
create policy "users manage their own reviews" on public.airline_reviews for insert to authenticated with check (profile_id = auth.uid());
create policy "users delete their own reviews" on public.airline_reviews for delete to authenticated using (profile_id = auth.uid());

create policy "check-ins visible to signed-in users" on public.check_ins for select to authenticated using (true);
create policy "users manage their own check-in" on public.check_ins for insert to authenticated with check (profile_id = auth.uid());
create policy "users update their own check-in" on public.check_ins for update to authenticated using (profile_id = auth.uid());
create policy "users clear their own check-in" on public.check_ins for delete to authenticated using (profile_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- Trip templates (shareable itineraries)
-- ──────────────────────────────────────────────────────────────────────────
create table public.trip_templates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  destination_id text not null references public.destinations (id) on delete cascade,
  days int not null default 1,
  price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.trip_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.trip_templates (id) on delete cascade,
  category text not null,
  label text not null
);

alter table public.trip_templates enable row level security;
alter table public.trip_template_items enable row level security;

create policy "templates are public" on public.trip_templates for select to authenticated using (true);
create policy "authors manage their templates" on public.trip_templates for insert to authenticated with check (author_id = auth.uid());
create policy "authors delete their templates" on public.trip_templates for delete to authenticated using (author_id = auth.uid());

create policy "template items are public" on public.trip_template_items for select to authenticated using (true);
create policy "authors manage their template items" on public.trip_template_items for insert
  to authenticated
  with check (exists (select 1 from public.trip_templates t where t.id = template_id and t.author_id = auth.uid()));
create policy "authors delete their template items" on public.trip_template_items for delete
  to authenticated
  using (exists (select 1 from public.trip_templates t where t.id = template_id and t.author_id = auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────
-- Feedback widget
-- ──────────────────────────────────────────────────────────────────────────
create table public.feedback (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  rating text not null check (rating in ('loved', 'ok', 'bad')),
  submitted_at timestamptz not null default now()
);

alter table public.feedback enable row level security;
create policy "users manage their own feedback" on public.feedback for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admins read all feedback" on public.feedback for select
  to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ──────────────────────────────────────────────────────────────────────────
-- Push notifications
-- ──────────────────────────────────────────────────────────────────────────
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz not null default now()
);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid not null references public.profiles (id),
  title text not null,
  body text not null,
  recipient_count int not null default 0,
  sent_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
alter table public.notifications_log enable row level security;

create policy "users manage their own push token" on public.push_tokens for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admins read all push tokens" on public.push_tokens for select
  to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins manage notification log" on public.notifications_log for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

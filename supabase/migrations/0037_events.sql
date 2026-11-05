-- Events (spec section 7): a full new admin section + real mobile-facing
-- feature, not just admin scaffolding.
--
-- audience is informational only: we don't have gender/age fields on
-- profiles, so 'kids'/'women_only' render as a badge the admin sets, not
-- an enforced filter. 'internal' IS enforced: the mobile app's public
-- query excludes it, same as it excludes drafts.
--
-- The "تذكير قبل يومين ويحترم ساعات الهدوء" automatic reminder from the
-- spec is NOT built here — there is no scheduled job (pg_cron) or quiet
-- hours concept anywhere in this project yet. event_interests exists so
-- real "مهتم" counts/targets are ready for that feature once it's built;
-- today marking interest does not yet trigger any notification.
--
-- Safe to re-run: idempotent.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  category text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place_id uuid references public.places(id) on delete set null,
  official_url text,
  audience text not null default 'public' check (audience in ('public', 'internal', 'kids', 'women_only')),
  is_draft boolean not null default true,
  notify_interested boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates_order check (ends_at >= starts_at)
);

alter table public.events enable row level security;

drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "published events are publicly readable" on public.events;
create policy "published events are publicly readable" on public.events for select
  using (is_draft = false and audience <> 'internal');

create table if not exists public.event_interests (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_interests enable row level security;

drop policy if exists "users manage their own event interest" on public.event_interests;
create policy "users manage their own event interest" on public.event_interests for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins read event interests" on public.event_interests;
create policy "admins read event interests" on public.event_interests for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists event_interests_event_id_idx on public.event_interests (event_id);

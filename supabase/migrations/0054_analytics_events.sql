-- Lightweight first-party product analytics — no feature-usage/funnel data
-- existed anywhere (no SDK, no events table), so there was no way to tell
-- whether a shipped growth feature (trip invite link, review prompt, ...)
-- actually moved usage. This is intentionally minimal: one append-only
-- table, name + small jsonb payload, no PII beyond the owning profile_id.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  platform text,
  created_at timestamptz not null default now()
);

create index analytics_events_name_created_idx on public.analytics_events (name, created_at desc);
create index analytics_events_profile_idx on public.analytics_events (profile_id);

alter table public.analytics_events enable row level security;

-- Any signed-in user can log an event, but only as themselves — never on
-- someone else's behalf (would let one account skew another's numbers).
create policy "users log their own events"
  on public.analytics_events for insert
  to authenticated
  with check (profile_id = auth.uid());

-- No select policy for regular users: events are write-only from the app's
-- point of view, same privacy posture as the push_tokens table. Only admins
-- read the data back, for the analytics dashboard.
create policy "admins read all events"
  on public.analytics_events for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

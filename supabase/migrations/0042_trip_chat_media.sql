-- Real image sharing + polls in the trip group chat. trip_messages stays
-- text-only (mirrors the existing place-share/location-share pattern in
-- src/lib/placeShare.ts and locationShare.ts): an image or poll message is
-- a trip_messages row whose text is a prefixed reference
-- (__IMAGE__:<storage path> or __POLL__:<poll id>), so the chat bubble
-- renderer can decode it into a card. No new columns on trip_messages.
-- Safe to re-run: every statement is idempotent.

-- ──────────────────────────────────────────────────────────────────────────
-- Images: private bucket scoped to trip members, same shape as
-- trip-documents (0021_trip_documents.sql) — path is {tripId}/{uploaderId}/{file}.
-- ──────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('trip-chat', 'trip-chat', false)
on conflict (id) do nothing;

drop policy if exists "trip members read chat images" on storage.objects;
create policy "trip members read chat images" on storage.objects for select
  to authenticated using (
    bucket_id = 'trip-chat'
    and public.is_trip_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "trip members upload chat images" on storage.objects;
create policy "trip members upload chat images" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'trip-chat'
    and public.is_trip_member((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "uploader deletes own chat image" on storage.objects;
create policy "uploader deletes own chat image" on storage.objects for delete
  to authenticated using (
    bucket_id = 'trip-chat'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ──────────────────────────────────────────────────────────────────────────
-- Polls: real mutable vote state needs real rows, not a text encoding —
-- a dedicated table pair, unlike the read-only place/location shares.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trip_message_polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  options text[] not null check (array_length(options, 1) between 2 and 6),
  allow_multiple boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trip_message_polls enable row level security;

drop policy if exists "trip members read polls" on public.trip_message_polls;
create policy "trip members read polls" on public.trip_message_polls for select
  to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "trip members create polls" on public.trip_message_polls;
create policy "trip members create polls" on public.trip_message_polls for insert
  to authenticated with check (public.is_trip_member(trip_id) and created_by = auth.uid());

create table if not exists public.trip_poll_votes (
  poll_id uuid not null references public.trip_message_polls (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  option_index smallint not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, voter_id, option_index)
);

alter table public.trip_poll_votes enable row level security;

drop policy if exists "trip members read votes" on public.trip_poll_votes;
create policy "trip members read votes" on public.trip_poll_votes for select
  to authenticated using (
    exists (
      select 1 from public.trip_message_polls p
      where p.id = poll_id and public.is_trip_member(p.trip_id)
    )
  );

drop policy if exists "trip members cast own vote" on public.trip_poll_votes;
create policy "trip members cast own vote" on public.trip_poll_votes for insert
  to authenticated with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.trip_message_polls p
      where p.id = poll_id and public.is_trip_member(p.trip_id)
    )
  );

drop policy if exists "voter retracts own vote" on public.trip_poll_votes;
create policy "voter retracts own vote" on public.trip_poll_votes for delete
  to authenticated using (voter_id = auth.uid());

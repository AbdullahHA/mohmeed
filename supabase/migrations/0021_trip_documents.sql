-- SPEC §22.3 (scoped): manual trip documents — flight / stay / tickets /
-- personal. No AI auto-extraction and no inbound-email address in this
-- pass (needs a vision/OCR pipeline and an email-receiving domain this
-- project doesn't have); fields are entered by hand.
create table if not exists public.trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('flight', 'stay', 'ticket', 'personal')),
  visibility text not null default 'shared' check (visibility in ('shared', 'private')),
  title text not null,
  data jsonb not null default '{}',
  file_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trip_documents enable row level security;

create policy "members read shared docs, owner reads own" on public.trip_documents for select
  to authenticated using (
    (visibility = 'shared' and public.is_trip_member(trip_id)) or owner_id = auth.uid()
  );

create policy "members add documents" on public.trip_documents for insert
  to authenticated with check (public.is_trip_member(trip_id) and owner_id = auth.uid());

create policy "owner updates their document" on public.trip_documents for update
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner deletes their document" on public.trip_documents for delete
  to authenticated using (owner_id = auth.uid());

-- Private storage bucket. Path layout: {tripId}/shared/{file} for docs
-- visible to the whole trip, {tripId}/private/{ownerId}/{file} for
-- docs only their owner can ever read or write.
insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', false)
on conflict (id) do nothing;

create policy "trip members read shared trip documents" on storage.objects for select
  to authenticated using (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[2] = 'shared'
    and public.is_trip_member((storage.foldername(name))[1]::uuid)
  );

create policy "owner reads own private trip documents" on storage.objects for select
  to authenticated using (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[2] = 'private'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

create policy "trip members upload shared trip documents" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[2] = 'shared'
    and public.is_trip_member((storage.foldername(name))[1]::uuid)
  );

create policy "owner uploads own private trip documents" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[2] = 'private'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

create policy "owner deletes own trip documents" on storage.objects for delete
  to authenticated using (
    bucket_id = 'trip-documents'
    and (
      ((storage.foldername(name))[2] = 'private' and (storage.foldername(name))[3] = auth.uid()::text)
      or ((storage.foldername(name))[2] = 'shared' and public.is_trip_member((storage.foldername(name))[1]::uuid))
    )
  );

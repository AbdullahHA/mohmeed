-- Bring check-ins closer to feature parity with how Swarm itself works: a
-- caption, an attached photo, and tagging friends who checked in with you
-- (not just seeing who else happens to be at the venue). Safe to re-run:
-- every statement is idempotent.

alter table public.check_ins add column if not exists note text not null default '';
alter table public.check_ins add column if not exists photo_url text;
alter table public.check_ins add column if not exists tagged_ids uuid[] not null default '{}';

-- Public bucket, same model as travel-posts (0011_social_profile.sql):
-- paths are per-user and effectively unguessable, and the RLS on
-- check_ins already governs who can discover a photo's URL in the first
-- place (a private check-in's row — and so its photo_url — never reaches
-- anyone but its owner).
insert into storage.buckets (id, name, public)
values ('check-in-photos', 'check-in-photos', true)
on conflict (id) do nothing;

drop policy if exists "anyone can view check-in photos" on storage.objects;
create policy "anyone can view check-in photos"
  on storage.objects for select
  using (bucket_id = 'check-in-photos');

drop policy if exists "users manage their own check-in photos" on storage.objects;
create policy "users manage their own check-in photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'check-in-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'check-in-photos' and (storage.foldername(name))[1] = auth.uid()::text);

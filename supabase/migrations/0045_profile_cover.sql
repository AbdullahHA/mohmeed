-- Real, user-uploadable profile cover photo (the desert hero background
-- was a fixed decorative motif with nothing to customize). Same shape as
-- avatars (0007_account_section.sql): a public bucket, per-user folder.
-- Safe to re-run: every statement is idempotent.

alter table public.profiles add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "anyone can view covers" on storage.objects;
create policy "anyone can view covers"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "users manage their own cover" on storage.objects;
create policy "users manage their own cover"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

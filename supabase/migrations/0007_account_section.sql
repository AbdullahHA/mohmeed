-- Account section: profile photos, KYC-style fields, friend blocking, and
-- real private messaging between friends.
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

-- ──────────────────────────────────────────────────────────────────────────
-- Profile photo storage
-- ──────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users manage their own avatar"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────────────────
-- Profile fields: photo + personal info shown in Settings
-- ──────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists title text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists nationality text,
  add column if not exists country_of_residence text,
  add column if not exists marital_status text;

-- ──────────────────────────────────────────────────────────────────────────
-- Blocking
-- ──────────────────────────────────────────────────────────────────────────
create table public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "users see who they blocked"
  on public.blocked_users for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "users block others"
  on public.blocked_users for insert
  to authenticated
  with check (auth.uid() = blocker_id);

create policy "users unblock others"
  on public.blocked_users for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Direct messages (1:1, only between friends who haven't blocked each other)
-- ──────────────────────────────────────────────────────────────────────────
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index direct_messages_pair_idx
  on public.direct_messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table public.direct_messages enable row level security;

create policy "users read their own conversations"
  on public.direct_messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "friends message each other"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.friendships f
      where (f.user_id = sender_id and f.friend_id = recipient_id)
         or (f.user_id = recipient_id and f.friend_id = sender_id)
    )
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = sender_id and b.blocked_id = recipient_id)
         or (b.blocker_id = recipient_id and b.blocked_id = sender_id)
    )
  );

alter publication supabase_realtime add table public.direct_messages;

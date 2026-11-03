-- SPEC line 34: community *creation* requests (not join requests — joining an
-- already-approved community stays instant). A user requests a new community
-- (name, tagline, emoji, reason) → status "قيد المراجعة" (pending) → an admin
-- approves (creates the real community + makes the requester its moderator)
-- or rejects. Also adds a role column so an approved requester can be marked
-- moderator, and a community_reports table for reporting a message or member.

alter table public.community_members add column if not exists role text
  not null default 'member' check (role in ('moderator', 'member'));

create table if not exists public.community_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  tagline text not null,
  emoji text not null default '🧭',
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  community_id text references public.communities(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.community_requests enable row level security;

create policy "users read their own community requests" on public.community_requests for select
  to authenticated using (requester_id = auth.uid());

create policy "admins read all community requests" on public.community_requests for select
  to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "users submit their own community request" on public.community_requests for insert
  to authenticated with check (requester_id = auth.uid());

create policy "admins update community requests" on public.community_requests for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_message_id uuid references public.community_messages(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

alter table public.community_reports enable row level security;

create policy "users read their own reports" on public.community_reports for select
  to authenticated using (reporter_id = auth.uid());

create policy "admins read all reports" on public.community_reports for select
  to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "users submit reports" on public.community_reports for insert
  to authenticated with check (reporter_id = auth.uid());

create policy "admins update reports" on public.community_reports for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- The app previously never read/wrote community_members or community_messages
-- live — communities and "joined" state were local seed data only. This also
-- enables the real chat screen to subscribe to new messages.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;

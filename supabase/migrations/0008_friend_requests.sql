-- Turns "add friend" into a real request/accept flow instead of an
-- instant mutual add. Safe to re-run: every statement is idempotent.

create table if not exists public.friend_requests (
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);

alter table public.friend_requests enable row level security;

drop policy if exists "users see their own requests" on public.friend_requests;
create policy "users see their own requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "users send requests" on public.friend_requests;
create policy "users send requests"
  on public.friend_requests for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = sender_id and b.blocked_id = recipient_id)
         or (b.blocker_id = recipient_id and b.blocked_id = sender_id)
    )
  );

drop policy if exists "users remove requests they're part of" on public.friend_requests;
create policy "users remove requests they're part of"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

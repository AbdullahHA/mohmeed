-- Check-in social layer: likes and comments, matching the row actions
-- Swarm shows under every check-in. RLS reuses the same trick as
-- trip_message_polls/trip_poll_votes (0042): a like/comment is visible
-- only when its parent check-in is visible to the caller, which composes
-- automatically through check_ins' own RLS policy (0010/0030) inside the
-- EXISTS subquery — a private check-in's likes/comments stay just as
-- hidden as the check-in itself.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.check_in_likes (
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (check_in_id, user_id)
);

alter table public.check_in_likes enable row level security;

drop policy if exists "visible check-in likes are readable" on public.check_in_likes;
create policy "visible check-in likes are readable" on public.check_in_likes for select
  to authenticated using (
    exists (select 1 from public.check_ins c where c.id = check_in_id)
  );

drop policy if exists "users like visible check-ins" on public.check_in_likes;
create policy "users like visible check-ins" on public.check_in_likes for insert
  to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.check_ins c where c.id = check_in_id)
  );

drop policy if exists "users unlike their own like" on public.check_in_likes;
create policy "users unlike their own like" on public.check_in_likes for delete
  to authenticated using (user_id = auth.uid());

create table if not exists public.check_in_comments (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists check_in_comments_check_in_id_idx on public.check_in_comments (check_in_id, created_at);

alter table public.check_in_comments enable row level security;

drop policy if exists "visible check-in comments are readable" on public.check_in_comments;
create policy "visible check-in comments are readable" on public.check_in_comments for select
  to authenticated using (
    exists (select 1 from public.check_ins c where c.id = check_in_id)
  );

drop policy if exists "users comment on visible check-ins" on public.check_in_comments;
create policy "users comment on visible check-ins" on public.check_in_comments for insert
  to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.check_ins c where c.id = check_in_id)
  );

drop policy if exists "users delete own comment" on public.check_in_comments;
create policy "users delete own comment" on public.check_in_comments for delete
  to authenticated using (user_id = auth.uid());

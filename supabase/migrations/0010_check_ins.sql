-- Real venue check-ins (search-backed, not the destination-only local demo).
-- Safe to re-run: every statement is idempotent.

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  venue_id text not null,
  venue_name text not null,
  venue_address text not null default '',
  venue_category text not null default 'other',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create index if not exists check_ins_venue_id_idx on public.check_ins (venue_id);
create index if not exists check_ins_user_id_created_idx on public.check_ins (user_id, created_at desc);

alter table public.check_ins enable row level security;

drop policy if exists "users see own and friends' check-ins" on public.check_ins;
create policy "users see own and friends' check-ins"
  on public.check_ins for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where (f.user_id = auth.uid() and f.friend_id = check_ins.user_id)
         or (f.user_id = check_ins.user_id and f.friend_id = auth.uid())
    )
  );

drop policy if exists "users add their own check-ins" on public.check_ins;
create policy "users add their own check-ins"
  on public.check_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users delete their own check-ins" on public.check_ins;
create policy "users delete their own check-ins"
  on public.check_ins for delete
  to authenticated
  using (auth.uid() = user_id);

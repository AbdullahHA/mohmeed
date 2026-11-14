create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

alter table public.user_reports enable row level security;

create policy "users read their own reports" on public.user_reports for select
  to authenticated using (reporter_id = auth.uid());

create policy "admins read all user reports" on public.user_reports for select
  to authenticated using (public.admin_has_role(array['owner', 'mod', 'support']));

create policy "users submit user reports" on public.user_reports for insert
  to authenticated with check (reporter_id = auth.uid() and reported_user_id != auth.uid());

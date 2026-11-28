-- Real audit log for admin actions (spec: "سجل العمليات" — every change
-- logged, nothing deleted, owner-only read access, 2-year retention is a
-- policy choice for the owner to enforce, not something RLS can expire).
-- Every admin (any role) can INSERT their own actions; only owners can
-- read the log, matching the design doc's permission matrix.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('mod', 'content', 'settings', 'security', 'data')),
  action text not null,
  target text not null,
  diff jsonb,
  note text,
  device text,
  at timestamptz not null default now()
);

create index if not exists admin_audit_log_at_idx on public.admin_audit_log (at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "admins log their own actions" on public.admin_audit_log;
create policy "admins log their own actions"
  on public.admin_audit_log for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "owners read the audit log" on public.admin_audit_log;
create policy "owners read the audit log"
  on public.admin_audit_log for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin and (p.admin_role = 'owner' or p.admin_role is null)
    )
  );

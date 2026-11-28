-- Real multi-role admin system (owner/mod/editor/analyst/support), replacing
-- the binary is_admin-only model with a role an admin actually holds.
-- is_admin stays the real RLS gate everywhere it's already used (unchanged);
-- admin_role is additive, used by the admin panel to filter navigation and
-- gate role-specific pages. Every existing admin becomes 'owner' so nobody
-- loses access. Like is_admin, admin_role is only ever changed by the
-- project owner running SQL directly — never exposed as a self-service
-- toggle in the web panel, for the same security reason Users.tsx already
-- documents for is_admin.
-- Safe to re-run: every statement is idempotent.

alter table public.profiles add column if not exists admin_role text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_admin_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_admin_role_check
      check (admin_role is null or admin_role in ('owner', 'mod', 'editor', 'analyst', 'support'));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_admin_role_requires_admin'
  ) then
    alter table public.profiles
      add constraint profiles_admin_role_requires_admin
      check (admin_role is null or is_admin);
  end if;
end $$;

update public.profiles set admin_role = 'owner' where is_admin = true and admin_role is null;

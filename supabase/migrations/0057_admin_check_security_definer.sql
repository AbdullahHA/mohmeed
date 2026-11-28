-- Prerequisite for restricting is_admin/admin_role the same way 0056
-- restricted the PII columns. ~20 policies across other tables
-- (storage, feedback, push_tokens, trips, check_ins, events, support
-- tickets, curated lists, ...) check a caller's admin status directly
-- against public.profiles — either via the inline
-- `exists (select 1 from public.profiles p where p.id = auth.uid() and
-- p.is_admin)` pattern, or (since 0047) via public.admin_has_role(...).
-- Either way, PostgreSQL requires the QUERYING role (authenticated) to
-- have column-read privilege on profiles.is_admin/admin_role just to
-- evaluate the policy — regardless of the result — so revoking those
-- columns would break every one of those policies for every user, admin
-- or not.
--
-- The fix: make the admin-check itself security definer, so it runs with
-- the function owner's privileges instead of the caller's. This is the
-- exact pattern already used by public.is_trip_member() in 0001_init.sql
-- — nothing new, just applied here too.

-- admin_has_role() already covers ~17 policies (0047_admin_role_rls.sql);
-- making it security definer fixes every one of them with zero changes to
-- the policies themselves, since they all just call this same function.
create or replace function public.admin_has_role(required_roles text[])
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_admin
      and coalesce(p.admin_role, 'owner') = any(required_roles)
  );
$$;

-- Plain "is this caller any admin" helper, for the simpler read-only admin
-- bypasses that 0047 intentionally left as "any is_admin" (no per-page role
-- scoping needed for read-only dashboard counts).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- Owner-specific helper for the one owner-only policy (audit log read).
create or replace function public.is_owner_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin and (p.admin_role = 'owner' or p.admin_role is null)
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;
grant execute on function public.is_owner_admin() to authenticated;

-- Remaining policies still on the old inline-exists pattern (not touched by
-- 0047, which only converted the role-scoped "manage" policies) — swap each
-- to call is_admin()/is_owner_admin() instead. ALTER POLICY keeps the
-- policy's name, command and role list exactly as they are; only the
-- condition changes.
alter policy "admins manage images" on storage.objects
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());

alter policy "admins read all feedback" on public.feedback
  using (public.is_admin());

alter policy "admins read all push tokens" on public.push_tokens
  using (public.is_admin());

alter policy "admins read all community requests" on public.community_requests
  using (public.is_admin());

alter policy "admins read all reports" on public.community_reports
  using (public.is_admin());

alter policy "admins read event interests" on public.event_interests
  using (public.is_admin());

alter policy "admins read all trips" on public.trips
  using (public.is_admin());

alter policy "admins read all check-ins" on public.check_ins
  using (public.is_admin());

alter policy "admins read all recommendations" on public.recommended_places
  using (public.is_admin());

alter policy "admins read all guide messages" on public.guide_messages
  using (public.is_admin());

alter policy "admins log their own actions" on public.admin_audit_log
  with check (actor_id = auth.uid() and public.is_admin());

alter policy "owners read the audit log" on public.admin_audit_log
  using (public.is_owner_admin());

alter policy "admins read all events" on public.analytics_events
  using (public.is_admin());

-- Now safe: every policy that reads is_admin/admin_role does it through a
-- security definer function, none of them need the querying role to have
-- direct column-read privilege anymore. Revoke + re-grant without those two
-- columns (this replaces, not adds to, 0056's grant — the full safe column
-- list has to be repeated here since REVOKE SELECT removes the table-wide
-- grant and GRANT SELECT (cols) is the only thing left standing).
revoke select on public.profiles from authenticated, anon;
grant select (
  id, name, username, emoji, color, created_at, interests,
  avatar_url, bio, cover_url
) on public.profiles to authenticated;

-- admin-web still needs is_admin/admin_role/created_at for OTHER users'
-- rows directly (Users.tsx, Team.tsx) — one admin-gated RPC for both
-- instead of a raw select the column grant above no longer allows.
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  name text,
  username text,
  emoji text,
  is_admin boolean,
  admin_role text,
  created_at timestamptz
)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.name, p.username, p.emoji, p.is_admin, p.admin_role, p.created_at
  from public.profiles p
  where public.is_admin();
$$;
grant execute on function public.admin_list_profiles() to authenticated;

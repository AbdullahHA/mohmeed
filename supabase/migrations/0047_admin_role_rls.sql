-- Tightens admin RLS from "any is_admin" to "is_admin AND holds one of the
-- roles the admin-web UI already requires for that page" (src/lib/roles.ts
-- PAGE_ROLES). Until now every "admins manage X" policy only checked
-- is_admin, so the 5-role system (owner/mod/editor/analyst/support) was
-- enforced in the UI only — a support-role admin blocked from /flags in
-- the nav could still toggle a flag directly via supabase.from(...), and
-- likewise for every other role-gated table below.
--
-- admin_has_role() mirrors the app's effectiveRole(): a legacy admin with
-- admin_role still null is treated as 'owner', same fallback the UI uses,
-- so nobody who already has access loses it. /audit is already correctly
-- scoped (0035) and is left untouched; /team has no admin-web write path
-- (role changes are owner-only direct SQL, per 0033's own comment) so has
-- no RLS to add; /users, /analytics, /system-health, /account have no
-- dedicated admin-write table to scope.
--
-- Safe to re-run: every statement is idempotent.

create or replace function public.admin_has_role(required_roles text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_admin
      and coalesce(p.admin_role, 'owner') = any(required_roles)
  );
$$;

-- /destinations: owner, editor, mod
drop policy if exists "admins manage destinations" on public.destinations;
create policy "admins manage destinations" on public.destinations for all
  to authenticated
  using (public.admin_has_role(array['owner','editor','mod']))
  with check (public.admin_has_role(array['owner','editor','mod']));

-- /places: owner, editor, mod
drop policy if exists "admins manage places" on public.places;
create policy "admins manage places" on public.places for all
  to authenticated
  using (public.admin_has_role(array['owner','editor','mod']))
  with check (public.admin_has_role(array['owner','editor','mod']));

-- /country-info: owner, editor
drop policy if exists "admins manage country info" on public.country_info;
create policy "admins manage country info" on public.country_info for all
  to authenticated
  using (public.admin_has_role(array['owner','editor']))
  with check (public.admin_has_role(array['owner','editor']));

-- /communities: owner, mod
drop policy if exists "admins manage communities" on public.communities;
create policy "admins manage communities" on public.communities for all
  to authenticated
  using (public.admin_has_role(array['owner','mod']))
  with check (public.admin_has_role(array['owner','mod']));

-- /community-requests: owner, mod
drop policy if exists "admins update community requests" on public.community_requests;
create policy "admins update community requests" on public.community_requests for update
  to authenticated
  using (public.admin_has_role(array['owner','mod']))
  with check (public.admin_has_role(array['owner','mod']));

-- Admin bypass inside the self-join insert policy, same role as above.
drop policy if exists "users join communities" on public.community_members;
create policy "users join communities"
  on public.community_members for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    or public.admin_has_role(array['owner','mod'])
  );

-- /community-reports: owner, mod, support
drop policy if exists "admins update reports" on public.community_reports;
create policy "admins update reports" on public.community_reports for update
  to authenticated
  using (public.admin_has_role(array['owner','mod','support']))
  with check (public.admin_has_role(array['owner','mod','support']));

drop policy if exists "admins manage community messages" on public.community_messages;
create policy "admins manage community messages" on public.community_messages for all
  to authenticated
  using (public.admin_has_role(array['owner','mod','support']))
  with check (public.admin_has_role(array['owner','mod','support']));

-- /notifications: owner, editor
drop policy if exists "admins manage notification log" on public.notifications_log;
create policy "admins manage notification log" on public.notifications_log for all
  to authenticated
  using (public.admin_has_role(array['owner','editor']))
  with check (public.admin_has_role(array['owner','editor']));

-- /events: owner, editor, mod
drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events for all
  to authenticated
  using (public.admin_has_role(array['owner','editor','mod']))
  with check (public.admin_has_role(array['owner','editor','mod']));

-- /curated-lists: owner, editor
drop policy if exists "admins manage curated lists" on public.curated_lists;
create policy "admins manage curated lists" on public.curated_lists for all
  to authenticated
  using (public.admin_has_role(array['owner','editor']))
  with check (public.admin_has_role(array['owner','editor']));

drop policy if exists "admins manage curated list items" on public.curated_list_items;
create policy "admins manage curated list items" on public.curated_list_items for all
  to authenticated
  using (public.admin_has_role(array['owner','editor']))
  with check (public.admin_has_role(array['owner','editor']));

-- /posts-reviews: owner, mod
drop policy if exists "admins manage travel posts" on public.travel_posts;
create policy "admins manage travel posts" on public.travel_posts for all
  to authenticated
  using (public.admin_has_role(array['owner','mod']))
  with check (public.admin_has_role(array['owner','mod']));

drop policy if exists "admins manage quick ratings" on public.place_quick_ratings;
create policy "admins manage quick ratings" on public.place_quick_ratings for all
  to authenticated
  using (public.admin_has_role(array['owner','mod']))
  with check (public.admin_has_role(array['owner','mod']));

-- /support: owner, mod, support
drop policy if exists "admins manage all tickets" on public.support_tickets;
create policy "admins manage all tickets" on public.support_tickets for all
  to authenticated
  using (public.admin_has_role(array['owner','mod','support']))
  with check (public.admin_has_role(array['owner','mod','support']));

drop policy if exists "admins manage all messages" on public.support_messages;
create policy "admins manage all messages" on public.support_messages for all
  to authenticated
  using (public.admin_has_role(array['owner','mod','support']))
  with check (public.admin_has_role(array['owner','mod','support']));

-- /flags: owner only
drop policy if exists "admins manage flags" on public.app_flags;
create policy "admins manage flags" on public.app_flags for all
  to authenticated
  using (public.admin_has_role(array['owner']))
  with check (public.admin_has_role(array['owner']));

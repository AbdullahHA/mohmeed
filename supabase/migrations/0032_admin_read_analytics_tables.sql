-- The admin dashboard needs real platform-wide counts for trips,
-- check-ins, and place recommendations to show honest analytics, but
-- their existing RLS policies only let a user see their own/their trip's
-- rows. Add additive admin-read policies (same pattern already used for
-- communities/community_members/feedback) so an is_admin account can
-- read every row for reporting, without loosening what regular users see.
-- Safe to re-run: every statement is idempotent.

drop policy if exists "admins read all trips" on public.trips;
create policy "admins read all trips"
  on public.trips for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admins read all check-ins" on public.check_ins;
create policy "admins read all check-ins"
  on public.check_ins for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admins read all recommendations" on public.recommended_places;
create policy "admins read all recommendations"
  on public.recommended_places for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

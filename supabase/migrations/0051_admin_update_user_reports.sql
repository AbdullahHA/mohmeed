-- user_reports (0048_user_reports.sql) had select policies for the
-- reporter and for admins, but no update policy at all — meaning no one,
-- not even an owner, could mark a report "reviewed" from the admin panel;
-- the update would just silently affect 0 rows under RLS. Mirrors the
-- equivalent "admins update reports" policy already granted on
-- community_reports in 0047_admin_role_rls.sql.
drop policy if exists "admins update user reports" on public.user_reports;
create policy "admins update user reports" on public.user_reports for update
  to authenticated
  using (public.admin_has_role(array['owner', 'mod', 'support']))
  with check (public.admin_has_role(array['owner', 'mod', 'support']));

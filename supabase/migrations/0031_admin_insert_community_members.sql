-- Admins approving a community creation request need to insert the
-- requester as the new community's moderator (profile_id != auth.uid()),
-- which the self-join-only insert policy was rejecting. Add the same
-- admin bypass the `communities` table already has.
-- Safe to re-run: every statement is idempotent.

drop policy if exists "users join communities" on public.community_members;
create policy "users join communities"
  on public.community_members for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

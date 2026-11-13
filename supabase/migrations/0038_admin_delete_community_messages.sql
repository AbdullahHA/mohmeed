-- Lets an admin actually act on a message-type community report: delete the
-- reported message. Previously only a community's own members could select
-- its messages and only the author could post — no role could delete one,
-- so "حذف الرسالة" in the reports admin page would have silently failed.
-- Additive admin-bypass policy, same pattern as destinations/places/communities.
-- Safe to re-run: idempotent.

drop policy if exists "admins manage community messages" on public.community_messages;
create policy "admins manage community messages" on public.community_messages for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

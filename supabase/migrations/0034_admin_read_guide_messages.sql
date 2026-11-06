-- Same additive admin-read pattern as 0032: guide_messages RLS only lets
-- each user read their own AI-guide chat, so the admin dashboard's "دليل
-- السفر الذكي" usage section needs an explicit admin bypass to count real
-- platform-wide usage instead of just the signed-in admin's own messages.
-- Safe to re-run: idempotent.

drop policy if exists "admins read all guide messages" on public.guide_messages;
create policy "admins read all guide messages"
  on public.guide_messages for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

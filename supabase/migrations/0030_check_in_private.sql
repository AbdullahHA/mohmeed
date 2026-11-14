-- Private/secret check-ins: visible to their owner only, never to friends.
-- Safe to re-run: every statement is idempotent.

alter table public.check_ins add column if not exists is_private boolean not null default false;

drop policy if exists "users see own and friends' check-ins" on public.check_ins;
create policy "users see own and friends' check-ins"
  on public.check_ins for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      not is_private
      and exists (
        select 1 from public.friendships f
        where (f.user_id = auth.uid() and f.friend_id = check_ins.user_id)
           or (f.user_id = check_ins.user_id and f.friend_id = auth.uid())
      )
    )
  );

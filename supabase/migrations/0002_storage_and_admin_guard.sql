-- Storage: only admins can add/change/remove images; everyone can view them
create policy "anyone can view images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "admins manage images"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    bucket_id = 'images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Prevent a user from making themselves admin via the app's API —
-- only a direct SQL Editor command (run by the project owner) can do that.
create function public.protect_is_admin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_is_admin_column
  before update on public.profiles
  for each row execute procedure public.protect_is_admin();

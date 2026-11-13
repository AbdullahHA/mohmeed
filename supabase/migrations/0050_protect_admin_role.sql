-- protect_is_admin() (0002_storage_and_admin_guard.sql) already blocks a
-- user from flipping is_admin through the app's API — but admin_role
-- (0033_admin_roles.sql) had no equivalent guard, so any signed-in admin,
-- even one with the lowest role (support), could call a normal profile
-- update through the API and set their own admin_role to 'owner',
-- bypassing the "owner-only direct SQL" rule the schema itself documents.
-- Extend the same trigger to cover admin_role too.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  if auth.uid() is not null and new.admin_role is distinct from old.admin_role then
    new.admin_role := old.admin_role;
  end if;
  return new;
end;
$$;

-- Lets the sign-up form check username availability before submitting,
-- without exposing the full profiles table to anonymous visitors.
create function public.username_available(check_username text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where username = check_username);
$$;

grant execute on function public.username_available(text) to anon, authenticated;

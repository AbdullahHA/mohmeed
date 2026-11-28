-- profiles RLS is row-level only ("profiles are readable by any signed-in
-- user" — using (true)) so, despite every app call site only ever
-- requesting a small public-safe column set for OTHER users (checked every
-- `from('profiles')` call in both this repo and admin-web), any signed-in
-- user could call PostgREST directly and read the KYC-style fields added in
-- 0007_account_section.sql for ANY other user: phone, title, first_name,
-- last_name, gender, birth_date, nationality, country_of_residence,
-- marital_status. None of these columns are referenced by any RLS policy
-- anywhere else in the schema (checked), so restricting them has zero risk
-- of breaking other policies — unlike is_admin/admin_role, which ~20
-- policies across other tables inline-check directly and which admin-web
-- still reads broadly for other users (Users.tsx, Team.tsx, Analytics.tsx,
-- Dashboard.tsx); that needs a bigger refactor (an is_admin() helper
-- function the other policies call instead) and is intentionally NOT part
-- of this migration — tracked separately, not fixed here.
revoke select on public.profiles from authenticated, anon;

grant select (
  id, name, username, emoji, color, is_admin, created_at, interests,
  avatar_url, bio, admin_role, cover_url
) on public.profiles to authenticated;

-- The one place that legitimately needs the full row, including the PII
-- fields above, is a user reading their own profile (AuthContext.tsx's
-- loadProfile). security definer lets it read every column regardless of
-- the grant above, scoped to the caller's own row only.
create or replace function public.get_my_profile()
returns public.profiles
language sql
security definer set search_path = public
stable
as $$
  select * from public.profiles where id = auth.uid();
$$;

grant execute on function public.get_my_profile() to authenticated;

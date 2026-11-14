-- Short personal bio shown on the profile.
alter table public.profiles add column if not exists bio text;

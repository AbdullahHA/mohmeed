alter table public.profiles
  add column interests text[] not null default '{}';

alter table public.places
  add column type text not null default 'activity'
  check (type in ('hotel', 'restaurant', 'activity', 'landmark'));

-- The `destinations` table never had latitude/longitude columns, so
-- PrayerTimesCard (§22.8) had no real coordinate to compute from for any
-- destination loaded from the live DB (only the local seed file had them).
-- Add the columns and backfill the real coordinates already used in
-- src/data/destinations.ts for the destinations currently seeded.
alter table public.destinations add column if not exists latitude double precision;
alter table public.destinations add column if not exists longitude double precision;

update public.destinations set latitude = 26.6097, longitude = 37.9154 where id = 'alula';
update public.destinations set latitude = 25.0167, longitude = 37.2667 where id = 'redsea';
update public.destinations set latitude = 36.5099, longitude = -4.8863 where id = 'marbella';
update public.destinations set latitude = 24.7136, longitude = 46.6753 where id = 'riyadh';
update public.destinations set latitude = 21.4858, longitude = 39.1925 where id = 'jeddah';
update public.destinations set latitude = 18.2164, longitude = 42.5053 where id = 'abha';

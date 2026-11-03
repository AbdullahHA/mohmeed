-- Expands places.type from the original 4 coarse values to the 8-category
-- taxonomy yalla-handoff's Discover mockup actually shows (and whose colors
-- were already sitting unused in theme/colors.ts's fixedColors.category).
-- Existing rows are remapped to their closest new value first so the new
-- check constraint never rejects live data.

update public.places set type = 'food' where type = 'restaurant';
update public.places set type = 'hotels' where type = 'hotel';
update public.places set type = 'landmarks' where type = 'landmark';
update public.places set type = 'experiences' where type = 'activity';

alter table public.places drop constraint if exists places_type_check;
alter table public.places add constraint places_type_check
  check (type in ('food', 'cafe', 'events', 'experiences', 'shopping', 'nature', 'landmarks', 'hotels'));

alter table public.places alter column type set default 'experiences';

create or replace function public.cache_google_place(
  _id text,
  _destination_id text,
  _name text,
  _description text,
  _image_url text,
  _rating numeric,
  _price_level smallint,
  _type text,
  _latitude double precision,
  _longitude double precision,
  _website text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _id !~ '^g-' then
    raise exception 'cache_google_place: id must be namespaced "g-"';
  end if;
  if _type not in ('food', 'cafe', 'events', 'experiences', 'shopping', 'nature', 'landmarks', 'hotels') then
    raise exception 'cache_google_place: invalid type %', _type;
  end if;

  insert into public.places (
    id, destination_id, name, description, image_url,
    rating, price_level, category, type, latitude, longitude, website
  )
  values (
    _id, _destination_id, _name, coalesce(_description, ''), coalesce(_image_url, ''),
    greatest(0, least(5, coalesce(_rating, 4.5))),
    greatest(1, least(3, coalesce(_price_level, 2))),
    'الافتراضي', _type, _latitude, _longitude, _website
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    rating = excluded.rating,
    price_level = excluded.price_level,
    type = excluded.type,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    website = excluded.website,
    updated_at = now();
end;
$$;

revoke all on function public.cache_google_place from public;
grant execute on function public.cache_google_place to authenticated;

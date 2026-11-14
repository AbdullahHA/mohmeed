-- Lets any signed-in user cache a real Google Places result into our own
-- `places` table the first time they open it, instead of the app only ever
-- showing the tiny hand-seeded set. Runs as a security-definer function
-- (not a blanket insert policy) so a regular user can't write arbitrary rows
-- — only ones shaped like a real place, under an existing destination, with
-- an id namespaced "g-" so it can never collide with or overwrite an
-- admin-curated place.
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
  if _type not in ('hotel', 'restaurant', 'activity', 'landmark') then
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

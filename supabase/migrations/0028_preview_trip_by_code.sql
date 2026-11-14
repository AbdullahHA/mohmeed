-- JoinTripScreen needs to show the trip (title, dates, members, itinerary
-- size) BEFORE the person commits to joining it — a non-member has no SELECT
-- access to trips/trip_members/itinerary_items by design, so this has to be
-- a security-definer function that looks the trip up by its share code and
-- returns only the preview fields, without inserting a trip_members row.
create function public.preview_trip_by_code(_code text)
returns table (
  trip_id uuid,
  title text,
  destination text,
  cover_image_url text,
  start_date text,
  end_date text,
  owner_name text,
  member_names text[],
  member_count int,
  itinerary_count int,
  already_member boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  _trip_id uuid;
begin
  select t.id into _trip_id from public.trips t where upper(t.share_code) = upper(_code);
  if _trip_id is null then
    return;
  end if;

  return query
  select
    t.id,
    t.title,
    t.destination,
    t.cover_image_url,
    t.start_date,
    t.end_date,
    o.name,
    coalesce(array_agg(p.name order by tm.joined_at) filter (where p.name is not null), array[]::text[]),
    count(tm.profile_id)::int,
    (select count(*) from public.itinerary_items i where i.trip_id = t.id)::int,
    exists (select 1 from public.trip_members m where m.trip_id = t.id and m.profile_id = auth.uid())
  from public.trips t
  join public.profiles o on o.id = t.owner_id
  left join public.trip_members tm on tm.trip_id = t.id
  left join public.profiles p on p.id = tm.profile_id
  where t.id = _trip_id
  group by t.id, o.name;
end;
$$;

grant execute on function public.preview_trip_by_code(text) to authenticated;

-- 0017_trip_member_roles.sql split itinerary_items' old "for all" policy
-- into separate select/insert/delete policies, but an update policy was
-- never added — so no trip member (not even an organizer) could ever edit
-- an existing itinerary item's date/time/title/slot, only delete and
-- re-add it. The app doesn't currently expose an "edit" UI, so this never
-- surfaced, but it's a real gap: anyone adding that feature later would
-- hit silently-ignored updates (RLS drops non-matching rows without an
-- error). Mirrors the existing "non-viewers delete itinerary" policy.
create policy "non-viewers update itinerary" on public.itinerary_items for update
  to authenticated
  using (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id))
  with check (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));

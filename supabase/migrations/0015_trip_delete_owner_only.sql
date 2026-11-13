-- The original "trip members read/write their trip" policy was a single
-- FOR ALL policy, so its USING clause (owner OR member) gated DELETE too —
-- meaning any regular member could delete the whole trip, not just the
-- owner. Confirmed live while testing the new join-by-code flow: a member
-- account successfully deleted a trip it didn't own. Splitting into
-- per-operation policies so DELETE requires ownership specifically.
drop policy if exists "trip members read/write their trip" on public.trips;

create policy "trip members read their trip" on public.trips for select
  to authenticated using (owner_id = auth.uid() or public.is_trip_member(id));

create policy "owner creates trips" on public.trips for insert
  to authenticated with check (owner_id = auth.uid());

create policy "owner updates their trip" on public.trips for update
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner deletes their trip" on public.trips for delete
  to authenticated using (owner_id = auth.uid());

-- SPEC §22.15: trip member roles (organizer / member / viewer).
alter table public.trip_members add column if not exists role text
  not null default 'member' check (role in ('organizer', 'member', 'viewer'));

create or replace function public.is_trip_organizer(_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trips t where t.id = _trip_id and t.owner_id = auth.uid()
  ) or exists (
    select 1 from public.trip_members m
    where m.trip_id = _trip_id and m.profile_id = auth.uid() and m.role = 'organizer'
  );
$$;

create or replace function public.is_trip_viewer(_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = _trip_id and m.profile_id = auth.uid() and m.role = 'viewer'
  );
$$;

-- Organizers (not just the owner) can manage membership.
drop policy if exists "trip owner manages membership" on public.trip_members;
drop policy if exists "trip members leave" on public.trip_members;
create policy "organizers add members" on public.trip_members for insert
  to authenticated with check (public.is_trip_organizer(trip_id) or profile_id = auth.uid());
create policy "organizers remove members" on public.trip_members for delete
  to authenticated using (public.is_trip_organizer(trip_id) or profile_id = auth.uid());
create policy "organizers change roles" on public.trip_members for update
  to authenticated using (public.is_trip_organizer(trip_id)) with check (public.is_trip_organizer(trip_id));

-- Viewers can read the schedule/budget/checklist but not add to them.
drop policy if exists "trip members read/write itinerary" on public.itinerary_items;
create policy "trip members read itinerary" on public.itinerary_items for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "non-viewers write itinerary" on public.itinerary_items for insert
  to authenticated with check (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));
create policy "non-viewers delete itinerary" on public.itinerary_items for delete
  to authenticated using (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));

drop policy if exists "trip members read/write budget" on public.budget_items;
create policy "trip members read budget" on public.budget_items for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "non-viewers write budget" on public.budget_items for insert
  to authenticated with check (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));
create policy "non-viewers delete budget" on public.budget_items for delete
  to authenticated using (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));

drop policy if exists "trip members read/write checklist" on public.trip_checklist;
create policy "trip members read checklist" on public.trip_checklist for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "non-viewers write checklist" on public.trip_checklist for insert
  to authenticated with check (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));
create policy "non-viewers update checklist" on public.trip_checklist for update
  to authenticated using (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id))
  with check (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));
create policy "non-viewers delete checklist" on public.trip_checklist for delete
  to authenticated using (public.is_trip_member(trip_id) and not public.is_trip_viewer(trip_id));

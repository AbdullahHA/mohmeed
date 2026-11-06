-- SPEC §15.12: a trip owner can publish their itinerary as a read-only,
-- account-free page; anyone (including guests) can view it and copy its
-- schedule into a new draft trip of their own.
alter table public.trips add column if not exists is_published boolean not null default false;

create or replace function public.is_trip_published(_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.trips t where t.id = _trip_id and t.is_published);
$$;

create policy "published trips are publicly readable" on public.trips for select
  using (is_published = true);

create policy "published trip itinerary is publicly readable" on public.itinerary_items for select
  using (public.is_trip_published(trip_id));

create policy "published trip budget is publicly readable" on public.budget_items for select
  using (public.is_trip_published(trip_id));

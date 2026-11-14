-- صفحة الرحلة الكاملة (SPEC §11): جدول باليوم/الوقت، تجهيز، وتسوية الميزانية.

alter table public.itinerary_items
  add column if not exists item_date date,
  add column if not exists slot text check (slot in ('breakfast', 'lunch', 'dinner', 'morning', 'afternoon', 'evening')),
  add column if not exists added_by uuid references public.profiles (id) on delete set null,
  add column if not exists place_id text references public.places (id) on delete set null,
  add column if not exists kind text not null default 'place' check (kind in ('place', 'note', 'flight', 'stay'));

alter table public.budget_items
  add column if not exists paid_by uuid references public.profiles (id) on delete set null,
  add column if not exists split_between uuid[] not null default '{}';

create table public.trip_checklist (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  group_name text not null default 'أخرى' check (group_name in ('الحجوزات', 'الشنطة', 'الأوراق', 'أخرى')),
  title text not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trip_checklist enable row level security;

create policy "trip members read/write checklist" on public.trip_checklist for all
  to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- trip_messages had no check tying from_id to the actual caller — harmless
-- while the chat was local-only and unreachable by other members, but this
-- migration makes it real and cross-user, so a member could otherwise insert
-- a message that LOOKS like it came from someone else in the group.
drop policy if exists "trip members read/write messages" on public.trip_messages;
create policy "trip members read messages" on public.trip_messages for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "trip members send their own messages" on public.trip_messages for insert
  to authenticated with check (public.is_trip_member(trip_id) and from_id = auth.uid());

-- Joining by share code: a non-member has no SELECT access to the trip row
-- (by design — codes shouldn't let someone browse other people's trips), so
-- the join has to happen through a function that looks the trip up itself
-- and only exposes its id once the caller is added as a member.
create function public.join_trip_by_code(_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  _trip_id uuid;
begin
  select id into _trip_id from public.trips where upper(share_code) = upper(_code);
  if _trip_id is null then
    return null;
  end if;
  insert into public.trip_members (trip_id, profile_id)
  values (_trip_id, auth.uid())
  on conflict (trip_id, profile_id) do nothing;
  return _trip_id;
end;
$$;

grant execute on function public.join_trip_by_code(text) to authenticated;

-- "الشلة" chat needs live updates across members, same as direct_messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_messages'
  ) then
    alter publication supabase_realtime add table public.trip_messages;
  end if;
end $$;

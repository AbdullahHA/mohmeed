-- Curated lists & seasons (spec section 8, المختارات والمواسم) — hand-picked
-- place collections shown in "اكتشف", either always-on ("manual") or only
-- within a date range ("seasonal", e.g. "رمضان ١٤٤٨"). A full new feature:
-- doesn't exist anywhere in the schema or the app before this.
-- Safe to re-run: idempotent.

create table if not exists public.curated_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  icon text not null default '✨',
  method text not null default 'manual' check (method in ('manual', 'seasonal')),
  season_start date,
  season_end date,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curated_lists_season_order check (season_start is null or season_end is null or season_end >= season_start)
);

alter table public.curated_lists enable row level security;

drop policy if exists "admins manage curated lists" on public.curated_lists;
create policy "admins manage curated lists" on public.curated_lists for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "published curated lists are publicly readable" on public.curated_lists;
create policy "published curated lists are publicly readable" on public.curated_lists for select
  using (is_published = true);

create table if not exists public.curated_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.curated_lists(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  sort_order int not null default 0,
  unique (list_id, place_id)
);

alter table public.curated_list_items enable row level security;

drop policy if exists "admins manage curated list items" on public.curated_list_items;
create policy "admins manage curated list items" on public.curated_list_items for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "published curated list items are publicly readable" on public.curated_list_items;
create policy "published curated list items are publicly readable" on public.curated_list_items for select
  using (exists (select 1 from public.curated_lists l where l.id = curated_list_items.list_id and l.is_published = true));

create index if not exists curated_list_items_list_id_idx on public.curated_list_items (list_id, sort_order);

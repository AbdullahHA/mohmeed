-- SPEC §22.11: country entry info card (visa, passport validity, currency,
-- plug type, eSIM, emergency number, Saudi embassy), admin-managed.
create table if not exists public.country_info (
  country text primary key,
  visa_status text check (visa_status in ('required', 'on_arrival', 'e_visa', 'none')),
  passport_validity_months int,
  currency text,
  plug_types text[] not null default '{}',
  esim_available boolean not null default false,
  emergency_number text,
  embassy_address text,
  embassy_phone text,
  source_url text,
  updated_at timestamptz not null default now()
);

alter table public.country_info enable row level security;

create policy "country info is public" on public.country_info for select using (true);

create policy "admins manage country info" on public.country_info for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

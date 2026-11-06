-- مفاتيح الدخل (feature flags) — SPEC §4–5: ثلاث مفاتيح تشغيل مطفية افتراضياً
-- sponsored_places, affiliate_booking, premium. تُقرأ من التطبيق، وتُدار من لوحة الإدارة فقط.
create table public.app_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_flags (key, enabled) values
  ('sponsored_places', false),
  ('affiliate_booking', false),
  ('premium', false);

alter table public.app_flags enable row level security;

create policy "flags readable by anyone signed in" on public.app_flags for select
  to authenticated using (true);

create policy "admins manage flags" on public.app_flags for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

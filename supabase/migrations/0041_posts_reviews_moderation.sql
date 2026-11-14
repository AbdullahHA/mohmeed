-- Posts & reviews moderation (spec section 4, المنشورات والتقييمات). Real
-- hide/delete actions on content that already exists and is already shown
-- in the app: travel_posts (per-destination traveler feed) and
-- place_quick_ratings (post-visit star ratings, the closest real
-- equivalent to a "review" — there is no separate free-text place-review
-- feature in the app, so this does not invent one).
-- Safe to re-run: idempotent.

alter table public.travel_posts add column if not exists hidden boolean not null default false;

drop policy if exists "anyone can read travel posts" on public.travel_posts;
create policy "anyone can read travel posts" on public.travel_posts for select
  to authenticated
  using (hidden = false);

drop policy if exists "admins manage travel posts" on public.travel_posts;
create policy "admins manage travel posts" on public.travel_posts for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

alter table public.place_quick_ratings add column if not exists hidden boolean not null default false;

drop policy if exists "quick ratings are public to signed-in users" on public.place_quick_ratings;
create policy "quick ratings are public to signed-in users" on public.place_quick_ratings for select
  to authenticated
  using (hidden = false);

drop policy if exists "admins manage quick ratings" on public.place_quick_ratings;
create policy "admins manage quick ratings" on public.place_quick_ratings for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

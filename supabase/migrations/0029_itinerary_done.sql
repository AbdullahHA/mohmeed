-- وضع اليوم (SPEC 22.4) needs a real "وصلت" (arrived) state per itinerary
-- item so the next-activity card can tell what's actually left to do today,
-- instead of guessing from the clock alone. Mirrors trip_checklist.done,
-- which already has the same update policy itinerary_items got in 0027.
alter table public.itinerary_items
  add column if not exists done boolean not null default false;

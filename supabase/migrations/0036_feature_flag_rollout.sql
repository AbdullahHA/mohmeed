-- Staged rollout percentage for feature flags (spec section 15). Honest
-- caveat baked into the admin UI, not just this comment: none of the
-- three existing flags (sponsored_places, affiliate_booking, premium)
-- are read by the mobile app yet — it doesn't branch on app_flags at
-- all today — so this is real, stored infrastructure ready for when
-- those features actually ship, not something that changes behavior
-- right now.
-- Safe to re-run: idempotent.

alter table public.app_flags add column if not exists rollout_pct smallint not null default 100;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_flags_rollout_pct_range'
  ) then
    alter table public.app_flags
      add constraint app_flags_rollout_pct_range check (rollout_pct between 0 and 100);
  end if;
end $$;

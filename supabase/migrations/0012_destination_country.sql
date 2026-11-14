-- Real country per destination, used for the honest "countries visited"
-- stat and world-percentage calculation (SPEC §18: countries / 195).
alter table public.destinations add column country text not null default '';

update public.destinations set country = 'السعودية' where id in ('alula', 'redsea', 'riyadh', 'jeddah', 'abha');
update public.destinations set country = 'إسبانيا' where id = 'marbella';

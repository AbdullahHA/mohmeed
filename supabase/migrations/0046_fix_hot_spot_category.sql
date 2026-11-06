-- The app code was changed to show "مزدحم الآن" instead of the English
-- "Hot Spot" status, but the already-seeded rows in `places` still carry
-- the old literal English value, so it kept leaking into the Arabic UI.
update public.places
set category = 'مزدحم الآن'
where category = 'Hot Spot';

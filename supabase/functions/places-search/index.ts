// استيراد أماكن من Google Places (Text Search) للوحة التحكم. يحفظها في جدول places (cache).
// الأسرار: GOOGLE_PLACES_API_KEY و SUPABASE_SERVICE_ROLE_KEY. للمشرفين فقط.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const TYPE_MAP: Record<string, string> = {
  restaurant: 'food', cafe: 'cafe', coffee_shop: 'cafe', lodging: 'hotels', hotel: 'hotels', tourist_attraction: 'landmarks',
  museum: 'landmarks', park: 'nature', shopping_mall: 'shopping', amusement_park: 'experiences', event_venue: 'events',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: isAdmin } = await auth.rpc('is_admin');
  if (!isAdmin) return Response.json({ error: 'forbidden' }, { status: 403, headers: cors });

  const { query, cityId } = await req.json();
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': Deno.env.get('GOOGLE_PLACES_API_KEY')!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.primaryType,places.internationalPhoneNumber,places.websiteUri',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'ar', maxResultCount: 20 }),
  });
  const json = await r.json();
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const price: Record<string, number> = { PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
  const rows = (json.places ?? []).map((p: Record<string, any>) => ({
    id: 'g_' + p.id,
    google_place_id: p.id,
    name: p.displayName?.text,
    category: TYPE_MAP[p.primaryType] ?? 'landmarks',
    city_id: cityId,
    kind: p.primaryType ?? '',
    price_level: price[p.priceLevel] ?? 2,
    rating: p.rating ?? 0,
    rating_count: p.userRatingCount ?? 0,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    address: p.formattedAddress,
    phone: p.internationalPhoneNumber,
    website: p.websiteUri,
    open: '09:00',
    close: '23:00',
    scene: 'city',
    description: '',
    updated_at: Date.now(),
  }));
  if (rows.length) await admin.from('places').upsert(rows, { onConflict: 'google_place_id' });
  return Response.json({ imported: rows.length, places: rows }, { headers: cors });
});

import { supabase } from './supabase';

export type DupCandidate = { id: string; name: string; destination_id: string; latitude: number; longitude: number };
export type DupPair = { a: DupCandidate; b: DupCandidate; distanceM: number };

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const MAX_DISTANCE_M = 150;

// Real rule: same destination + same normalized name + under 150m apart.
// This is an exact-name match (not fuzzy), which keeps it honest about what
// it actually detects — a spelling variant won't be caught.
export function findDuplicates(places: DupCandidate[]): DupPair[] {
  const pairs: DupPair[] = [];
  const byKey = new Map<string, DupCandidate[]>();
  for (const p of places) {
    if (p.latitude == null || p.longitude == null) continue;
    const key = `${p.destination_id}::${normalizeName(p.name)}`;
    const list = byKey.get(key) ?? [];
    list.push(p);
    byKey.set(key, list);
  }
  for (const group of byKey.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const distanceM = haversineMeters(group[i].latitude, group[i].longitude, group[j].latitude, group[j].longitude);
        if (distanceM <= MAX_DISTANCE_M) pairs.push({ a: group[i], b: group[j], distanceM: Math.round(distanceM) });
      }
    }
  }
  return pairs;
}

// Repoints every real reference from `loserId` to `keeperId`, merging
// conflicting composite-key rows instead of erroring on them, then deletes
// the loser place. Covers every table that actually has a place_id FK:
// events, itinerary_items, recommended_places, place_quick_ratings.
export async function mergePlaces(keeperId: string, loserId: string) {
  await supabase.from('events').update({ place_id: keeperId }).eq('place_id', loserId);
  await supabase.from('itinerary_items').update({ place_id: keeperId }).eq('place_id', loserId);

  const { data: loserRecs } = await supabase.from('recommended_places').select('profile_id').eq('place_id', loserId);
  if (loserRecs?.length) {
    await supabase
      .from('recommended_places')
      .upsert(
        loserRecs.map((r) => ({ profile_id: r.profile_id, place_id: keeperId })),
        { onConflict: 'profile_id,place_id', ignoreDuplicates: true }
      );
  }
  await supabase.from('recommended_places').delete().eq('place_id', loserId);

  const { data: loserRatings } = await supabase.from('place_quick_ratings').select('user_id,stars,tags,note').eq('place_id', loserId);
  if (loserRatings?.length) {
    await supabase
      .from('place_quick_ratings')
      .upsert(
        loserRatings.map((r) => ({ place_id: keeperId, user_id: r.user_id, stars: r.stars, tags: r.tags, note: r.note })),
        { onConflict: 'place_id,user_id', ignoreDuplicates: true }
      );
  }
  await supabase.from('place_quick_ratings').delete().eq('place_id', loserId);

  await supabase.from('places').delete().eq('id', loserId);
}

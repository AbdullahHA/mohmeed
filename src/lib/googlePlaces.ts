import type { PlaceType } from '../data/places';
import { supabase } from './supabase';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

export type GooglePlaceResult = {
  id: string; // raw Google place id, e.g. "ChIJ..."
  name: string;
  address: string;
  rating: number | null;
  ratingCount: number | null;
  priceLevel: 1 | 2 | 3;
  type: PlaceType;
  coordinate: { latitude: number; longitude: number };
  website: string | null;
  photoName: string | null; // pass to getPlacePhotoUrl()
};

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.types',
  'places.photos',
  'places.websiteUri',
].join(',');

function mapPriceLevel(level: string | undefined): 1 | 2 | 3 {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 3;
    default:
      return 2;
  }
}

function mapPlaceType(googleTypes: string[] | undefined): PlaceType {
  const types = googleTypes ?? [];
  if (types.some((t) => t === 'lodging' || t === 'hotel' || t === 'resort_hotel')) return 'hotels';
  if (types.some((t) => t === 'cafe' || t === 'coffee_shop' || t === 'bakery')) return 'cafe';
  if (types.some((t) => t.includes('restaurant') || t === 'bar' || t === 'food' || t === 'meal_takeaway'))
    return 'food';
  if (
    types.some(
      (t) =>
        t === 'shopping_mall' ||
        t === 'store' ||
        t === 'clothing_store' ||
        t === 'supermarket' ||
        t === 'department_store'
    )
  )
    return 'shopping';
  if (
    types.some(
      (t) => t === 'park' || t === 'natural_feature' || t === 'hiking_area' || t === 'campground' || t === 'beach'
    )
  )
    return 'nature';
  if (
    types.some(
      (t) => t === 'amusement_park' || t === 'stadium' || t === 'event_venue' || t === 'night_club' || t === 'zoo'
    )
  )
    return 'events';
  if (
    types.some(
      (t) => t === 'tourist_attraction' || t === 'landmark' || t === 'museum' || t === 'historical_landmark'
    )
  )
    return 'landmarks';
  return 'experiences';
}

function mapResult(raw: any): GooglePlaceResult {
  return {
    id: raw.id,
    name: raw.displayName?.text ?? 'مكان بدون اسم',
    address: raw.formattedAddress ?? '',
    rating: typeof raw.rating === 'number' ? raw.rating : null,
    ratingCount: typeof raw.userRatingCount === 'number' ? raw.userRatingCount : null,
    priceLevel: mapPriceLevel(raw.priceLevel),
    type: mapPlaceType(raw.types),
    coordinate: { latitude: raw.location?.latitude, longitude: raw.location?.longitude },
    website: raw.websiteUri ?? null,
    photoName: raw.photos?.[0]?.name ?? null,
  };
}

/**
 * Text-search Google Places, biased to a circle around `center` (meant to be
 * the current destination's coordinates) so results stay relevant to the
 * trip the user is planning rather than returning global matches.
 */
export async function searchGooglePlaces(
  query: string,
  center: { latitude: number; longitude: number },
  radiusMeters = 25000
): Promise<GooglePlaceResult[]> {
  if (!API_KEY) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(`${BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: trimmed,
      languageCode: 'ar',
      locationBias: {
        circle: { center: { latitude: center.latitude, longitude: center.longitude }, radius: radiusMeters },
      },
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return ((data.places ?? []) as any[]).map(mapResult);
}

/**
 * Type-filtered nearby search (Google's `places:searchNearby`), unlike
 * `searchGooglePlaces` which is free-text and can surface loosely-related
 * results (e.g. a dental clinic for "مستشفى"). Used for طوارئ's "أقرب
 * مستشفى" in Today Mode, where the result needs to actually be a hospital.
 */
export async function searchNearbyPlaces(
  includedType: string,
  center: { latitude: number; longitude: number },
  radiusMeters = 20000
): Promise<GooglePlaceResult[]> {
  if (!API_KEY) return [];

  const response = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [includedType],
      maxResultCount: 10,
      languageCode: 'ar',
      locationRestriction: {
        circle: { center: { latitude: center.latitude, longitude: center.longitude }, radius: radiusMeters },
      },
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return ((data.places ?? []) as any[]).map(mapResult);
}

export type CitySuggestion = {
  id: string;
  name: string;
  region: string; // country/state, as returned by Google, for display and filtering
};

/**
 * Autocompletes city/locality names worldwide (not biased to any location),
 * used by the travel-passport "add a city stamp" flow. Excludes any result
 * whose region text names Israel — this app never lists it as a place.
 */
export async function searchCities(query: string): Promise<CitySuggestion[]> {
  if (!API_KEY) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      input: trimmed,
      includedPrimaryTypes: ['locality'],
      languageCode: 'ar',
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  const suggestions = (data.suggestions ?? []) as any[];
  return suggestions
    .map((s) => {
      const p = s.placePrediction;
      if (!p) return null;
      return {
        id: p.placeId as string,
        name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        region: p.structuredFormat?.secondaryText?.text ?? '',
      };
    })
    .filter((c): c is CitySuggestion => !!c && !!c.name)
    .filter((c) => !/israel|إسرائيل/i.test(c.region));
}

export function getPlacePhotoUrl(photoName: string, maxWidthPx = 800): string | null {
  if (!API_KEY) return null;
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${API_KEY}`;
}

/**
 * Turns a live Google search result into a real row in our own `places`
 * table the first time a user opens it, so from then on it behaves exactly
 * like any admin-curated place (quick ratings, trip items, etc. all FK to
 * `places.id`). Returns the new/updated place's id, or null on failure.
 */
export async function cacheGooglePlace(
  result: GooglePlaceResult,
  destinationId: string
): Promise<string | null> {
  const id = `g-${result.id}`;
  const { error } = await supabase.rpc('cache_google_place', {
    _id: id,
    _destination_id: destinationId,
    _name: result.name,
    _description: result.address,
    _image_url: result.photoName ? getPlacePhotoUrl(result.photoName) ?? '' : '',
    _rating: result.rating ?? 4.5,
    _price_level: result.priceLevel,
    _type: result.type,
    _latitude: result.coordinate.latitude,
    _longitude: result.coordinate.longitude,
    _website: result.website,
  });
  if (error) return null;
  return id;
}

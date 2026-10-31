import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { destinations as localDestinations, type Destination } from '../data/destinations';
import { places as localPlaces, type Place } from '../data/places';

const CACHE_KEY = 'yalla-nsafer:content-cache:v1';

type ContentCache = { destinations: Destination[]; places: Place[] };

type ContentState = {
  destinations: Destination[];
  places: Place[];
  loading: boolean;
  synced: boolean;
  offline: boolean;
  refresh: () => Promise<void>;
};

const ContentContext = createContext<ContentState | undefined>(undefined);

function mapDestinationRow(row: any): Destination {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    image: { uri: row.image_url } as ImageSourcePropType,
    trending: row.trending ?? false,
    bestMonths: row.best_months ?? [],
    whyVisit: row.why_visit ?? '',
    topHotels: row.top_hotels ?? [],
    topRestaurants: row.top_restaurants ?? [],
    interests: row.interests ?? [],
  };
}

function mapPlaceRow(row: any): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: { uri: row.image_url } as ImageSourcePropType,
    rating: Number(row.rating),
    priceLevel: row.price_level,
    category: row.category,
    type: row.type ?? 'activity',
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    website: row.website ?? undefined,
    destinationId: row.destination_id,
  };
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [destinations, setDestinations] = useState<Destination[]>(localDestinations);
  const [places, setPlaces] = useState<Place[]>(localPlaces);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const latestRef = useRef({ destinations, places });
  latestRef.current = { destinations, places };

  const refresh = useCallback(async () => {
    try {
      const [destRes, placeRes] = await Promise.all([
        supabase.from('destinations').select('*').order('sort_order', { ascending: true }),
        supabase.from('places').select('*'),
      ]);
      if (destRes.error) throw destRes.error;
      if (placeRes.error) throw placeRes.error;
      let nextDestinations = latestRef.current.destinations;
      let nextPlaces = latestRef.current.places;
      if (destRes.data && destRes.data.length > 0) {
        nextDestinations = destRes.data.map(mapDestinationRow);
        setDestinations(nextDestinations);
      }
      if (placeRes.data && placeRes.data.length > 0) {
        nextPlaces = placeRes.data.map(mapPlaceRow);
        setPlaces(nextPlaces);
      }
      setSynced(true);
      setOffline(false);
      const cache: ContentCache = { destinations: nextDestinations, places: nextPlaces };
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => {});
    } catch {
      // Network/Supabase unavailable — fall back to the last cached sync (or bundled content).
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cache: ContentCache = JSON.parse(raw);
          if (cache.destinations?.length) setDestinations(cache.destinations);
          if (cache.places?.length) setPlaces(cache.places);
        }
      } catch {
        // Corrupt cache — ignore and keep the bundled fallback.
      }
      refresh();
    })();
  }, [refresh]);

  return (
    <ContentContext.Provider value={{ destinations, places, loading, synced, offline, refresh }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within a ContentProvider');
  return ctx;
}

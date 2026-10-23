import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { supabase } from '../lib/supabase';
import { destinations as localDestinations, type Destination } from '../data/destinations';
import { places as localPlaces, type Place } from '../data/places';

type ContentState = {
  destinations: Destination[];
  places: Place[];
  loading: boolean;
  synced: boolean;
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

  const refresh = useCallback(async () => {
    try {
      const [destRes, placeRes] = await Promise.all([
        supabase.from('destinations').select('*').order('sort_order', { ascending: true }),
        supabase.from('places').select('*'),
      ]);
      if (destRes.error) throw destRes.error;
      if (placeRes.error) throw placeRes.error;
      if (destRes.data && destRes.data.length > 0) {
        setDestinations(destRes.data.map(mapDestinationRow));
      }
      if (placeRes.data && placeRes.data.length > 0) {
        setPlaces(placeRes.data.map(mapPlaceRow));
      }
      setSynced(true);
    } catch {
      // Network/Supabase unavailable — keep showing the bundled local content.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ContentContext.Provider value={{ destinations, places, loading, synced, refresh }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within a ContentProvider');
  return ctx;
}

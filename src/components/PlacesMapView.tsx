import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import type MapViewType from 'react-native-maps';
import { lightMapStyle } from '../theme/mapStyle';
import PlaceMarker from './PlaceMarker';
import { MapView, Marker } from './mapModule';
import type { Place } from '../data/places';

type Props = {
  places: Place[];
  selectedPlaceId?: string;
  onMarkerPress?: (place: Place) => void;
};

function regionFromPlaces(places: Place[]) {
  if (places.length === 0) {
    return { latitude: 24.7136, longitude: 46.6753, latitudeDelta: 5, longitudeDelta: 5 };
  }

  const lats = places.map((p) => p.coordinate.latitude);
  const lngs = places.map((p) => p.coordinate.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, 0.5) * 1.6,
    longitudeDelta: Math.max(maxLng - minLng, 0.5) * 1.6,
  };
}

export default function PlacesMapView({ places, selectedPlaceId, onMarkerPress }: Props) {
  const mapRef = useRef<MapViewType | null>(null);
  const initialRegion = useMemo(() => regionFromPlaces(places), []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(regionFromPlaces(places), 350);
  }, [places]);

  if (Platform.OS === 'web' || !MapView || !Marker) {
    return (
      <View style={[styles.map, styles.webFallback]}>
        <Text style={styles.webFallbackText}>معاينة الخريطة متاحة على الجوال فقط</Text>
      </View>
    );
  }

  // Narrowed to non-null locally: TS can't track the module-level `let` export's
  // null-check across the early return above, but the guard makes this safe at runtime.
  const MapComponent = MapView;
  const MarkerComponent = Marker;

  return (
    <MapComponent
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      customMapStyle={lightMapStyle}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {places.map((place: Place) => (
        <MarkerComponent
          key={place.id}
          coordinate={place.coordinate}
          onPress={() => onMarkerPress?.(place)}
          tracksViewChanges={false}
        >
          <PlaceMarker selected={place.id === selectedPlaceId} />
        </MarkerComponent>
      ))}
    </MapComponent>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  webFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F6',
  },
  webFallbackText: {
    color: '#5C6B7E',
  },
});

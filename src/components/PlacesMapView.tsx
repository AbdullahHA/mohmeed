import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { darkMapStyle } from '../theme/mapStyle';
import PlaceMarker from './PlaceMarker';
import type { Place } from '../data/places';

type Props = {
  places: Place[];
  selectedPlaceId?: string;
  onMarkerPress?: (place: Place) => void;
};

function regionFromPlaces(places: Place[]): Region {
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
  const initialRegion = useMemo(() => regionFromPlaces(places), [places]);

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      customMapStyle={darkMapStyle}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={place.coordinate}
          onPress={() => onMarkerPress?.(place)}
          tracksViewChanges={false}
        >
          <PlaceMarker selected={place.id === selectedPlaceId} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

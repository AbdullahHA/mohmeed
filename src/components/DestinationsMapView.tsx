import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { lightMapStyle } from '../theme/mapStyle';
import PlaceMarker from './PlaceMarker';
import { MapView, Marker } from './mapModule';
import type { Destination } from '../data/destinations';

type DestinationWithCoords = Destination & { latitude: number; longitude: number };

type Props = {
  destinations: DestinationWithCoords[];
  onMarkerPress?: (destination: DestinationWithCoords) => void;
};

function regionFromDestinations(destinations: DestinationWithCoords[]) {
  const lats = destinations.map((d) => d.latitude);
  const lngs = destinations.map((d) => d.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, 4) * 1.6,
    longitudeDelta: Math.max(maxLng - minLng, 4) * 1.6,
  };
}

export default function DestinationsMapView({ destinations, onMarkerPress }: Props) {
  const initialRegion = useMemo(() => regionFromDestinations(destinations), [destinations]);

  if (Platform.OS === 'web' || !MapView || !Marker) {
    return (
      <View style={[styles.map, styles.webFallback]}>
        <Text style={styles.webFallbackText}>معاينة الخريطة متاحة على الجوال فقط</Text>
      </View>
    );
  }

  const MapComponent = MapView;
  const MarkerComponent = Marker;

  return (
    <MapComponent style={styles.map} initialRegion={initialRegion} customMapStyle={lightMapStyle}>
      {destinations.map((destination) => (
        <MarkerComponent
          key={destination.id}
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          onPress={() => onMarkerPress?.(destination)}
          tracksViewChanges={false}
        >
          <PlaceMarker />
        </MarkerComponent>
      ))}
    </MapComponent>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  webFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F6',
  },
  webFallbackText: {
    color: '#5C6B7E',
  },
});

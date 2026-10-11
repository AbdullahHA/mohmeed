import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { lightMapStyle } from '../theme/mapStyle';
import PlaceMarker from './PlaceMarker';
import { MapView, Marker } from './mapModule';
import type { Place } from '../data/places';

type Props = {
  coordinate: Place['coordinate'];
};

export default function PlaceMiniMap({ coordinate }: Props) {
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
      style={styles.map}
      customMapStyle={lightMapStyle}
      scrollEnabled={false}
      zoomEnabled={false}
      pointerEvents="none"
      initialRegion={{
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <MarkerComponent coordinate={coordinate} tracksViewChanges={false}>
        <PlaceMarker selected />
      </MarkerComponent>
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
    backgroundColor: '#F0F3F1',
  },
  webFallbackText: {
    color: '#5B6B68',
  },
});

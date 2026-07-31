import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { lightMapStyle } from '../theme/mapStyle';
import PlaceMarker from './PlaceMarker';
import type { Place } from '../data/places';

type Props = {
  coordinate: Place['coordinate'];
};

let MapView: any;
let Marker: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function PlaceMiniMap({ coordinate }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.map, styles.webFallback]}>
        <Text style={styles.webFallbackText}>معاينة الخريطة متاحة على الجوال فقط</Text>
      </View>
    );
  }

  return (
    <MapView
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
      <Marker coordinate={coordinate} tracksViewChanges={false}>
        <PlaceMarker selected />
      </Marker>
    </MapView>
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

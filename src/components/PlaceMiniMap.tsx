import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { darkMapStyle } from '../theme/mapStyle';
import { colors } from '../theme/colors';
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
      customMapStyle={darkMapStyle}
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
    backgroundColor: colors.surfaceAlt,
  },
  webFallbackText: {
    color: colors.textMuted,
  },
});

import { Platform } from 'react-native';
import type RNMapView from 'react-native-maps';
import type { Marker as RNMarker } from 'react-native-maps';

type MapViewComponent = typeof RNMapView;
type MarkerComponent = typeof RNMarker;

export let MapView: MapViewComponent | null = null;
export let Marker: MarkerComponent | null = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

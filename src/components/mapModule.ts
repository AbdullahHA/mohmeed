import { Platform } from 'react-native';
import type RNMapView from 'react-native-maps';
import type { Marker as RNMarker, Polyline as RNPolyline } from 'react-native-maps';

type MapViewComponent = typeof RNMapView;
type MarkerComponent = typeof RNMarker;
type PolylineComponent = typeof RNPolyline;

export let MapView: MapViewComponent | null = null;
export let Marker: MarkerComponent | null = null;
export let Polyline: PolylineComponent | null = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

/** خريطة الأماكن (iOS / Android). نسخة الويب في PlacesMap.web.tsx */
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { View } from 'react-native';

import type { Place } from '../data/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { Txt } from '../ui';

export function PlacesMap({
  places,
  center,
  onPress,
  numbered,
  warnIds = [],
  height,
}: {
  places: Place[];
  center?: { lat: number; lng: number } | null;
  onPress?: (p: Place) => void;
  numbered?: boolean;
  warnIds?: string[];
  height?: number;
}) {
  const { colors, scheme } = useAppTheme();
  const c = center ?? places[0] ?? { lat: 24.7, lng: 46.7 };
  const span = Math.max(0.05, ...places.map((p) => Math.max(Math.abs(p.lat - c.lat), Math.abs(p.lng - c.lng)) * 2.6));
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={height ? { height } : { flex: 1 }}
      userInterfaceStyle={scheme}
      initialRegion={{ latitude: c.lat, longitude: c.lng, latitudeDelta: span, longitudeDelta: span }}
      showsUserLocation
      accessibilityLabel="خريطة الأماكن"
    >
      {numbered && places.length > 1 ? (
        <Polyline coordinates={places.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={colors.primary} strokeWidth={3} lineDashPattern={[8, 6]} />
      ) : null}
      {places.map((p, i) => (
        <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name} onCalloutPress={() => onPress?.(p)} onPress={() => !numbered && onPress?.(p)}>
          <View
            style={{
              minWidth: 30,
              height: 30,
              borderRadius: 15,
              paddingHorizontal: numbered ? 0 : 8,
              backgroundColor: warnIds.includes(p.id) ? colors.gold : colors.primary,
              borderWidth: 3,
              borderColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="badge" style={{ color: '#fff', fontSize: 12 }}>
              {numbered ? String(i + 1) : p.rating.toFixed(1)}
            </Txt>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

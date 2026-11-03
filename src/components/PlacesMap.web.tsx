/** خريطة مبسّطة للويب: react-native-maps ما يشتغل على الويب، فنرسم الأماكن بنسبها ونربط بخرائط Google */
import * as Linking from 'expo-linking';
import { Pressable, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import type { Place } from '../data/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { Btn, Txt } from '../ui';

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
  const { colors } = useAppTheme();
  const pts = places.length ? places : [];
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats, center?.lat ?? 99), maxLat = Math.max(...lats, center?.lat ?? -99);
  const minLng = Math.min(...lngs, center?.lng ?? 999), maxLng = Math.max(...lngs, center?.lng ?? -999);
  const pos = (p: Place) => ({
    x: maxLng === minLng ? 50 : 12 + ((p.lng - minLng) / (maxLng - minLng)) * 76,
    y: maxLat === minLat ? 50 : 12 + ((maxLat - p.lat) / (maxLat - minLat)) * 76,
  });
  const url = places.length > 1
    ? `https://www.google.com/maps/dir/${places.map((p) => `${p.lat},${p.lng}`).join('/')}`
    : `https://www.google.com/maps/search/?api=1&query=${places[0]?.lat},${places[0]?.lng}`;
  return (
    <View style={[{ backgroundColor: colors.primarySoft, overflow: 'hidden' }, height ? { height } : { flex: 1 }]} accessibilityLabel="خريطة الأماكن">
      {numbered && places.length > 1 ? (
        <Svg style={{ position: 'absolute', width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Polyline points={places.map((p) => `${pos(p).x},${pos(p).y}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={0.8} strokeDasharray="2 1.5" />
        </Svg>
      ) : null}
      {places.map((p, i) => {
        const { x, y } = pos(p);
        return (
          <Pressable
            key={p.id}
            onPress={() => onPress?.(p)}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: [{ translateX: -15 }, { translateY: -15 }], alignItems: 'center' }}
          >
            <View style={{ minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: numbered ? 0 : 8, backgroundColor: warnIds.includes(p.id) ? colors.gold : colors.primary, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="badge" style={{ color: '#fff', fontSize: 12 }}>
                {numbered ? String(i + 1) : p.rating.toFixed(1)}
              </Txt>
            </View>
            <Txt variant="caption" style={{ backgroundColor: colors.card, borderRadius: 6, paddingHorizontal: 4, marginTop: 2, fontSize: 11 }} numberOfLines={1}>
              {p.name}
            </Txt>
          </Pressable>
        );
      })}
      <View style={{ position: 'absolute', top: 10, end: 10 }}>
        <Btn size="sm" variant="ghost" icon="open-outline" title="افتح في خرائط Google" onPress={() => Linking.openURL(url)} />
      </View>
    </View>
  );
}

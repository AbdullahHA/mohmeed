import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Text from '../components/Text';
import RtlScrollRow from '../components/RtlScrollRow';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { tripDateRange, formatIsoDate } from '../components/DayPicker';
import { haversineDistanceKm } from '../lib/geo';
import { getMultiStopMapsUrl } from '../utils/place';
import { lightMapStyle } from '../theme/mapStyle';
import { MapView, Marker, Polyline } from '../components/mapModule';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'DayMap'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAY_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function DayMapScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, tripsOffline } = useAppState();
  const { places } = useContent();

  const trip = trips.find((t) => t.id === route.params.tripId);
  const tripDays = trip ? tripDateRange(trip.startDate, trip.endDate) : [];
  const [selectedDay, setSelectedDay] = useState<string | null>(tripDays[0] ? formatIsoDate(tripDays[0]) : null);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const stops = trip.itinerary
    .filter((i) => i.itemDate === selectedDay && i.placeId)
    .map((i) => ({ item: i, place: places.find((p) => p.id === i.placeId) }))
    .filter((s): s is { item: typeof trip.itinerary[number]; place: NonNullable<typeof s.place> } => !!s.place);

  let totalKm = 0;
  for (let i = 1; i < stops.length; i++) {
    totalKm += haversineDistanceKm(stops[i - 1].place.coordinate, stops[i].place.coordinate);
  }

  const mapRegion = (() => {
    if (stops.length === 0) return null;
    const lats = stops.map((s) => s.place.coordinate.latitude);
    const lngs = stops.map((s) => s.place.coordinate.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.03) * 1.8,
      longitudeDelta: Math.max(maxLng - minLng, 0.03) * 1.8,
    };
  })();

  const handleOpenFullRoute = () => {
    if (stops.length < 2) return;
    Linking.openURL(getMultiStopMapsUrl(stops.map((s) => s.place.coordinate)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>خريطة اليوم</Text>
        {tripsOffline ? (
          <Ionicons name="cloud-offline-outline" size={18} color={colors.textMuted} />
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {tripDays.length > 0 ? (
        <RtlScrollRow contentContainerStyle={styles.dayRow}>
          {tripDays.map((date) => {
            const iso = formatIsoDate(date);
            const active = selectedDay === iso;
            return (
              <TouchableOpacity
                key={iso}
                style={[styles.dayChip, active && styles.dayChipActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(iso)}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {WEEKDAY_SHORT[date.getDay()]} {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </RtlScrollRow>
      ) : (
        <Text style={styles.noDatesHint}>حدد تواريخ الرحلة عشان تقدر تشوف خريطة كل يوم</Text>
      )}

      {stops.length > 0 && mapRegion ? (
        Platform.OS === 'web' || !MapView || !Marker ? (
          <View style={[styles.map, styles.webFallback]}>
            <Text style={styles.webFallbackText}>معاينة الخريطة متاحة على الجوال فقط</Text>
          </View>
        ) : (
          (() => {
            const MapComponent = MapView;
            const MarkerComponent = Marker;
            const PolylineComponent = Polyline;
            return (
              <MapComponent style={styles.map} initialRegion={mapRegion} customMapStyle={lightMapStyle}>
                {PolylineComponent ? (
                  <PolylineComponent
                    coordinates={stops.map((s) => s.place.coordinate)}
                    strokeColor={colors.primary}
                    strokeWidth={3}
                    lineDashPattern={[6, 6]}
                  />
                ) : null}
                {stops.map((s, i) => (
                  <MarkerComponent key={s.item.id} coordinate={s.place.coordinate} tracksViewChanges={false}>
                    <View style={styles.numberedPin}>
                      <Text style={styles.numberedPinText}>{i + 1}</Text>
                    </View>
                  </MarkerComponent>
                ))}
              </MapComponent>
            );
          })()
        )
      ) : null}

      {stops.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="ما فيه أماكن بجدول هذا اليوم"
          subtitle="أضف أماكن لجدول هذا اليوم عشان تظهر هنا على الخريطة."
        />
      ) : (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{stops.length} أماكن</Text>
              {totalKm > 0 ? <Text style={styles.summaryText}>· {totalKm.toFixed(1)} كم بالخط المستقيم</Text> : null}
            </View>

            {stops.map((s, i) => (
              <View key={s.item.id} style={styles.stopRow}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stopTextWrap}>
                  <Text style={styles.stopTitle}>{s.place.name}</Text>
                  {s.item.slot ? <Text style={styles.stopMeta}>{s.item.time}</Text> : null}
                </View>
              </View>
            ))}

            {stops.length >= 2 ? (
              <TouchableOpacity style={styles.routeButton} activeOpacity={0.85} onPress={handleOpenFullRoute}>
                <Ionicons name="navigate-outline" size={16} color={colors.textOnPrimary} />
                <Text style={styles.routeButtonText}>افتح المسار كامل في الخرائط</Text>
              </TouchableOpacity>
            ) : null}
          </>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  dayRow: { flexDirection: 'row-reverse', gap: spacing.sm, padding: spacing.lg },
  dayChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  dayChipTextActive: { color: colors.textOnPrimary },
  noDatesHint: { color: colors.textMuted, fontSize: fontSize.body, textAlign: 'center', padding: spacing.lg },
  map: { height: 220, marginHorizontal: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  webFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  webFallbackText: { color: colors.textMuted, fontSize: fontSize.body },
  numberedPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberedPinText: { color: colors.textOnPrimary, fontSize: fontSize.base, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryRow: { flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.md },
  summaryText: { color: colors.textMuted, fontSize: fontSize.body, fontWeight: '600' },
  stopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  stopNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: { color: colors.textOnPrimary, fontSize: fontSize.base, fontWeight: '700' },
  stopTextWrap: { flex: 1 },
  stopTitle: { color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '700', textAlign: 'right' },
  stopMeta: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right', marginTop: 2 },
  routeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  routeButtonText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

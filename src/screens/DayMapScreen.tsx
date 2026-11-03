import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { tripDateRange, formatIsoDate } from '../components/DayPicker';
import { haversineDistanceKm } from '../lib/geo';
import { getMultiStopMapsUrl } from '../utils/place';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'DayMap'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAY_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function DayMapScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips } = useAppState();
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
        <View style={{ width: 22 }} />
      </View>

      {tripDays.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
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
        </ScrollView>
      ) : (
        <Text style={styles.noDatesHint}>حدد تواريخ الرحلة عشان تقدر تشوف خريطة كل يوم</Text>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {stops.length === 0 ? (
          <Text style={styles.emptyMuted}>ما فيه أماكن بجدول هذا اليوم</Text>
        ) : (
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
        )}
      </ScrollView>
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
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
  dayChipText: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  dayChipTextActive: { color: colors.textOnPrimary },
  noDatesHint: { color: colors.textMuted, fontSize: 12.5, textAlign: 'center', padding: spacing.lg },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyMuted: { color: colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: spacing.xxl },
  summaryRow: { flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.md },
  summaryText: { color: colors.textMuted, fontSize: 12.5, fontWeight: '600' },
  stopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  stopNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '800' },
  stopTextWrap: { flex: 1 },
  stopTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  stopMeta: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right', marginTop: 2 },
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
  routeButtonText: { color: colors.textOnPrimary, fontSize: 13.5, fontWeight: '700' },
});

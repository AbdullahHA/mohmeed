import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { tripDateRange, formatIsoDate } from './DayPicker';
import { SLOT_LABELS } from './SlotPicker';
import { getMapsUrl } from '../utils/place';
import { supabase } from '../lib/supabase';
import { fetchWeatherNow, type WeatherNow } from '../lib/weather';
import { getNextPrayer, formatCountdown, formatTime, PRAYER_LABELS } from '../lib/prayerTimes';
import { haversineDistanceKm, type Coordinate } from '../lib/geo';
import { searchNearbyPlaces, type GooglePlaceResult } from '../lib/googlePlaces';
import type { Trip, ItineraryItem, ItinerarySlot } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SLOT_ORDER: ItinerarySlot[] = ['breakfast', 'morning', 'lunch', 'afternoon', 'dinner', 'evening'];
const WEEKDAY_LONG = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const SAUDI_EMERGENCY = [
  { label: 'الشرطة', number: '999' },
  { label: 'الإسعاف', number: '997' },
];

// Current slot "today" sits in, by the broad windows the slot labels already
// imply (فطور/صباح/غداء/ظهر/عشاء/مساء). Not a per-item clock time — the app
// never stored one (only a coarse day-part per item) — so this is used only
// to order/pick the next undone item, never shown as a precise countdown.
function currentSlotIndex(now: Date): number {
  const hour = now.getHours();
  if (hour < 10) return SLOT_ORDER.indexOf('breakfast');
  if (hour < 12) return SLOT_ORDER.indexOf('morning');
  if (hour < 14) return SLOT_ORDER.indexOf('lunch');
  if (hour < 17) return SLOT_ORDER.indexOf('afternoon');
  if (hour < 20) return SLOT_ORDER.indexOf('dinner');
  return SLOT_ORDER.indexOf('evening');
}

type Props = { trip: Trip; navigation: Nav };

export default function TodayMode({ trip, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { places, destinations } = useContent();
  const { toggleItineraryItemDone, postponeItineraryItemToTomorrow, tripsOffline } = useAppState();
  const { status: locationStatus, coords: liveCoords, requestLocation } = useUserLocation();

  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [countryInfo, setCountryInfo] = useState<{ emergencyNumber: string | null; embassyPhone: string | null } | null | undefined>(undefined);
  const [nearestHospital, setNearestHospital] = useState<(GooglePlaceResult & { distanceKm: number }) | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const destination = destinations.find((d) => d.name === trip.destination);
  const coordinate: Coordinate | null = liveCoords
    ? liveCoords
    : destination?.latitude != null && destination?.longitude != null
    ? { latitude: destination.latitude, longitude: destination.longitude }
    : null;

  const tripDays = tripDateRange(trip.startDate, trip.endDate);
  const todayIso = formatIsoDate(now);
  const dayIndex = tripDays.findIndex((d) => formatIsoDate(d) === todayIso);
  const dateLabel = `${WEEKDAY_LONG[now.getDay()]} ${now.getDate()} ${MONTHS_AR[now.getMonth()]}`;

  const todayItems = trip.itinerary.filter((i) => i.itemDate === todayIso);
  const undone = todayItems.filter((i) => !i.done);
  const slotIdx = currentSlotIndex(now);
  const sortedUndone = [...undone].sort((a, b) => {
    const ai = a.slot ? SLOT_ORDER.indexOf(a.slot) : 99;
    const bi = b.slot ? SLOT_ORDER.indexOf(b.slot) : 99;
    return ai - bi;
  });
  const nextItem: ItineraryItem | null =
    sortedUndone.find((i) => (i.slot ? SLOT_ORDER.indexOf(i.slot) : 99) >= slotIdx) ?? sortedUndone[0] ?? null;
  const restOfDay = sortedUndone.filter((i) => i.id !== nextItem?.id);
  const nextPlace = nextItem?.placeId ? places.find((p) => p.id === nextItem.placeId) : undefined;

  useEffect(() => {
    if (!coordinate) {
      setWeather(null);
      return;
    }
    let cancelled = false;
    fetchWeatherNow(coordinate).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [coordinate?.latitude, coordinate?.longitude]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('trip_documents')
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', trip.id)
      .then(({ count }) => {
        if (!cancelled) setDocCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  useEffect(() => {
    if (!destination) {
      setCountryInfo(null);
      return;
    }
    if (destination.country === 'السعودية') {
      setCountryInfo(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('country_info')
      .select('emergency_number,embassy_phone')
      .eq('country', destination.country)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCountryInfo(data ? { emergencyNumber: data.emergency_number, embassyPhone: data.embassy_phone } : null);
      });
    return () => {
      cancelled = true;
    };
  }, [destination?.country]);

  useEffect(() => {
    if (!coordinate) {
      setNearestHospital(null);
      return;
    }
    let cancelled = false;
    searchNearbyPlaces('hospital', coordinate, 20000).then((results) => {
      if (cancelled || results.length === 0) return;
      const withDistance = results.map((r) => ({ ...r, distanceKm: haversineDistanceKm(coordinate, r.coordinate) }));
      withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      setNearestHospital(withDistance[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [coordinate?.latitude, coordinate?.longitude]);

  const nextPrayer = coordinate ? getNextPrayer(coordinate, now) : null;

  const openDirections = (coord: Coordinate) => Linking.openURL(getMapsUrl(coord));
  const callNumber = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            {dayIndex >= 0 ? `اليوم ${dayIndex + 1} من ${tripDays.length}` : 'وضع اليوم'} · {trip.destination}
          </Text>
          <Text style={styles.headerDate}>{dateLabel}</Text>
        </View>
        {tripsOffline ? (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color={colors.textMuted} />
            <Text style={styles.offlineBadgeText}>محفوظ بدون نت</Text>
          </View>
        ) : null}
      </View>

      {nextItem ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>التالي</Text>
          <Text style={styles.nextTitle}>{nextItem.title}</Text>
          <Text style={styles.nextSlot}>{nextItem.slot ? SLOT_LABELS[nextItem.slot] : nextItem.time}</Text>
          <View style={styles.nextActions}>
            <TouchableOpacity
              style={[styles.nextActionBtn, styles.nextActionPrimary]}
              activeOpacity={0.85}
              onPress={() => toggleItineraryItemDone(trip.id, nextItem.id)}
            >
              <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
              <Text style={[styles.nextActionText, styles.nextActionTextPrimary]}>وصلت</Text>
            </TouchableOpacity>
            {nextPlace ? (
              <TouchableOpacity
                style={styles.nextActionBtn}
                activeOpacity={0.85}
                onPress={() => openDirections(nextPlace.coordinate)}
              >
                <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                <Text style={styles.nextActionText}>الاتجاهات</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.nextActionBtn}
              activeOpacity={0.85}
              onPress={() => postponeItineraryItemToTomorrow(trip.id, nextItem.id)}
            >
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.nextActionText}>أجّل</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          <Text style={styles.doneCardText}>خلصت برنامج اليوم 🎉</Text>
        </View>
      )}

      <View style={styles.cardsGrid}>
        <View style={styles.infoCard}>
          <Ionicons name="moon-outline" size={16} color={colors.primary} />
          <Text style={styles.infoCardTitle}>الصلاة</Text>
          {nextPrayer ? (
            <>
              <Text style={styles.infoCardMain}>{PRAYER_LABELS[nextPrayer.name]}</Text>
              <Text style={styles.infoCardSub}>{formatTime(nextPrayer.at, coordinate ?? undefined)} · {formatCountdown(nextPrayer.at.getTime() - now.getTime())}</Text>
            </>
          ) : (
            <Text style={styles.infoCardSub}>غير متوفر</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="partly-sunny-outline" size={16} color={colors.primary} />
          <Text style={styles.infoCardTitle}>الطقس الحين</Text>
          {weather ? (
            <>
              <Text style={styles.infoCardMain}>{weather.tempC}°</Text>
              <Text style={styles.infoCardSub}>{weather.condition}</Text>
            </>
          ) : !coordinate && locationStatus !== 'granted' ? (
            <TouchableOpacity onPress={requestLocation}>
              <Text style={styles.infoCardLink}>فعّل الموقع</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoCardSub}>غير متوفر</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Documents', { tripId: trip.id })}
        >
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.infoCardTitle}>مستنداتي</Text>
          <Text style={styles.infoCardMain}>{docCount ?? '—'}</Text>
          <Text style={styles.infoCardSub}>{docCount ? 'مستند محفوظ' : 'ولا مستند'}</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="medkit-outline" size={16} color={colors.red} />
          <Text style={styles.infoCardTitle}>طوارئ</Text>
          {destination?.country === 'السعودية' ? (
            <View style={{ gap: 2 }}>
              {SAUDI_EMERGENCY.map((e) => (
                <TouchableOpacity key={e.number} onPress={() => callNumber(e.number)}>
                  <Text style={styles.infoCardLink}>{e.label} {e.number}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : countryInfo?.emergencyNumber ? (
            <TouchableOpacity onPress={() => callNumber(countryInfo.emergencyNumber!)}>
              <Text style={styles.infoCardLink}>{countryInfo.emergencyNumber}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoCardSub}>غير متوفر</Text>
          )}
          {nearestHospital ? (
            <TouchableOpacity onPress={() => openDirections(nearestHospital.coordinate)} style={{ marginTop: 4 }}>
              <Text style={styles.infoCardHospital} numberOfLines={1}>
                🏥 {nearestHospital.name} ({nearestHospital.distanceKm.toFixed(1)} كم)
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {restOfDay.length > 0 ? (
        <View style={styles.restSection}>
          <Text style={styles.restTitle}>باقي اليوم</Text>
          {restOfDay.map((item) => (
            <View key={item.id} style={styles.restRow}>
              <TouchableOpacity onPress={() => toggleItineraryItemDone(trip.id, item.id)}>
                <Ionicons name="ellipse-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.restRowSlot}>{item.slot ? SLOT_LABELS[item.slot] : item.time}</Text>
              <Text style={styles.restRowTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {todayItems.filter((i) => i.done).length > 0 ? (
        <View style={styles.restSection}>
          <Text style={styles.restTitle}>خلّصتها اليوم</Text>
          {todayItems
            .filter((i) => i.done)
            .map((item) => (
              <View key={item.id} style={styles.restRow}>
                <TouchableOpacity onPress={() => toggleItineraryItemDone(trip.id, item.id)}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.restRowTitle, styles.restRowDone]} numberOfLines={1}>{item.title}</Text>
              </View>
            ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTextWrap: { gap: 2 },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  headerDate: { color: colors.textMuted, fontSize: 12, textAlign: 'right' },
  offlineBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  offlineBadgeText: { color: colors.textMuted, fontSize: 10 },
  nextCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  nextLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  nextTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  nextSlot: { color: colors.textMuted, fontSize: 12.5, textAlign: 'right', marginBottom: spacing.sm },
  nextActions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.xs },
  nextActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  nextActionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  nextActionText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  nextActionTextPrimary: { color: colors.textOnPrimary },
  doneCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  doneCardText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  infoCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  infoCardTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 4 },
  infoCardMain: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  infoCardSub: { color: colors.textMuted, fontSize: 11, textAlign: 'right' },
  infoCardLink: { color: colors.primary, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  infoCardHospital: { color: colors.textMuted, fontSize: 10.5, textAlign: 'right' },
  restSection: { gap: spacing.xs },
  restTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  restRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  restRowSlot: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  restRowTitle: { flex: 1, color: colors.text, fontSize: 12.5, fontWeight: '600', textAlign: 'right' },
  restRowDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
});

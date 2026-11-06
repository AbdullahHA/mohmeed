import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { useUserLocation } from '../hooks/useUserLocation';
import { haversineDistanceKm } from '../lib/geo';
import { searchNearbyPlaces, cacheGooglePlace, type GooglePlaceResult } from '../lib/googlePlaces';
import { PLACE_TYPE_LABELS } from '../data/places';
import RtlScrollRow from '../components/RtlScrollRow';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CategoryFilter = 'all' | 'restaurant' | 'cafe' | 'tourist_attraction';

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'restaurant', label: 'مطاعم' },
  { value: 'cafe', label: 'مقاهي' },
  { value: 'tourist_attraction', label: 'تجارب' },
];

export default function TrendingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { destinations } = useContent();
  const { requireAccount } = useRequireAccount();
  const { coords, requestLocation } = useUserLocation();
  const [manualCityId, setManualCityId] = useState<string | null>(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const citiesWithCoords = useMemo(
    () => destinations.filter((d) => d.latitude != null && d.longitude != null),
    [destinations]
  );

  const nearestDestinationId = useMemo(() => {
    if (!coords || citiesWithCoords.length === 0) return null;
    let best = citiesWithCoords[0];
    let bestDist = haversineDistanceKm(coords, { latitude: best.latitude!, longitude: best.longitude! });
    for (const d of citiesWithCoords.slice(1)) {
      const dist = haversineDistanceKm(coords, { latitude: d.latitude!, longitude: d.longitude! });
      if (dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    return best.id;
  }, [coords, citiesWithCoords]);

  const currentCityId = manualCityId ?? nearestDestinationId ?? citiesWithCoords[0]?.id ?? null;
  const currentCity = currentCityId ? destinations.find((d) => d.id === currentCityId) ?? null : null;

  useEffect(() => {
    if (!currentCity || currentCity.latitude == null || currentCity.longitude == null) {
      setResults([]);
      return;
    }
    const center = { latitude: currentCity.latitude, longitude: currentCity.longitude };
    const types: Exclude<CategoryFilter, 'all'>[] =
      category === 'all' ? ['restaurant', 'cafe', 'tourist_attraction'] : [category];
    let cancelled = false;
    setLoading(true);
    Promise.all(types.map((t) => searchNearbyPlaces(t, center))).then((lists) => {
      if (cancelled) return;
      const merged = new Map<string, GooglePlaceResult>();
      for (const list of lists) {
        for (const r of list) if (!merged.has(r.id)) merged.set(r.id, r);
      }
      const sorted = Array.from(merged.values())
        .filter((r) => (r.ratingCount ?? 0) > 0)
        .sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
        .slice(0, 20);
      setResults(sorted);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentCity?.id, category]);

  const handleOpen = (result: GooglePlaceResult) => {
    if (!currentCity) return;
    requireAccount('trip', async () => {
      setOpeningId(result.id);
      const placeId = await cacheGooglePlace(result, currentCity.id);
      setOpeningId(null);
      if (placeId) navigation.navigate('PlaceDetail', { placeId });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>الأكثر طلبًا الآن</Text>
          <Ionicons name="flame" size={16} color={colors.red} />
        </View>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.subtitle}>مرتّبة حسب عدد تقييمات Google الحقيقي لكل مكان</Text>

      <TouchableOpacity style={styles.cityRow} activeOpacity={0.8} onPress={() => setCityPickerVisible(true)}>
        <Ionicons name="chevron-down" size={14} color={colors.textFaint} />
        <Text style={styles.cityText}>{currentCity ? currentCity.name : 'اختر مدينة'}</Text>
        <Ionicons name="location-outline" size={14} color={colors.primary} />
      </TouchableOpacity>

      <RtlScrollRow contentContainerStyle={styles.chipsRow}>
        {CATEGORY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.chip, category === tab.value && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => setCategory(tab.value)}
          >
            <Text style={[styles.chipText, category === tab.value && styles.chipTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </RtlScrollRow>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : results.length === 0 ? (
          <Text style={styles.emptyText}>ما لقينا نتائج بهذي المدينة حاليًا</Text>
        ) : (
          results.map((r, index) => (
            <TouchableOpacity
              key={r.id}
              style={styles.row}
              activeOpacity={0.8}
              disabled={openingId === r.id}
              onPress={() => handleOpen(r)}
            >
              <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                {openingId === r.id ? (
                  <ActivityIndicator size="small" color={index < 3 ? '#fff' : colors.textMuted} />
                ) : (
                  <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>#{index + 1}</Text>
                )}
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                <View style={styles.rowMetaRow}>
                  <Text style={styles.rowMeta}>{currentCity?.name}</Text>
                  <Text style={styles.rowDot}>·</Text>
                  <Text style={styles.rowMeta}>{PLACE_TYPE_LABELS[r.type]}</Text>
                </View>
              </View>
              {r.rating != null ? (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingCountText}>({(r.ratingCount ?? 0).toLocaleString()})</Text>
                  <Text style={styles.ratingText}>{r.rating.toFixed(1)}</Text>
                  <Ionicons name="star" size={12} color={colors.warning} />
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={cityPickerVisible} transparent animationType="fade" onRequestClose={() => setCityPickerVisible(false)}>
        <Pressable style={styles.cityBackdrop} onPress={() => setCityPickerVisible(false)}>
          <View style={styles.citySheet}>
            <TouchableOpacity
              style={styles.cityOption}
              activeOpacity={0.8}
              onPress={() => {
                setManualCityId(null);
                setCityPickerVisible(false);
                requestLocation();
              }}
            >
              <Text style={styles.cityOptionText}>موقعي الحالي</Text>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 320 }}>
              {citiesWithCoords.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.cityOption}
                  activeOpacity={0.8}
                  onPress={() => {
                    setManualCityId(d.id);
                    setCityPickerVisible(false);
                  }}
                >
                  <Text style={styles.cityOptionText}>{d.name}</Text>
                  <Ionicons
                    name={currentCityId === d.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={currentCityId === d.id ? colors.primary : colors.textFaint}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  cityText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: { backgroundColor: colors.red },
  rankText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  rankTextTop: { color: '#fff' },
  rowInfo: { flex: 1 },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  rowMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  rowMeta: { color: colors.textMuted, fontSize: 11 },
  rowDot: { color: colors.textFaint, fontSize: 11 },
  ratingBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  ratingCountText: { color: colors.textFaint, fontSize: 10.5 },
  cityBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  citySheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  cityOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityOptionText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});

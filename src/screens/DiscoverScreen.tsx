import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlacesMapView from '../components/PlacesMapView';
import { radius, spacing, fixedColors, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { useUserLocation } from '../hooks/useUserLocation';
import { haversineDistanceKm } from '../lib/geo';
import { PLACE_TYPE_LABELS, type Place, type PlaceType } from '../data/places';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

const CITY_STORAGE_KEY = 'yalla-nsafer:discover-city';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'map';

const TYPE_FILTERS: Array<{ value: PlaceType; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { value: 'experiences', icon: 'sparkles-outline', color: fixedColors.category.experiences },
  { value: 'events', icon: 'calendar-outline', color: fixedColors.category.events },
  { value: 'cafe', icon: 'cafe-outline', color: fixedColors.category.cafe },
  { value: 'food', icon: 'restaurant-outline', color: fixedColors.category.food },
  { value: 'shopping', icon: 'bag-outline', color: fixedColors.category.shopping },
  { value: 'nature', icon: 'leaf-outline', color: fixedColors.category.nature },
  { value: 'landmarks', icon: 'flag-outline', color: fixedColors.category.landmarks },
  { value: 'hotels', icon: 'bed-outline', color: fixedColors.category.hotels },
];

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { places, destinations } = useContent();
  const { recommendedPlaceIds, toggleRecommended, currentUser } = useAppState();
  const firstName = currentUser.name.trim().split(/\s+/)[0];
  const { requireAccount } = useRequireAccount();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<PlaceType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [manualCityId, setManualCityId] = useState<string | null>(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const { coords, requestLocation } = useUserLocation();

  useEffect(() => {
    AsyncStorage.getItem(CITY_STORAGE_KEY).then((saved) => {
      if (saved) setManualCityId(saved);
    });
  }, []);

  // Honest "current city": a manual pick always wins; otherwise the nearest
  // destination to the real device GPS fix — never a guessed default.
  const nearestDestinationId = useMemo(() => {
    if (!coords) return null;
    const withCoords = destinations.filter((d) => d.latitude != null && d.longitude != null);
    if (withCoords.length === 0) return null;
    let best = withCoords[0];
    let bestDist = haversineDistanceKm(coords, { latitude: best.latitude!, longitude: best.longitude! });
    for (const d of withCoords.slice(1)) {
      const dist = haversineDistanceKm(coords, { latitude: d.latitude!, longitude: d.longitude! });
      if (dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    return best.id;
  }, [coords, destinations]);

  const currentCityId = manualCityId ?? nearestDestinationId;
  const currentCity = currentCityId ? destinations.find((d) => d.id === currentCityId) ?? null : null;

  const selectCity = (id: string) => {
    setManualCityId(id);
    setCityPickerVisible(false);
    AsyncStorage.setItem(CITY_STORAGE_KEY, id).catch(() => {});
  };

  const useMyLocation = () => {
    setManualCityId(null);
    AsyncStorage.removeItem(CITY_STORAGE_KEY).catch(() => {});
    setCityPickerVisible(false);
    requestLocation();
  };

  const cityPlaces = useMemo(
    () => (currentCityId ? places.filter((p) => p.destinationId === currentCityId) : places),
    [places, currentCityId]
  );

  const filteredPlaces = useMemo(() => {
    return cityPlaces.filter((place) => {
      const matchesType = !activeType || place.type === activeType;
      const matchesQuery = place.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [query, activeType, cityPlaces]);

  const pickedForYou = useMemo(() => {
    const scored = [...cityPlaces].sort((a, b) => b.rating - a.rating).slice(0, 6);
    return scored.map((place) => ({
      place,
      why: recommendedPlaceIds.includes(place.id) ? 'من مفضلاتك' : 'الأعلى تقييمًا',
    }));
  }, [cityPlaces, recommendedPlaceIds]);

  const experiences = useMemo(() => cityPlaces.filter((p) => p.type === 'experiences').slice(0, 4), [cityPlaces]);

  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.top}>
          <View style={styles.topRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setCityPickerVisible(true)}>
              {currentCity ? (
                <>
                  <Text style={styles.cityKicker}>أنت في</Text>
                  <View style={styles.cityRow}>
                    <Ionicons name="chevron-down" size={14} color={colors.text} />
                    <Text style={styles.topTitle}>{currentCity.name}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.topTitle}>اكتشف</Text>
              )}
            </TouchableOpacity>
            <View style={styles.topIcons}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.8}
                onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
              >
                <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.8}
                onPress={() => requireAccount('recommend', () => navigation.navigate('SavedPlaces'))}
              >
                <Ionicons name="heart-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="مطعم، فعالية، مدينة…"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                if (query.trim()) navigation.navigate('Results', { title: `بحث: ${query.trim()}`, query: query.trim() });
              }}
              returnKeyType="search"
              textAlign="right"
            />
          </View>
        </View>

        {viewMode === 'map' ? (
          <PlacesMapView
            places={filteredPlaces}
            onMarkerPress={(place) => navigation.navigate('PlaceDetail', { placeId: place.id })}
          />
        ) : (
          <>
            <View style={styles.cats}>
              {TYPE_FILTERS.map((item) => {
                const active = activeType === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.cat}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('Results', {
                        title: PLACE_TYPE_LABELS[item.value],
                        category: item.value,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.catIcon,
                        { borderColor: active ? item.color : colors.border },
                        active && { backgroundColor: item.color + '1a' },
                      ]}
                    >
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={styles.catLabel}>{PLACE_TYPE_LABELS[item.value]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sec}>
              <View style={styles.secTitle}>
                <Text style={styles.secTitleText}>مختارة لك يا {firstName}</Text>
              </View>
              <View style={styles.pgrid}>
                {pickedForYou.map(({ place, why }) => {
                  const isRecommended = recommendedPlaceIds.includes(place.id);
                  return (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.pcard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                    >
                      <View style={styles.pcardImageWrap}>
                        <Image source={place.image} style={styles.pcardImage} />
                        <TouchableOpacity
                          style={styles.pcardHeart}
                          activeOpacity={0.7}
                          onPress={() => requireAccount('recommend', () => toggleRecommended(place.id))}
                        >
                          <Ionicons
                            name={isRecommended ? 'heart' : 'heart-outline'}
                            size={15}
                            color={isRecommended ? colors.heart : '#fff'}
                          />
                        </TouchableOpacity>
                        <View style={styles.pcardWhy}>
                          <Text style={styles.pcardWhyText}>{why}</Text>
                        </View>
                      </View>
                      <Text style={styles.pcardName} numberOfLines={1}>{place.name}</Text>
                      <View style={styles.pcardMeta}>
                        <Ionicons name="star" size={12} color={colors.accentDark} />
                        <Text style={styles.pcardMetaText}>{place.rating.toFixed(1)}</Text>
                        <Text style={styles.pcardMetaText}>· {PLACE_TYPE_LABELS[place.type]}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {experiences.length > 0 ? (
              <View style={styles.sec}>
                <View style={styles.secTitle}>
                  <Text style={styles.secTitleText}>تجارب تستاهل</Text>
                </View>
                <View style={styles.rows}>
                  {experiences.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.row}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                    >
                      <Image source={place.image} style={styles.rowImage} />
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{place.name}</Text>
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {PLACE_TYPE_LABELS[place.type]} · {destinationName(place.destinationId) ?? ''}
                        </Text>
                      </View>
                      <View style={styles.rowRating}>
                        <Ionicons name="star" size={12} color={colors.accentDark} />
                        <Text style={styles.rowRatingText}>{place.rating.toFixed(1)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.sec}>
              <View style={styles.secTitle}>
                <Text style={styles.secTitleText}>الوجهات</Text>
              </View>
              <View style={styles.dgrid}>
                {destinations.map((destination) => (
                  <TouchableOpacity
                    key={destination.id}
                    style={styles.dtile}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
                  >
                    <Image source={destination.image} style={styles.dtileImage} />
                    <View style={styles.dtileOverlay} />
                    <Text style={styles.dtileName}>{destination.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sec}>
              <View style={styles.secTitle}>
                <Text style={styles.secTitleText}>كل الأماكن</Text>
              </View>
              {filteredPlaces.length === 0 ? (
                <Text style={styles.emptyText}>ما لقينا شي بهالفلاتر</Text>
              ) : (
                <FlatList
                  data={filteredPlaces}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.rows}
                  renderItem={({ item: place }) => (
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                    >
                      <Image source={place.image} style={styles.rowImage} />
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{place.name}</Text>
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {PLACE_TYPE_LABELS[place.type]} · {destinationName(place.destinationId) ?? ''}
                        </Text>
                      </View>
                      <Text style={styles.rowPrice}>{'﷼'.repeat(place.priceLevel)}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={cityPickerVisible} transparent animationType="fade" onRequestClose={() => setCityPickerVisible(false)}>
        <Pressable style={styles.cityBackdrop} onPress={() => setCityPickerVisible(false)}>
          <Pressable style={styles.citySheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.citySheetTitle}>اختر مدينتك</Text>
            <TouchableOpacity style={styles.cityOption} activeOpacity={0.8} onPress={useMyLocation}>
              <Ionicons name="locate-outline" size={16} color={colors.primary} />
              <Text style={styles.cityOptionTextPrimary}>استخدم موقعي الحالي</Text>
            </TouchableOpacity>
            <ScrollView style={styles.cityList}>
              {destinations.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.cityOption}
                  activeOpacity={0.8}
                  onPress={() => selectCity(d.id)}
                >
                  <Ionicons
                    name={currentCityId === d.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={currentCityId === d.id ? colors.primary : colors.textFaint}
                  />
                  <Text style={styles.cityOptionText}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },
  top: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  topIcons: { flexDirection: 'row-reverse', gap: spacing.sm },
  cityKicker: { color: colors.textMuted, fontSize: 11, textAlign: 'right' },
  cityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  cityBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  citySheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  citySheetTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: spacing.md },
  cityList: { marginTop: spacing.xs },
  cityOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityOptionText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  cityOptionTextPrimary: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13.5 },
  cats: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  cat: { width: '23%', alignItems: 'center', gap: spacing.xs },
  catIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { color: colors.text, fontSize: 11, fontWeight: '500' },
  sec: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  secTitle: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  secTitleText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pgrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  pcard: { width: '47%', gap: spacing.xs },
  pcardImageWrap: { width: '100%', height: 130, borderRadius: radius.lg, overflow: 'hidden' },
  pcardImage: { width: '100%', height: '100%' },
  pcardHeart: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcardWhy: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pcardWhyText: { color: '#141a2b', fontSize: 10.5, fontWeight: '600' },
  pcardName: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  pcardMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  pcardMetaText: { color: colors.textMuted, fontSize: 11.5 },
  rows: { gap: spacing.md },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  rowImage: { width: 64, height: 64, borderRadius: radius.md },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
  rowRating: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  rowRatingText: { color: colors.accentDark, fontSize: 12, fontWeight: '700' },
  rowPrice: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  dgrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  dtile: { width: '31.5%', aspectRatio: 0.75, borderRadius: radius.md, overflow: 'hidden', justifyContent: 'flex-end' },
  dtileImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dtileOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  dtileName: { color: '#fff', fontSize: 12.5, fontWeight: '700', textAlign: 'center', paddingVertical: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});

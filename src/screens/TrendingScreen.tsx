import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import FilterChip from '../components/FilterChip';
import PlaceCard from '../components/PlaceCard';
import PlacesMapView from '../components/PlacesMapView';
import EmptyState from '../components/EmptyState';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { placesByCity } from '../data/places';
import { CATEGORIES, type TrendCategory } from '../data/categories';
import { CITIES, cityBySlug } from '../data/cities';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<MainTabParamList, 'Trending'>;
type ViewMode = 'list' | 'map';

export default function TrendingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [citySlug, setCitySlug] = useState(route.params?.city ?? 'riyadh');
  const [activeCategory, setActiveCategory] = useState<TrendCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (route.params?.city) setCitySlug(route.params.city);
  }, [route.params?.city]);

  const city = cityBySlug(citySlug);
  const cityPlaces = useMemo(() => placesByCity(citySlug), [citySlug]);
  const filteredPlaces = useMemo(
    () => cityPlaces.filter((p) => activeCategory === 'all' || p.trendCategory === activeCategory),
    [cityPlaces, activeCategory],
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="الرائج" subtitle={city ? `${city.name}، ${city.country}` : ''} />

      <FlatList
        data={CITIES}
        horizontal
        keyExtractor={(item) => item.slug}
        showsHorizontalScrollIndicator={false}
        style={styles.cityRowList}
        contentContainerStyle={styles.cityRow}
        renderItem={({ item }) => (
          <FilterChip
            label={item.name}
            active={item.slug === citySlug}
            onPress={() => setCitySlug(item.slug)}
          />
        )}
      />

      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.toggleButton}
          activeOpacity={0.8}
          onPress={() => setViewMode((mode) => (mode === 'list' ? 'map' : 'list'))}
        >
          <Ionicons
            name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
        <FlatList
          data={CATEGORIES}
          horizontal
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={activeCategory === item.key}
              onPress={() => setActiveCategory(item.key)}
            />
          )}
        />
      </View>

      {cityPlaces.length === 0 ? (
        <EmptyState
          icon="hourglass-outline"
          title="قريباً في هذه المدينة"
          subtitle="نجهز أفضل الأماكن الرائجة هنا. جرّب الرياض أو جدة الآن."
        />
      ) : viewMode === 'list' ? (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد أماكن مطابقة لهذا التصنيف</Text>}
        />
      ) : (
        <PlacesMapView
          places={filteredPlaces}
          onMarkerPress={(place) => navigation.navigate('PlaceDetail', { placeId: place.id })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cityRowList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  cityRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row-reverse',
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

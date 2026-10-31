import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PlaceCard from '../components/PlaceCard';
import PlacesMapView from '../components/PlacesMapView';
import { colors, radius, spacing } from '../theme/colors';
import type { Place } from '../data/places';
import { heroDestination } from '../data/destinations';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'map';

const FILTERS: Array<{ value: Place['category']; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'الافتراضي', icon: 'apps-outline' },
  { value: 'هادئ الآن', icon: 'leaf-outline' },
  { value: 'Hot Spot', icon: 'flame-outline' },
];

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { places, destinations } = useContent();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Place['category']>('الافتراضي');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesFilter = activeFilter === 'الافتراضي' || place.category === activeFilter;
      const matchesQuery = place.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesDestination = !selectedDestinationId || place.destinationId === selectedDestinationId;
      return matchesFilter && matchesQuery && matchesDestination;
    });
  }, [query, activeFilter, selectedDestinationId, places]);

  const featuredPlace = useMemo(
    () => [...places].sort((a, b) => b.rating - a.rating)[0],
    [places]
  );
  const featuredDestinationName = useMemo(
    () => destinations.find((d) => d.id === featuredPlace?.destinationId)?.name,
    [destinations, featuredPlace]
  );

  const listWithoutFeatured = useMemo(
    () => filteredPlaces.filter((p) => p.id !== featuredPlace?.id),
    [filteredPlaces, featuredPlace]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={heroDestination.image} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroHeader}>
          <TouchableOpacity
            style={styles.toggleButton}
            activeOpacity={0.8}
            onPress={() => setViewMode((mode) => (mode === 'list' ? 'map' : 'list'))}
          >
            <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>استكشف</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مكان..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
        </View>
      </ImageBackground>

      {viewMode === 'list' ? (
        <FlatList
          data={listWithoutFeatured}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {featuredPlace ? (
                <TouchableOpacity
                  style={styles.featuredCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('PlaceDetail', { placeId: featuredPlace.id })}
                >
                  <Image source={featuredPlace.image} style={styles.featuredImage} />
                  <View style={styles.featuredOverlay} />
                  <View style={styles.featuredTextWrap}>
                    <Text style={styles.featuredTitle}>{featuredPlace.name}</Text>
                    {featuredDestinationName ? (
                      <Text style={styles.featuredSubtitle}>{featuredDestinationName}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filtersRow}
              >
                {FILTERS.map((item) => {
                  const active = activeFilter === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.filterChip}
                      activeOpacity={0.8}
                      onPress={() => setActiveFilter(item.value)}
                    >
                      <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                        <Ionicons name={item.icon} size={24} color={active ? colors.primary : colors.textMuted} />
                      </View>
                      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {destinations.length > 0 ? (
                <View style={styles.destinationsSection}>
                  <Text style={styles.destinationsTitle}>الوجهات</Text>
                  <View style={styles.destinationsGrid}>
                    {destinations.map((destination) => {
                      const selected = selectedDestinationId === destination.id;
                      return (
                        <TouchableOpacity
                          key={destination.id}
                          style={styles.destinationTile}
                          activeOpacity={0.85}
                          onPress={() =>
                            setSelectedDestinationId((current) =>
                              current === destination.id ? null : destination.id
                            )
                          }
                        >
                          <Image source={destination.image} style={styles.destinationImage} />
                          <View style={styles.destinationOverlay} />
                          {selected ? <View style={styles.destinationSelectedRing} /> : null}
                          <Text style={styles.destinationName}>{destination.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا توجد نتائج مطابقة لبحثك</Text>
          }
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
  hero: {
    height: 210,
    justifyContent: 'space-between',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  heroHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  featuredCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  featuredTextWrap: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    left: spacing.md,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  featuredSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.lg,
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 76,
  },
  filterBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.primarySoft,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  destinationsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  destinationsTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  destinationsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  destinationTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  destinationImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  destinationSelectedRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  destinationName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  list: {
    paddingBottom: 120,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

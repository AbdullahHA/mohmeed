import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import FilterChip from '../components/FilterChip';
import PlaceCard from '../components/PlaceCard';
import PlacesMapView from '../components/PlacesMapView';
import { colors, radius, spacing } from '../theme/colors';
import type { Place } from '../data/places';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'map';

const FILTERS: Array<Place['category']> = ['الافتراضي', 'هادئ الآن', 'Hot Spot'];

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { places } = useContent();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Place['category']>('الافتراضي');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesFilter = activeFilter === 'الافتراضي' || place.category === activeFilter;
      const matchesQuery = place.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [query, activeFilter, places]);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
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
      </View>

      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            active={activeFilter === item}
            onPress={() => setActiveFilter(item)}
          />
        )}
      />

      {viewMode === 'list' ? (
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
  searchBar: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

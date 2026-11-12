import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { useUserLocation } from '../hooks/useUserLocation';
import { haversineDistanceKm } from '../lib/geo';
import { PLACE_TYPE_LABELS, type Place, type PlaceType } from '../data/places';
import { useContent } from '../context/ContentContext';
import { supabase } from '../lib/supabase';
import PlacesMapView from '../components/PlacesMapView';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'Results'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortMode = 'default' | 'nearest';
type ViewMode = 'list' | 'map';

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { title, category, query, destinationId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { places, destinations } = useContent();
  const { recommendedPlaceIds, toggleRecommended, followingIds } = useAppState();
  const { requireAccount } = useRequireAccount();
  const { status: locationStatus, coords, requestLocation } = useUserLocation();

  const [priceFilter, setPriceFilter] = useState<Set<1 | 2 | 3>>(new Set());
  const [sort, setSort] = useState<SortMode>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [friendSignals, setFriendSignals] = useState<Record<string, string[]>>({});

  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name;

  const baseResults = useMemo(() => {
    return places.filter((p) => {
      if (category && p.type !== category) return false;
      if (destinationId && p.destinationId !== destinationId) return false;
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      if (priceFilter.size > 0 && !priceFilter.has(p.priceLevel)) return false;
      return true;
    });
  }, [places, category, destinationId, query, priceFilter]);

  const distanceFor = (place: Place) =>
    coords ? haversineDistanceKm(coords, place.coordinate) : null;

  const results = useMemo(() => {
    if (sort === 'nearest' && coords) {
      return [...baseResults].sort((a, b) => (distanceFor(a) ?? Infinity) - (distanceFor(b) ?? Infinity));
    }
    return baseResults;
  }, [baseResults, sort, coords]);

  useEffect(() => {
    if (followingIds.length === 0 || baseResults.length === 0) {
      setFriendSignals({});
      return;
    }
    let cancelled = false;
    supabase
      .from('recommended_places')
      .select('place_id,profiles(name)')
      .in('place_id', baseResults.map((p) => p.id))
      .in('profile_id', followingIds)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string[]> = {};
        for (const row of data as any[]) {
          const name = row.profiles?.name;
          if (!name) continue;
          (map[row.place_id] ??= []).push(name);
        }
        setFriendSignals(map);
      });
    return () => {
      cancelled = true;
    };
  }, [baseResults, followingIds]);

  const togglePrice = (level: 1 | 2 | 3) => {
    setPriceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const handleNearestToggle = () => {
    if (sort === 'nearest') {
      setSort('default');
      return;
    }
    if (locationStatus === 'granted') {
      setSort('nearest');
    } else {
      requestLocation();
      setSort('nearest');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerCount}>{results.length} مكان</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
        >
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, sort === 'nearest' && styles.filterChipActive]}
          activeOpacity={0.8}
          onPress={handleNearestToggle}
        >
          <Ionicons
            name="navigate-outline"
            size={13}
            color={sort === 'nearest' ? colors.textOnPrimary : colors.text}
          />
          <Text style={[styles.filterChipText, sort === 'nearest' && styles.filterChipTextActive]}>الأقرب</Text>
        </TouchableOpacity>
        {([1, 2, 3] as const).map((level) => {
          const active = priceFilter.has(level);
          return (
            <TouchableOpacity
              key={level}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.8}
              onPress={() => togglePrice(level)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {'﷼'.repeat(level)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {viewMode === 'map' ? (
        <PlacesMapView
          places={results}
          onMarkerPress={(place) => navigation.navigate('PlaceDetail', { placeId: place.id })}
        />
      ) : results.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>ما لقينا شي بهالفلاتر</Text>
          {priceFilter.size > 0 ? (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setPriceFilter(new Set())}>
              <Text style={styles.emptyClear}>امسح الفلاتر</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: place }) => {
            const isRecommended = recommendedPlaceIds.includes(place.id);
            const distance = distanceFor(place);
            const friends = friendSignals[place.id] ?? [];
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
              >
                <View style={styles.cardImageWrap}>
                  <Image source={place.image} style={styles.cardImage} />
                  <TouchableOpacity
                    style={styles.heartButton}
                    activeOpacity={0.7}
                    onPress={() => requireAccount('recommend', () => toggleRecommended(place.id))}
                  >
                    <Ionicons
                      name={isRecommended ? 'heart' : 'heart-outline'}
                      size={16}
                      color={isRecommended ? colors.heart : '#fff'}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardMetaRow}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={colors.accentDark} />
                      <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.cardMetaText}>
                      {PLACE_TYPE_LABELS[place.type]} · {'﷼'.repeat(place.priceLevel)}
                      {distance !== null ? ` · ${distance < 1 ? Math.round(distance * 1000) + ' م' : distance.toFixed(1) + ' كم'}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.cardName}>{place.name}</Text>
                  {destinationId ? null : (
                    <Text style={styles.cardDestination}>{destinationName(place.destinationId)}</Text>
                  )}
                  {friends.length > 0 ? (
                    <Text style={styles.friendsLine} numberOfLines={1}>
                      {friends.slice(0, 2).join(' و')}
                      {friends.length > 2 ? ` و${friends.length - 2} غيرهم` : ''} يعجبهم هالمكان
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
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
  headerTextWrap: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  headerCount: { color: colors.textMuted, fontSize: fontSize.base, marginTop: 2 },
  filterBar: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  filterChipTextActive: { color: colors.textOnPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardImageWrap: { width: '100%', height: 170 },
  cardImage: { width: '100%', height: '100%' },
  heartButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: spacing.md, gap: 3 },
  cardMetaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.accentDark, fontSize: fontSize.body, fontWeight: '700' },
  cardMetaText: { color: colors.textMuted, fontSize: fontSize.base },
  cardName: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  cardDestination: { color: colors.textFaint, fontSize: fontSize.base, textAlign: 'right' },
  friendsLine: { color: colors.primaryDark, fontSize: fontSize.base, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.body },
  emptyClear: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700' },
});

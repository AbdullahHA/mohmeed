import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import RtlScrollRow from '../components/RtlScrollRow';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CircularProgress from '../components/CircularProgress';
import DestinationsMapView from '../components/DestinationsMapView';
import { fontSize, radius, spacing, fixedColors, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { flagForRegion } from '../data/countryFlags';
import { PASSPORT_BADGES } from '../data/passportBadges';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'UserPassport'>;

const WORLD_COUNTRIES = 195;
const STAMP_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatStampDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${STAMP_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default function UserPassportScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loadUserVisitedPlaces } = useAppState();
  const { destinations } = useContent();

  const [loading, setLoading] = useState(true);
  const [visitedDestinations, setVisitedDestinations] = useState<
    { destination: (typeof destinations)[number]; visitedAt: number }[]
  >([]);
  const [manualPlaces, setManualPlaces] = useState<
    { id: string; name: string; country: string | null; kind: 'country' | 'city'; visitedAt: number }[]
  >([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadUserVisitedPlaces(params.userId).then((visited) => {
      if (!active) return;
      const mapped = visited.stamps
        .map((stamp) => {
          const destination = destinations.find((d) => d.id === stamp.destinationId);
          return destination ? { destination, visitedAt: stamp.visitedAt } : null;
        })
        .filter((entry): entry is { destination: (typeof destinations)[number]; visitedAt: number } => Boolean(entry));
      setVisitedDestinations(mapped);
      setManualPlaces(visited.manual);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId]);

  const visitedWithCoords = visitedDestinations
    .filter(
      (entry): entry is { destination: typeof entry.destination & { latitude: number; longitude: number }; visitedAt: number } =>
        typeof entry.destination.latitude === 'number' && typeof entry.destination.longitude === 'number'
    )
    .sort((a, b) => a.visitedAt - b.visitedAt);

  const countriesSet = useMemo(() => {
    const set = new Set<string>(visitedDestinations.map((v) => v.destination.country).filter(Boolean));
    for (const place of manualPlaces) {
      const country = place.kind === 'country' ? place.name : place.country;
      if (country) set.add(country);
    }
    return set;
  }, [visitedDestinations, manualPlaces]);
  const countriesVisited = countriesSet.size;

  const citiesVisited = visitedDestinations.length + manualPlaces.filter((p) => p.kind === 'city').length;
  const stampsCount = visitedDestinations.length + manualPlaces.length;
  const worldPercent = Math.round((countriesVisited / WORLD_COUNTRIES) * 100);
  const badgeContext = { stampsCount, countriesVisited, countriesSet, worldPercent };

  type CombinedStamp = {
    id: string;
    name: string;
    dateLabel: string;
    timestamp: number;
    image?: (typeof visitedDestinations)[number]['destination']['image'];
    flag?: string | null;
    color: string;
    onPress?: () => void;
  };

  const combinedStamps: CombinedStamp[] = [
    ...visitedDestinations.map((entry) => ({
      id: `d-${entry.destination.id}`,
      name: entry.destination.name,
      dateLabel: formatStampDate(entry.visitedAt),
      timestamp: entry.visitedAt,
      image: entry.destination.image,
      color: fixedColors.stamps[0],
      onPress: () => navigation.navigate('DestinationDetail', { destinationId: entry.destination.id }),
    })),
    ...manualPlaces.map((place) => ({
      id: `m-${place.id}`,
      name: place.name,
      dateLabel: formatStampDate(place.visitedAt),
      timestamp: place.visitedAt,
      flag: flagForRegion(place.kind === 'country' ? place.name : place.country ?? place.name),
      color: fixedColors.stamps[1],
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((stamp, index) => ({ ...stamp, color: fixedColors.stamps[index % fixedColors.stamps.length] }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} accessibilityLabel="رجوع">
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>جواز {params.name}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.navyCard}>
            <CircularProgress size={84} strokeWidth={7} progress={worldPercent / 100} color={colors.accent} trackColor="rgba(255,255,255,0.18)">
              <Text style={styles.ringPercent}>{worldPercent}%</Text>
              <Text style={styles.ringCaption}>من العالم</Text>
            </CircularProgress>

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{countriesVisited}</Text>
                <Text style={styles.statLabel}>دولة</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{citiesVisited}</Text>
                <Text style={styles.statLabel}>مدينة</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>الشارات</Text>
          </View>
          <RtlScrollRow contentContainerStyle={styles.badgesRow}>
            {PASSPORT_BADGES.map((badge) => {
              const unlocked = badge.isUnlocked(badgeContext);
              return (
                <View key={badge.id} style={styles.badgeCell}>
                  <View style={[styles.badgeCircle, unlocked ? styles.badgeCircleUnlocked : styles.badgeCircleLocked]}>
                    <Ionicons
                      name={badge.icon}
                      size={24}
                      color={unlocked ? colors.accentDark : colors.textFaint}
                    />
                    {!unlocked ? (
                      <View style={styles.badgeLockDot}>
                        <Ionicons name="lock-closed" size={10} color={colors.textFaint} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]} numberOfLines={1}>
                    {badge.label}
                  </Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>{badge.description}</Text>
                </View>
              );
            })}
          </RtlScrollRow>

          {visitedWithCoords.length > 0 ? (
            <View style={styles.mapWrap}>
              <DestinationsMapView
                destinations={visitedWithCoords.map((entry) => entry.destination)}
                onMarkerPress={(destination) => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
              />
            </View>
          ) : null}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>كل الأختام ({combinedStamps.length})</Text>
          </View>

          {combinedStamps.length === 0 ? (
            <Text style={styles.emptyMuted}>ما سجّل أي ختم بعد</Text>
          ) : (
            <View style={styles.grid}>
              {combinedStamps.map((stamp) => (
                <TouchableOpacity
                  key={stamp.id}
                  style={styles.gridCell}
                  activeOpacity={0.85}
                  disabled={!stamp.onPress}
                  onPress={stamp.onPress}
                >
                  <View style={[styles.stampRing, { borderColor: stamp.color }]}>
                    {stamp.image ? (
                      <Image source={stamp.image} style={styles.stampImage} />
                    ) : stamp.flag ? (
                      <View style={[styles.inkStamp, { borderColor: stamp.color }]}>
                        <Text style={styles.inkStampFlag}>{stamp.flag}</Text>
                      </View>
                    ) : (
                      <Ionicons name="location" size={22} color={stamp.color} />
                    )}
                  </View>
                  <Text style={styles.stampName} numberOfLines={1}>{stamp.name}</Text>
                  <Text style={styles.stampDate}>{stamp.dateLabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryDark,
  },
  headerTitle: { color: colors.textOnPrimary, fontSize: fontSize.subtitle, fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  navyCard: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  ringPercent: { color: colors.textOnPrimary, fontSize: fontSize.title, fontWeight: '700' },
  ringCaption: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.tiny },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.xxl, marginTop: spacing.md },
  statCell: { alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statValue: { color: colors.textOnPrimary, fontSize: fontSize.title, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.small },
  badgesRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.md },
  badgeCell: { width: 84, alignItems: 'center' },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeCircleUnlocked: { backgroundColor: colors.primarySoft, borderColor: colors.accentDark },
  badgeCircleLocked: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  badgeLockDot: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: { color: colors.text, fontSize: fontSize.small, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  badgeLabelLocked: { color: colors.textFaint },
  badgeDescription: { color: colors.textFaint, fontSize: fontSize.tiny, textAlign: 'center', marginTop: 2 },
  mapWrap: { height: 180, margin: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  emptyMuted: { color: colors.textFaint, fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.lg },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg },
  gridCell: { width: '29%', alignItems: 'center' },
  stampRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  stampImage: { width: '100%', height: '100%' },
  inkStamp: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  inkStampFlag: { fontSize: fontSize.heading, transform: [{ rotate: '8deg' }] },
  stampName: { color: colors.text, fontSize: fontSize.small, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  stampDate: { color: colors.textFaint, fontSize: fontSize.tiny, fontWeight: '600', textAlign: 'center' },
});

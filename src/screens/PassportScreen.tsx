import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Text from '../components/Text';
import { Alert } from '../lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CircularProgress from '../components/CircularProgress';
import DestinationsMapView from '../components/DestinationsMapView';
import { fontSize, radius, spacing, fixedColors, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { computeXp, computeTravelerLevel, nextLevelThreshold } from '../utils/travelerStats';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WORLD_COUNTRIES = 195;
const STAMP_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatStampDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${STAMP_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default function PassportScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { visitedStamps, manualVisitedPlaces, removeManualVisitedPlace, trips, myPosts, recommendedPlaceIds } = useAppState();
  const { destinations, places } = useContent();
  const { requireAccount } = useRequireAccount();

  const visitedDestinations = visitedStamps
    .map((stamp) => {
      const destination = destinations.find((d) => d.id === stamp.destinationId);
      return destination ? { destination, visitedAt: stamp.visitedAt } : null;
    })
    .filter((entry): entry is { destination: (typeof destinations)[number]; visitedAt: number } => Boolean(entry));

  const visitedWithCoords = visitedDestinations
    .filter(
      (entry): entry is { destination: typeof entry.destination & { latitude: number; longitude: number }; visitedAt: number } =>
        typeof entry.destination.latitude === 'number' && typeof entry.destination.longitude === 'number'
    )
    .sort((a, b) => a.visitedAt - b.visitedAt);

  const countriesVisited = useMemo(() => {
    const set = new Set(visitedDestinations.map((v) => v.destination.country).filter(Boolean));
    return set.size;
  }, [visitedDestinations]);

  const reviewsCount = useMemo(
    () => places.filter((p) => recommendedPlaceIds.includes(p.id)).length,
    [places, recommendedPlaceIds]
  );
  const xp = computeXp({
    tripsCount: trips.length,
    countriesCount: countriesVisited,
    postsCount: myPosts.length,
    reviewsCount,
  });
  const travelerLevel = computeTravelerLevel(xp);
  const nextLevel = nextLevelThreshold(xp);
  const levelProgress = nextLevel ? Math.min(1, xp / (xp + nextLevel.remaining)) : 1;
  const worldPercent = Math.round((countriesVisited / WORLD_COUNTRIES) * 100);

  type CombinedStamp = {
    id: string;
    name: string;
    dateLabel: string;
    timestamp: number;
    image?: (typeof visitedDestinations)[number]['destination']['image'];
    color: string;
    onPress?: () => void;
    onLongPress?: () => void;
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
    ...manualVisitedPlaces.map((place) => ({
      id: `m-${place.id}`,
      name: place.name,
      dateLabel: formatStampDate(place.visitedAt),
      timestamp: place.visitedAt,
      color: fixedColors.stamps[1],
      onLongPress: () =>
        Alert.alert('حذف الختم؟', `بيُحذف "${place.name}" من أختامك.`, [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: () => removeManualVisitedPlace(place.id) },
        ]),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((stamp, index) => ({ ...stamp, color: fixedColors.stamps[index % fixedColors.stamps.length] }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>جوازي</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.navyCard}>
          <CircularProgress size={84} strokeWidth={7} progress={worldPercent / 100} color={colors.accent} trackColor="rgba(255,255,255,0.18)">
            <Text style={styles.ringPercent}>{worldPercent}%</Text>
            <Text style={styles.ringCaption}>من العالم</Text>
          </CircularProgress>
          <Text style={styles.levelText}>{travelerLevel.label}</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
          </View>
          <Text style={styles.caption}>
            {nextLevel
              ? `باقي ${nextLevel.remaining} نقطة عشان تصير "${nextLevel.label}"`
              : 'وصلت لأعلى مستوى 🏆'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{countriesVisited}</Text>
              <Text style={styles.statLabel}>دولة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{visitedDestinations.length}</Text>
              <Text style={styles.statLabel}>مدينة</Text>
            </View>
          </View>
        </View>

        {visitedWithCoords.length > 0 ? (
          <View style={styles.mapWrap}>
            <DestinationsMapView
              destinations={visitedWithCoords.map((entry) => entry.destination)}
              onMarkerPress={(destination) => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
            />
          </View>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('visitedPlace', () => navigation.navigate('AddVisitedPlace'))}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={styles.linkButtonText}>أضف ختم</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>كل الأختام ({combinedStamps.length})</Text>
        </View>

        {combinedStamps.length === 0 ? (
          <Text style={styles.emptyMuted}>ما سجلت أي ختم بعد</Text>
        ) : (
          <View style={styles.grid}>
            {combinedStamps.map((stamp) => (
              <TouchableOpacity
                key={stamp.id}
                style={styles.gridCell}
                activeOpacity={0.85}
                onPress={stamp.onPress}
                onLongPress={stamp.onLongPress}
              >
                <View style={[styles.stampRing, { borderColor: stamp.color }]}>
                  {stamp.image ? (
                    <Image source={stamp.image} style={styles.stampImage} />
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
    backgroundColor: colors.primaryDark,
  },
  headerTitle: { color: '#fff', fontSize: fontSize.subtitle, fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  navyCard: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  ringPercent: { color: '#fff', fontSize: fontSize.title, fontWeight: '700' },
  ringCaption: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.tiny },
  levelText: { color: colors.accent, fontSize: fontSize.subtitle, fontWeight: '700', marginTop: spacing.xs },
  xpTrack: { width: '70%', height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  caption: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.small, fontWeight: '600' },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.xxl, marginTop: spacing.md },
  statCell: { alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statValue: { color: '#fff', fontSize: fontSize.title, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.small },
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
  linkButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  linkButtonText: { color: colors.primary, fontSize: fontSize.base, fontWeight: '700' },
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
  stampName: { color: colors.text, fontSize: fontSize.small, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  stampDate: { color: colors.textFaint, fontSize: fontSize.tiny, fontWeight: '600', textAlign: 'center' },
});

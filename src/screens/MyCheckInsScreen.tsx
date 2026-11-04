import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import EmptyState from '../components/EmptyState';
import RtlScrollRow from '../components/RtlScrollRow';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import { computeCheckInBadges } from '../utils/checkInBadges';
import { lightMapStyle } from '../theme/mapStyle';
import { MapView, Marker } from '../components/mapModule';
import type { CheckInRecord } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'map';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });
}

function dateHeading(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'اليوم';
  if (d.toDateString() === yesterday.toDateString()) return 'أمس';
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
}

function groupByDay(checkIns: CheckInRecord[]) {
  const groups: { title: string; data: CheckInRecord[] }[] = [];
  for (const item of checkIns) {
    const title = dateHeading(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.data.push(item);
    else groups.push({ title, data: [item] });
  }
  return groups;
}

export default function MyCheckInsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { myCheckIns, myCheckInsLoading } = useAppState();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const badges = useMemo(() => computeCheckInBadges(myCheckIns), [myCheckIns]);
  const sections = useMemo(() => groupByDay(myCheckIns), [myCheckIns]);
  const pins = useMemo(
    () => myCheckIns.filter((c) => c.lat != null && c.lng != null),
    [myCheckIns]
  );

  const mapRegion = useMemo(() => {
    if (pins.length === 0) return null;
    const lats = pins.map((p) => p.lat as number);
    const lngs = pins.map((p) => p.lng as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.05) * 1.6,
      longitudeDelta: Math.max(maxLng - minLng, 0.05) * 1.6,
    };
  }, [pins]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيلات وصولي</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CheckInSearch')} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {myCheckInsLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : myCheckIns.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="لا توجد عمليات تسجيل وصول"
          subtitle="سجّل وصولك لأول مكان عشان يبدأ سجلك يتكوّن هنا"
          actionLabel="دوّر على مكان"
          onAction={() => navigation.navigate('CheckInSearch')}
        />
      ) : (
        <>
          <RtlScrollRow contentContainerStyle={styles.badgesRow}>
            {badges.map((b) => (
              <View key={b.id} style={[styles.badgeChip, !b.earned && styles.badgeChipLocked]}>
                <View style={[styles.badgeIconWrap, !b.earned && styles.badgeIconWrapLocked]}>
                  <Ionicons name={b.icon} size={20} color={b.earned ? colors.textOnPrimary : colors.textFaint} />
                </View>
                <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelLocked]}>{b.label}</Text>
                <Text style={styles.badgeProgress}>
                  {b.earned ? 'تم' : `${b.progress.current}/${b.progress.target}`}
                </Text>
              </View>
            ))}
          </RtlScrollRow>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>قائمة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setViewMode('map')}
            >
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>خريطة</Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'map' ? (
            pins.length === 0 ? (
              <Text style={styles.emptyMapText}>ما فيه مواقع محفوظة لتسجيلات الوصول عشان تظهر بالخريطة</Text>
            ) : Platform.OS === 'web' || !MapView || !Marker ? (
              <View style={[styles.map, styles.webFallback]}>
                <Text style={styles.webFallbackText}>معاينة الخريطة متاحة على الجوال فقط</Text>
              </View>
            ) : (
              (() => {
                const MapComponent = MapView;
                const MarkerComponent = Marker;
                return (
                  <MapComponent style={styles.map} initialRegion={mapRegion ?? undefined} customMapStyle={lightMapStyle}>
                    {pins.map((p) => (
                      <MarkerComponent
                        key={p.id}
                        coordinate={{ latitude: p.lat as number, longitude: p.lng as number }}
                        title={p.venueName}
                        tracksViewChanges={false}
                      >
                        <View style={styles.mapPin}>
                          <Ionicons name={VENUE_CATEGORY_ICON[p.category]} size={14} color={colors.textOnPrimary} />
                        </View>
                      </MarkerComponent>
                    ))}
                  </MapComponent>
                );
              })()
            )
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={VENUE_CATEGORY_ICON[item.category]} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <View style={styles.rowNameWrap}>
                      <Text style={styles.rowName}>{item.venueName}</Text>
                      {item.isPrivate ? (
                        <Ionicons name="lock-closed" size={11} color={colors.textFaint} />
                      ) : null}
                    </View>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {VENUE_CATEGORY_LABEL[item.category]}
                      {item.venueAddress ? ` · ${item.venueAddress}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.rowDate}>{formatTime(item.createdAt)}</Text>
                </View>
              )}
            />
          )}
        </>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { flexDirection: 'row-reverse', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  badgeChip: {
    width: 84,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  badgeChipLocked: { opacity: 0.6 },
  badgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconWrapLocked: { backgroundColor: colors.surfaceAlt },
  badgeLabel: { color: colors.text, fontSize: 10.5, fontWeight: '700', textAlign: 'center' },
  badgeLabelLocked: { color: colors.textFaint },
  badgeProgress: { color: colors.textFaint, fontSize: 9.5 },
  viewToggle: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  toggleTextActive: { color: colors.textOnPrimary },
  map: { height: 320, marginHorizontal: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  webFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  webFallbackText: { color: colors.textMuted, fontSize: 12.5 },
  emptyMapText: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', padding: spacing.xl },
  mapPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: { flex: 1 },
  rowNameWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  rowMeta: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  rowDate: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
});

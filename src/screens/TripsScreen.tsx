import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '../components/EmptyState';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { Trip } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatTripDateRange } from '../lib/tripDates';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TripTab = 'upcoming' | 'past';

const FACE_COLORS = ['#e07b24', '#2a9bb0', '#b2449a', '#2a55d8', '#1f9d63'];

function isTripPast(endDate: string) {
  if (!endDate || endDate === '—') return false;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

function daysUntil(startDate: string) {
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / 86400000);
}

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, tripsLoading } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');

  const upcomingTrips = useMemo(() => trips.filter((t) => !isTripPast(t.endDate)), [trips]);
  const pastTrips = useMemo(() => trips.filter((t) => isTripPast(t.endDate)), [trips]);
  const visibleTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  const renderCard = (item: Trip) => {
    const spent = item.budgetItems.reduce((sum, b) => sum + b.amount, 0);
    const budgetRatio = item.budgetTotal > 0 ? Math.min(1, spent / item.budgetTotal) : 0;
    const budgetWarn = item.budgetTotal > 0 && spent > item.budgetTotal;
    const hasDate = !!item.startDate && item.startDate !== '—';
    const days = hasDate ? daysUntil(item.startDate) : null;
    const extraMembers = Math.max(0, item.memberIds.length - 1);
    const checklistTotal = item.checklist.length;
    const checklistDone = item.checklist.filter((c) => c.done).length;
    const checklistRatio = checklistTotal > 0 ? checklistDone / checklistTotal : 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
      >
        <View style={styles.cardImageWrap}>
          <Image source={item.coverImage} style={styles.cardImage} />
          <View style={styles.cardOverlay} />
          <View style={[styles.badge2, !hasDate && styles.badge2Muted]}>
            <Text style={[styles.badge2Text, !hasDate && styles.badge2TextMuted]}>
              {!hasDate
                ? 'بدون تاريخ'
                : days !== null
                ? days > 0
                  ? `بعد ${days} ${days === 1 ? 'يوم' : 'أيام'}`
                  : days === 0
                  ? 'تبدأ اليوم'
                  : 'انتهت'
                : ''}
            </Text>
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>
              {hasDate ? formatTripDateRange(item.startDate, item.endDate) : extraMembers > 0 ? `أنت و${extraMembers} معك` : 'شخص واحد'}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.facesRow}>
            <View style={styles.memberCount}>
              <Text style={styles.memberCountText}>{item.memberIds.length}</Text>
            </View>
            <View style={styles.faces}>
              {item.memberIds.slice(0, 3).map((id, i) => (
                <View key={id} style={[styles.face, { backgroundColor: FACE_COLORS[i % FACE_COLORS.length] }]} />
              ))}
            </View>
            <Text style={styles.facesText}>
              {extraMembers > 0 ? `أنت و${extraMembers} معك` : 'لحالك'}
            </Text>
          </View>
          {!hasDate ? (
            <TouchableOpacity
              style={styles.datePrompt}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
            >
              <Text style={styles.datePromptText}>حدد التواريخ عشان نقترح لك أماكن وجدول</Text>
              <Ionicons name="chevron-back" size={14} color={colors.accentDark} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.statsRow}>
            {checklistTotal > 0 ? (
              <View style={styles.progRow}>
                <View style={styles.progTop}>
                  <Text style={styles.progLabel}>التجهيز</Text>
                  <Text style={styles.progValue}>{checklistTotal} / {checklistDone}</Text>
                </View>
                <View style={styles.progTrack}>
                  <View style={[styles.progFill, { width: `${Math.round(checklistRatio * 100)}%` }]} />
                </View>
              </View>
            ) : null}
            {item.budgetTotal > 0 ? (
              <View style={styles.progRow}>
                <View style={styles.progTop}>
                  <Text style={styles.progLabel}>الميزانية</Text>
                  <Text style={[styles.progValue, budgetWarn && styles.progValueWarn]}>
                    {item.budgetTotal.toLocaleString()} / {spent.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.progTrack}>
                  <View style={[styles.progFill, styles.progFillGold, budgetWarn && styles.progFillWarn, { width: `${Math.round(budgetRatio * 100)}%` }]} />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
          >
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
            <Text style={styles.newButtonText}>رحلة جديدة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => requireAccount('trip', () => navigation.navigate('JoinTrip'))}
          >
            <Ionicons name="key-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>رحلاتي</Text>
      </View>

      {tripsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : trips.length === 0 ? (
        <EmptyState
          icon="airplane-outline"
          title="لا توجد رحلات مخططة بعد"
          subtitle="ابدأ بتخطيط رحلتك القادمة مع أصدقائك وستظهر هنا مع الميزانية والجدول."
        />
      ) : (
        <>
          <View style={styles.seg}>
            <TouchableOpacity
              style={[styles.segItem, activeTab === 'upcoming' && styles.segItemActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('upcoming')}
            >
              {upcomingTrips.length > 0 ? (
                <View style={[styles.segN, activeTab === 'upcoming' && styles.segNActive]}>
                  <Text style={[styles.segNText, activeTab === 'upcoming' && styles.segNTextActive]}>{upcomingTrips.length}</Text>
                </View>
              ) : null}
              <Text style={[styles.segText, activeTab === 'upcoming' && styles.segTextActive]}>القادمة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segItem, activeTab === 'past' && styles.segItemActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('past')}
            >
              {pastTrips.length > 0 ? (
                <View style={[styles.segN, activeTab === 'past' && styles.segNActive]}>
                  <Text style={[styles.segNText, activeTab === 'past' && styles.segNTextActive]}>{pastTrips.length}</Text>
                </View>
              ) : null}
              <Text style={[styles.segText, activeTab === 'past' && styles.segTextActive]}>السابقة</Text>
            </TouchableOpacity>
          </View>

          {visibleTrips.length === 0 ? (
            <EmptyState
              icon={activeTab === 'upcoming' ? 'airplane-outline' : 'time-outline'}
              title={activeTab === 'upcoming' ? 'لا توجد رحلات قادمة' : 'لا توجد رحلات سابقة'}
              subtitle={
                activeTab === 'upcoming'
                  ? 'خطط رحلتك القادمة وستظهر هنا.'
                  : 'رحلاتك المنتهية بتظهر هنا بعد ما ينتهي تاريخها.'
              }
            />
          ) : (
            <FlatList
              data={visibleTrips}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => renderCard(item)}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.templatesBanner}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('TripTemplates')}
                >
                  <View style={styles.templatesBannerIcon}>
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templatesBannerTitle}>قوالب رحلات جاهزة</Text>
                    <Text style={styles.templatesBannerSubtitle}>خطط مجرّبة من مسافرين ثانين، انسخها وعدّل</Text>
                  </View>
                  <Ionicons name="chevron-back" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.heading, fontWeight: '700' },
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  newButtonText: { color: colors.textOnPrimary, fontSize: fontSize.base, fontWeight: '700' },
  seg: {
    flexDirection: 'row-reverse',
    gap: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segItemActive: { backgroundColor: colors.surface },
  segText: { color: colors.textMuted, fontSize: fontSize.body, fontWeight: '600' },
  segTextActive: { color: colors.text, fontWeight: '700' },
  segN: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  segNActive: { backgroundColor: colors.primarySoft },
  segNText: { color: colors.textMuted, fontSize: fontSize.tiny, fontWeight: '700' },
  segNTextActive: { color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardImageWrap: { height: 140, justifyContent: 'flex-end' },
  cardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  badge2: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badge2Text: { color: '#141a2b', fontSize: fontSize.small, fontWeight: '700' },
  badge2Muted: { backgroundColor: colors.accentSoft },
  badge2TextMuted: { color: colors.accentDark },
  cardTextWrap: { padding: spacing.md },
  cardTitle: { color: '#fff', fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.base, textAlign: 'right', marginTop: 2 },
  cardBody: { padding: spacing.md, gap: spacing.sm },
  facesRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  memberCount: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCountText: { color: colors.textOnPrimary, fontSize: fontSize.small, fontWeight: '700' },
  faces: { flexDirection: 'row' },
  face: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.surface, marginLeft: -7 },
  facesText: { color: colors.textMuted, fontSize: fontSize.base },
  datePrompt: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  datePromptText: { color: colors.accentDark, fontSize: fontSize.base, fontWeight: '700', flex: 1, textAlign: 'right' },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.md },
  progRow: { flex: 1, gap: 4 },
  progTop: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  progLabel: { color: colors.textMuted, fontSize: fontSize.small },
  progValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  progValueWarn: { color: colors.red },
  progTrack: { height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  progFillGold: { backgroundColor: colors.accent },
  progFillWarn: { backgroundColor: colors.red },
  templatesBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  templatesBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templatesBannerTitle: { color: colors.text, fontSize: fontSize.body, fontWeight: '700', textAlign: 'right' },
  templatesBannerSubtitle: { color: colors.textMuted, fontSize: fontSize.small, textAlign: 'right', marginTop: 2 },
});

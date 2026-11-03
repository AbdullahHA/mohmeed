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
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { Trip } from '../types';
import type { RootStackParamList } from '../navigation/types';

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
    const budgetWarn = budgetRatio >= 0.75;
    const days = daysUntil(item.startDate);
    const extraMembers = Math.max(0, item.memberIds.length - 1);

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
          {days !== null ? (
            <View style={styles.badge2}>
              <Text style={styles.badge2Text}>
                {days > 0 ? `بعد ${days} ${days === 1 ? 'يوم' : 'أيام'}` : days === 0 ? 'تبدأ اليوم' : 'انتهت'}
              </Text>
            </View>
          ) : null}
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.startDate} – {item.endDate}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.facesRow}>
            <View style={styles.faces}>
              {item.memberIds.slice(0, 3).map((id, i) => (
                <View key={id} style={[styles.face, { backgroundColor: FACE_COLORS[i % FACE_COLORS.length] }]} />
              ))}
            </View>
            <Text style={styles.facesText}>
              {extraMembers > 0 ? `أنت و${extraMembers} معك` : 'لحالك'}
            </Text>
          </View>
          {item.budgetTotal > 0 ? (
            <View style={styles.progRow}>
              <View style={styles.progTop}>
                <Text style={[styles.progValue, budgetWarn && styles.progValueWarn]}>
                  {spent.toLocaleString()} / {item.budgetTotal.toLocaleString()}
                </Text>
                <Text style={styles.progLabel}>الميزانية</Text>
              </View>
              <View style={styles.progTrack}>
                <View style={[styles.progFill, budgetWarn && styles.progFillWarn, { width: `${Math.round(budgetRatio * 100)}%` }]} />
              </View>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>رحلاتي</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => requireAccount('trip', () => navigation.navigate('JoinTrip'))}
          >
            <Ionicons name="key-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
          >
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
            <Text style={styles.newButtonText}>رحلة جديدة</Text>
          </TouchableOpacity>
        </View>
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
              <Text style={[styles.segText, activeTab === 'upcoming' && styles.segTextActive]}>القادمة</Text>
              <View style={[styles.segN, activeTab === 'upcoming' && styles.segNActive]}>
                <Text style={[styles.segNText, activeTab === 'upcoming' && styles.segNTextActive]}>{upcomingTrips.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segItem, activeTab === 'past' && styles.segItemActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.segText, activeTab === 'past' && styles.segTextActive]}>السابقة</Text>
              <View style={[styles.segN, activeTab === 'past' && styles.segNActive]}>
                <Text style={[styles.segNText, activeTab === 'past' && styles.segNTextActive]}>{pastTrips.length}</Text>
              </View>
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
                  <Ionicons name="chevron-back" size={14} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templatesBannerTitle}>قوالب رحلات جاهزة</Text>
                    <Text style={styles.templatesBannerSubtitle}>خطط مجرّبة من مسافرين ثانين، انسخها وعدّل</Text>
                  </View>
                  <View style={styles.templatesBannerIcon}>
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                  </View>
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
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
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
  newButtonText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  seg: { flexDirection: 'row-reverse', gap: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
  segItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingBottom: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segItemActive: { borderBottomColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  segTextActive: { color: colors.text, fontWeight: '700' },
  segN: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  segNActive: { backgroundColor: colors.primarySoft },
  segNText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
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
  badge2Text: { color: '#141a2b', fontSize: 10.5, fontWeight: '700' },
  cardTextWrap: { padding: spacing.md },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, textAlign: 'right', marginTop: 2 },
  cardBody: { padding: spacing.md, gap: spacing.sm },
  facesRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  faces: { flexDirection: 'row' },
  face: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.surface, marginLeft: -7 },
  facesText: { color: colors.textMuted, fontSize: 11.5 },
  progRow: { gap: 4 },
  progTop: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  progLabel: { color: colors.textMuted, fontSize: 11 },
  progValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  progValueWarn: { color: colors.accentDark },
  progTrack: { height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  progFillWarn: { backgroundColor: colors.accent },
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
  templatesBannerTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  templatesBannerSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
});

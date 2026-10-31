import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TripTab = 'upcoming' | 'past';

function isTripPast(endDate: string) {
  if (!endDate || endDate === '—') return false;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');

  const upcomingTrips = useMemo(() => trips.filter((t) => !isTripPast(t.endDate)), [trips]);
  const pastTrips = useMemo(() => trips.filter((t) => isTripPast(t.endDate)), [trips]);
  const visibleTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>رحلاتي</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.joinButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('JoinTrip'))}
          >
            <Ionicons name="key-outline" size={16} color={colors.primary} />
            <Text style={styles.joinButtonText}>لدي رمز دعوة</Text>
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

      <TouchableOpacity
        style={styles.templatesBanner}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TripTemplates')}
      >
        <Ionicons name="chevron-back" size={14} color={colors.primary} />
        <Text style={styles.templatesBannerText}>تصفح قوالب رحلات جاهزة من مسافرين ثانين</Text>
        <Ionicons name="document-text-outline" size={16} color={colors.primary} />
      </TouchableOpacity>

      {trips.length === 0 ? (
        <EmptyState
          icon="airplane-outline"
          title="لا توجد رحلات مخططة بعد"
          subtitle="ابدأ بتخطيط رحلتك القادمة مع أصدقائك وستظهر هنا مع الميزانية والجدول."
        />
      ) : (
        <>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'past' && styles.tabButtonTextActive]}>
                السابقة
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'upcoming' && styles.tabButtonTextActive]}>
                القادمة
              </Text>
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
          renderItem={({ item }) => {
            const spent = item.budgetItems.reduce((sum, b) => sum + b.amount, 0);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
              >
                <ImageBackground
                  source={item.coverImage}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageRadius}
                >
                  <View style={styles.cardOverlay} />
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {item.startDate} → {item.endDate}
                    </Text>
                  </View>
                </ImageBackground>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {item.memberIds.length} أشخاص · {spent.toLocaleString()} / {item.budgetTotal.toLocaleString()} ر.س
                  </Text>
                  <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  templatesBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  templatesBannerText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  tabsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  joinButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
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
  newButtonText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardImage: {
    height: 140,
    justifyContent: 'flex-end',
  },
  cardImageRadius: {},
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  cardTextWrap: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardFooterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});

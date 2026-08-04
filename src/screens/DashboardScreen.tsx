import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { trips as tripsStore, removeTrip, type Trip } from '../data/trips';
import { checkIns } from '../data/activityLog';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<Trip[]>(tripsStore);
  const [checkInList, setCheckInList] = useState(checkIns);

  const refresh = useCallback(() => {
    setTrips([...tripsStore]);
    setCheckInList([...checkIns]);
  }, []);

  useFocusEffect(refresh);

  const totalBudget = useMemo(() => trips.reduce((sum, t) => sum + t.budgetTotal, 0), [trips]);
  const uniqueFriends = useMemo(
    () => new Set(trips.flatMap((t) => t.friends.map((f) => f.id + t.id))).size,
    [trips],
  );
  const maxBudget = useMemo(() => Math.max(1, ...trips.map((t) => t.budgetTotal)), [trips]);

  const confirmDelete = (trip: Trip) => {
    Alert.alert('حذف الرحلة', `هل تريد حذف "${trip.title}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          removeTrip(trip.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <StatCard icon="airplane-outline" label="الرحلات" value={String(trips.length)} />
          <StatCard icon="people-outline" label="المسافرون" value={String(uniqueFriends)} />
          <StatCard
            icon="wallet-outline"
            label="إجمالي الميزانية"
            value={`${totalBudget.toLocaleString('ar-SA')} ر.س`}
          />
          <StatCard icon="navigate-outline" label="تسجيلات الوصول" value={String(checkInList.length)} />
        </View>

        <Text style={styles.sectionTitle}>الميزانية حسب الرحلة</Text>
        <View style={styles.card}>
          {trips.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد رحلات بعد</Text>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barAmount}>
                    {trip.budgetTotal.toLocaleString('ar-SA')} {trip.currency}
                  </Text>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {trip.title}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(4, (trip.budgetTotal / maxBudget) * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>أحدث تسجيلات الوصول</Text>
        <View style={styles.card}>
          {checkInList.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد تسجيلات وصول بعد</Text>
          ) : (
            checkInList.slice(0, 6).map((record) => (
              <View key={record.id} style={styles.activityRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.activityText}>
                  {record.placeName} · {record.cityName}
                </Text>
                <Text style={styles.activityTime}>{record.at}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>إدارة الرحلات</Text>
        <View style={styles.card}>
          {trips.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد رحلات لإدارتها</Text>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.manageRow}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                  onPress={() => confirmDelete(trip)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.red} />
                </TouchableOpacity>
                <View style={styles.manageTextWrap}>
                  <Text style={styles.manageTitle} numberOfLines={1}>
                    {trip.title}
                  </Text>
                  <Text style={styles.manageMeta} numberOfLines={1}>
                    {trip.destination}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    textAlign: 'right',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'right',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  barRow: {
    marginBottom: spacing.md,
  },
  barLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  barLabel: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    flexShrink: 1,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  barAmount: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  activityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  activityTime: {
    color: colors.textFaint,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  manageRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  manageTextWrap: {
    flex: 1,
  },
  manageTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
  },
  manageMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'right',
    marginTop: 2,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

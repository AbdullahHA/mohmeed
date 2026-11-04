import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, loyaltyMemberships, removeLoyaltyMembership } = useAppState();
  const { profile } = useAuth();
  const { currency } = useRegion();
  const { requireAccount } = useRequireAccount();

  // Real per-trip settlement balance — same math TripDetailScreen's budget
  // tab already uses and shows live, just summed across every trip instead
  // of one. No payment/transfer action yet (no real payment rail exists),
  // so this is read-only: a correct balance, not a "pay now" feature.
  const tripBalances = useMemo(() => {
    if (!profile) return [];
    return trips
      .map((trip) => {
        let owedToMe = 0;
        let iOwe = 0;
        for (const item of trip.budgetItems) {
          if (item.splitBetween.length === 0 || !item.paidBy) continue;
          const share = item.amount / item.splitBetween.length;
          if (item.paidBy === profile.id) {
            owedToMe += share * item.splitBetween.filter((id) => id !== profile.id).length;
          } else if (item.splitBetween.includes(profile.id)) {
            iOwe += share;
          }
        }
        return { trip, net: Math.round(owedToMe - iOwe) };
      })
      .filter((b) => b.net !== 0);
  }, [trips, profile?.id]);

  const totalNet = tripBalances.reduce((sum, b) => sum + b.net, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>محفظتي</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => requireAccount('loyalty', () => navigation.navigate('AddLoyaltyMembership'))}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>تسوية مصاريف الرحلات</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>التسديد قريبًا</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{totalNet === 0 ? 'كل شي متوازن' : totalNet > 0 ? 'لك عند الشلة' : 'عليك للشلة'}</Text>
          <Text style={[styles.balanceValue, totalNet < 0 && styles.balanceValueNegative]}>
            {Math.abs(totalNet).toLocaleString()} {currency.symbol}
          </Text>
        </View>

        {tripBalances.length > 0 ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {tripBalances.map(({ trip, net }) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
              >
                <View style={styles.textWrap}>
                  <Text style={styles.airline}>{trip.title}</Text>
                  <Text style={styles.number}>{trip.destination}</Text>
                </View>
                <Text style={[styles.tripNet, net < 0 && styles.tripNetNegative]}>
                  {net > 0 ? 'لك' : 'عليك'} {Math.abs(net).toLocaleString()} {currency.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyNote}>ما عليك ولا لك أي مبلغ من مصاريف الرحلات حاليًا</Text>
        )}

        <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>برامج الولاء</Text>
        </View>
        <Text style={styles.privacyNote}>برامج الولاء خاصة بك — محد يشوفها غيرك</Text>

        {loyaltyMemberships.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="ما ضفت أي برنامج ولاء بعد"
            subtitle="أضف أرقام عضويتك بالخطوط عشان تكون جاهزة وقت الحجز"
            actionLabel="أضف برنامج"
            onAction={() => requireAccount('loyalty', () => navigation.navigate('AddLoyaltyMembership'))}
          />
        ) : (
          loyaltyMemberships.map((membership) => (
            <View key={membership.id} style={styles.row}>
              <Ionicons name="star-outline" size={16} color={colors.accent} />
              <View style={styles.textWrap}>
                <Text style={styles.airline}>{membership.airline}</Text>
                <Text style={styles.number}>{membership.memberNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => removeLoyaltyMembership(membership.id)} activeOpacity={0.7}>
                <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            </View>
          ))
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  privacyNote: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  soonBadgeText: { color: colors.textFaint, fontSize: 10.5, fontWeight: '600' },
  balanceCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.success, fontSize: 24, fontWeight: '700' },
  balanceValueNegative: { color: colors.red },
  tripNet: { color: colors.success, fontSize: 13, fontWeight: '700' },
  tripNetNegative: { color: colors.red },
  emptyNote: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  airline: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  number: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 1 },
});

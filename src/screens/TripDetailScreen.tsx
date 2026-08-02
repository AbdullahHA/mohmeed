import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AvatarStack from '../components/AvatarStack';
import BudgetBar from '../components/BudgetBar';
import { colors, radius, spacing } from '../theme/colors';
import { tripById } from '../data/trips';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TripDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const trip = tripById(route.params.tripId);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الرحلة</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{trip.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{trip.destination}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            {trip.startDate} – {trip.endDate}
          </Text>
        </View>

        <View style={styles.friendsRow}>
          <AvatarStack friends={trip.friends} />
          <TouchableOpacity style={styles.addFriendButton} activeOpacity={0.8}>
            <Ionicons name="person-add-outline" size={14} color={colors.primary} />
            <Text style={styles.addFriendText}>أضف صديق</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.companionButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Chat', { tripId: trip.id })}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={colors.onPrimary} />
          <Text style={styles.companionText}>تحدث مع رفيق السفر</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>جدول الرحلة</Text>
        <View style={styles.itineraryList}>
          {trip.itinerary.map((day) => (
            <View key={day.day} style={styles.itineraryRow}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{day.day}</Text>
              </View>
              <Text style={styles.itineraryText}>{day.title}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ميزانية الرحلة</Text>
        <View style={styles.budgetCard}>
          <Text style={styles.budgetTotal}>
            {trip.budgetTotal.toLocaleString('ar-SA')} {trip.currency} · موزعة
          </Text>
          {trip.budgetBreakdown.map((item) => (
            <BudgetBar key={item.label} item={item} currency={trip.currency} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 13,
  },
  friendsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  addFriendButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addFriendText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  companionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  companionText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  itineraryList: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  itineraryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  dayBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dayBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  itineraryText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  budgetTotal: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import type { Trip } from '../data/trips';

type Props = {
  trip: Trip;
  onPress?: () => void;
};

export default function TripCard({ trip, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{trip.startDate}</Text>
        </View>
        <Text style={styles.title}>{trip.title}</Text>
      </View>
      <View style={styles.destRow}>
        <Ionicons name="location-outline" size={14} color={colors.textMuted} />
        <Text style={styles.destText}>{trip.destination}</Text>
      </View>
      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{trip.friends.length} مسافرين</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {trip.budgetTotal.toLocaleString('ar-SA')} {trip.currency}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  dateBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  destRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  destText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});

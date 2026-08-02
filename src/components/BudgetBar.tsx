import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import type { BudgetItem } from '../data/trips';

type Props = {
  item: BudgetItem;
  currency: string;
};

export default function BudgetBar({ item, currency }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.amount}>
          {item.amount.toLocaleString('ar-SA')} {currency}
        </Text>
        <Text style={styles.label}>{item.label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${item.pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  amount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});

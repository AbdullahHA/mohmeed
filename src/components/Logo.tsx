import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';

type Props = {
  withWordmark?: boolean;
  size?: number;
};

export default function Logo({ withWordmark = true, size = 34 }: Props) {
  return (
    <View style={styles.row}>
      {withWordmark ? <Text style={styles.wordmark}>يلا نسافر</Text> : null}
      <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="airplane" size={size * 0.52} color={colors.onPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

export type Achievement = {
  id: string;
  icon: string;
  label: string;
  unlocked: boolean;
};

export default function AchievementsRow({ achievements }: { achievements: Achievement[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {achievements.map((item) => (
        <View key={item.id} style={[styles.card, !item.unlocked && styles.cardLocked]}>
          <Text style={[styles.icon, !item.unlocked && styles.iconLocked]}>{item.icon}</Text>
          <Text style={[styles.label, !item.unlocked && styles.labelLocked]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.xs },
  card: {
    width: 84,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cardLocked: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  icon: { fontSize: 26, marginBottom: spacing.xs },
  iconLocked: { opacity: 0.35 },
  label: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  labelLocked: { color: colors.textFaint },
});

import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';

export default function TopBar() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentUser } = useAppState();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/icon.png')} style={styles.brandIcon} resizeMode="contain" />
        <Text style={styles.brandText}>يلا نسافر</Text>
      </View>

      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeText}>أهلاً {currentUser.name}</Text>
        <View style={[styles.avatar, { backgroundColor: currentUser.color }]}>
          <Text style={styles.avatarEmoji}>{currentUser.emoji}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
  },
  brandText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  welcomeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
});

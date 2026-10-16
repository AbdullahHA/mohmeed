import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';

export default function TopBar() {
  const { currentUser } = useAppState();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Ionicons name="compass" size={18} color={colors.textOnPrimary} />
        </View>
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

const styles = StyleSheet.create({
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
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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

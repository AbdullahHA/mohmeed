import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

export default function TopBar() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
        <Text style={styles.loginText}>تسجيل الدخول</Text>
      </TouchableOpacity>

      <View style={styles.iconsRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.red }]}>
          <Ionicons name="flame" size={16} color={colors.text} />
        </View>
        <View style={[styles.iconCircle, styles.themeCircle]}>
          <Ionicons name="sunny" size={16} color={colors.gold} />
        </View>
      </View>

      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeText}>مرحباً بك</Text>
        <View style={styles.avatar}>
          <Ionicons name="leaf" size={16} color={colors.gold} />
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
  loginButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  loginText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
  iconsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCircle: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  welcomeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

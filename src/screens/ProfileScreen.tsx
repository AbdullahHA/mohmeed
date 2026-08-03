import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { trips } from '../data/trips';

const SETTINGS_ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-outline', label: 'تعديل الملف الشخصي' },
  { icon: 'people-outline', label: 'الأصدقاء' },
  { icon: 'notifications-outline', label: 'الإشعارات' },
  { icon: 'lock-closed-outline', label: 'الخصوصية' },
  { icon: 'information-circle-outline', label: 'عن يلا نسافر' },
];

export default function ProfileScreen() {
  const friendsCount = new Set(trips.flatMap((t) => t.friends.map((f) => f.id))).size;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>حسابي</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>ع</Text>
          </View>
          <Text style={styles.name}>عبدالله</Text>
          <Text style={styles.email}>abdullah@example.com</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>رحلاتي</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friendsCount}</Text>
              <Text style={styles.statLabel}>أصدقاء</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsList}>
          {SETTINGS_ROWS.map((row) => (
            <TouchableOpacity
              key={row.label}
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert(row.label, 'هذه الميزة قريباً إن شاء الله.')}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <View style={styles.settingsIconWrap}>
                <Ionicons name={row.icon} size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من حسابك؟', [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'تسجيل الخروج', style: 'destructive' },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    color: colors.onPrimary,
    fontSize: 28,
    fontFamily: fonts.bold,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  settingsList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  settingsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
  },
  signOutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.red,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});

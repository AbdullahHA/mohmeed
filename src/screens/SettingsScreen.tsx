import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APPEARANCE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'تلقائي' },
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>المظهر</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.appearanceChip, active && styles.appearanceChipActive]}
                activeOpacity={0.85}
                onPress={() => setMode(option.value)}
              >
                <Text style={[styles.appearanceChipText, active && styles.appearanceChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>معلومات</Text>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('About')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>من نحن</Text>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('Terms')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>الشروط والأحكام</Text>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>سياسة الخصوصية</Text>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  appearanceRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.xl },
  appearanceChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  appearanceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  appearanceChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  appearanceChipTextActive: { color: colors.textOnPrimary },
  linkRow: {
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
  linkRowText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
});

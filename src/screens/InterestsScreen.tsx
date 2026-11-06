import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { INTEREST_TAGS } from '../data/destinations';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InterestsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateInterests } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);

  const changed = JSON.stringify([...interests].sort()) !== JSON.stringify([...(profile?.interests ?? [])].sort());

  const toggleInterest = (tag: string) => {
    requireAccount('interests', () => {
      setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    });
  };

  const handleSave = async () => {
    if (!changed || saving) return;
    setSaving(true);
    await updateInterests(interests);
    setSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الاهتمامات</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Text style={styles.subtitle}>اختر اللي يهمّك، ونستخدمها نرشّح لك وجهات وأماكن تناسبك.</Text>
        <View style={styles.chipsWrap}>
          {INTEREST_TAGS.map((tag) => {
            const active = interests.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => toggleInterest(tag)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!changed || saving) && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!changed || saving}
          onPress={handleSave}
        >
          {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitText}>حفظ</Text>}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'right', lineHeight: 20, marginBottom: spacing.xl },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
});

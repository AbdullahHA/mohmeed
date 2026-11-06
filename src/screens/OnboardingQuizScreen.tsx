import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { INTEREST_TAGS } from '../data/destinations';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TOTAL_STEPS = 2;

export default function OnboardingQuizScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateInterests } = useAuth();
  const { destinations } = useContent();

  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [startDestinationId, setStartDestinationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSkip = () => navigation.goBack();

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    if (selectedInterests.length > 0) await updateInterests(selectedInterests);
    setSaving(false);
    if (startDestinationId) {
      navigation.replace('DestinationDetail', { destinationId: startDestinationId });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.8} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepCounter}>{step}/{TOTAL_STEPS}</Text>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressBar, i < step && styles.progressBarActive]} />
          ))}
        </View>
      </View>

      <View style={styles.body}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>أهلًا {profile?.name ?? ''} — وش يهمّك؟</Text>
            <Text style={styles.subtitle}>اختر ما تحب، ونبني توصياتك عليه.</Text>
            <View style={styles.chipsWrap}>
              {INTEREST_TAGS.map((tag) => {
                const active = selectedInterests.includes(tag);
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
          </>
        ) : (
          <>
            <Text style={styles.title}>من أي وجهة نبدأ؟</Text>
            <Text style={styles.subtitle}>خطوة أخيرة — تقدر تغيّرها لاحقًا.</Text>
            <View style={styles.chipsWrap}>
              {destinations.map((destination) => {
                const active = startDestinationId === destination.id;
                return (
                  <TouchableOpacity
                    key={destination.id}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.85}
                    onPress={() => setStartDestinationId(active ? null : destination.id)}
                  >
                    <Ionicons name="location" size={12} color={active ? colors.textOnPrimary : colors.red} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{destination.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, saving && styles.nextButtonDisabled]}
            activeOpacity={0.85}
            disabled={saving}
            onPress={handleNext}
          >
            {saving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step < TOTAL_STEPS ? 'التالي' : 'جهّز تجربتي ✨'}
              </Text>
            )}
          </TouchableOpacity>
          {step > 1 ? (
            <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => setStep(step - 1)}>
              <Text style={styles.backButtonText}>رجوع</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleSkip}>
          <Text style={styles.laterText}>لاحقًا</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  progressRow: { flex: 1, flexDirection: 'row-reverse', gap: spacing.xs },
  progressBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  progressBarActive: { backgroundColor: colors.accent },
  body: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'right', marginTop: spacing.xs, marginBottom: spacing.xl },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  footer: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.xxl },
  nextButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  backButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  backButtonText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  laterText: { color: colors.textFaint, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});

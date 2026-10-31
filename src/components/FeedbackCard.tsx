import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import type { Feedback } from '../types';

type Props = {
  feedback: Feedback | null;
  onSubmit: (feedback: Feedback) => void;
};

const getRatingColors = (colors: ThemeColors): Record<number, string> => ({
  1: colors.red,
  2: colors.accent,
  3: colors.warning,
  4: colors.success,
  5: colors.success,
});

const POSITIVE_REASONS = ['سرعة تجاوب التطبيق', 'الأداء العام', 'تجربة المستخدم', 'المحتوى', 'التنقل بين الصفحات', 'أخرى'];
const NEGATIVE_REASONS = ['واجهت أخطاء', 'ينقصه ميزات أحتاجها', 'مربك للاستخدام', 'تعطّل عندي', 'غير جذاب بصريًا', 'أخرى'];

export default function FeedbackCard({ feedback, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rating, setRating] = useState(feedback?.rating ?? 0);
  const [reasons, setReasons] = useState<string[]>(feedback?.reasons ?? []);
  const [note, setNote] = useState(feedback?.note ?? '');
  const [submitted, setSubmitted] = useState(Boolean(feedback));

  const color = getRatingColors(colors)[rating] ?? colors.textFaint;
  const isPositive = rating >= 3;
  const reasonOptions = isPositive ? POSITIVE_REASONS : NEGATIVE_REASONS;

  const selectRating = (value: number) => {
    setRating(value);
    setReasons([]);
    setNote('');
    setSubmitted(false);
  };

  const toggleReason = (reason: string) => {
    setReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating: rating as Feedback['rating'], reasons, note: note.trim() });
    setSubmitted(true);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>قيّم تجربتك مع يلا نسافر</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= rating;
          return (
            <TouchableOpacity key={value} activeOpacity={0.7} onPress={() => selectRating(value)} hitSlop={6}>
              <Ionicons
                name={filled ? 'star' : 'star-outline'}
                size={30}
                color={filled ? color : colors.border}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {rating === 0 ? (
        <Text style={styles.subtitle}>يُحفظ على جهازك فقط حاليًا، ما يُرسل لأي مكان</Text>
      ) : submitted ? (
        <>
          <Text style={styles.subtitle}>شكرًا على تقييمك! 🎉</Text>
          <TouchableOpacity onPress={() => setSubmitted(false)} activeOpacity={0.7}>
            <Text style={styles.editLink}>عدّل تقييمك</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {rating >= 4 ? <Text style={styles.subtitle}>أنت رائع! 🎉</Text> : null}
          <Text style={styles.question}>{isPositive ? 'ما الذي أعجبك أكثر؟' : 'ما الذي يمكن تحسينه؟'}</Text>
          <View style={styles.reasonsWrap}>
            {reasonOptions.map((reason) => {
              const selected = reasons.includes(reason);
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                  activeOpacity={0.7}
                  onPress={() => toggleReason(reason)}
                >
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="اوصف أكثر (اختياري)..."
            placeholderTextColor={colors.textFaint}
            value={note}
            onChangeText={setNote}
            multiline
            textAlign="right"
          />
          <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmit}>
            <Text style={styles.submitText}>إرسال</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  starsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  subtitle: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
  },
  editLink: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: spacing.xs },
  question: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  reasonsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reasonChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  reasonText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  reasonTextSelected: { color: colors.primary },
  noteInput: {
    width: '100%',
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 13,
    marginTop: spacing.lg,
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
});

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from './Text';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from '../types';

const CATEGORIES: BudgetCategory[] = ['hotels', 'food', 'transport', 'activities', 'other'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: BudgetCategory, label: string, amount: number) => void;
};

export default function LogExpenseSheet({ visible, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const { currency } = useRegion();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [category, setCategory] = useState<BudgetCategory>('food');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const reset = () => {
    setCategory('food');
    setLabel('');
    setAmount('');
  };

  const parsedAmount = Number(amount);
  const canSubmit = label.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(category, label.trim(), parsedAmount);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>سجّل مصروف</Text>
          <Text style={styles.subtitle}>بينضاف لميزانية الرحلة وينقسم بين الأعضاء</Text>

          <View style={styles.chipsRow}>
            {CATEGORIES.map((cat) => {
              const active = cat === category;
              return (
                <Pressable key={cat} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{BUDGET_CATEGORY_LABELS[cat]}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="وش المصروف؟ (مثال: عشاء)"
            placeholderTextColor={colors.textFaint}
            value={label}
            onChangeText={setLabel}
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder={`المبلغ (${currency.symbol})`}
            placeholderTextColor={colors.textFaint}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            textAlign="right"
          />

          <Pressable style={[styles.submitButton, !canSubmit && styles.submitDisabled]} disabled={!canSubmit} onPress={handleSubmit}>
            <Text style={styles.submitText}>سجّل المصروف</Text>
          </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right', marginTop: 2, marginBottom: spacing.lg },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.bodyLg,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

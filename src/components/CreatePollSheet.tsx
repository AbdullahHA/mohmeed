import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View, StyleSheet, TextInput, ScrollView } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const MAX_OPTIONS = 6;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], allowMultiple: boolean) => void;
};

export default function CreatePollSheet({ visible, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(question.trim(), validOptions, allowMultiple);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>إنشاء استطلاع رأي</Text>
          <Text style={styles.subtitle}>كل عضو بالرحلة يقدر يصوّت، والنتيجة تتحدث مباشرة للكل</Text>

          <TextInput
            style={styles.input}
            placeholder="اطرح سؤالاً..."
            placeholderTextColor={colors.textFaint}
            value={question}
            onChangeText={setQuestion}
            textAlign="right"
          />

          <ScrollView style={styles.optionsScroll}>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                {options.length > 2 ? (
                  <Pressable
                    onPress={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textFaint} />
                  </Pressable>
                ) : (
                  <View style={{ width: 20 }} />
                )}
                <TextInput
                  style={[styles.input, styles.optionInput]}
                  placeholder={`خيار ${i + 1}`}
                  placeholderTextColor={colors.textFaint}
                  value={opt}
                  onChangeText={(v) =>
                    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)))
                  }
                  textAlign="right"
                />
              </View>
            ))}
          </ScrollView>

          {options.length < MAX_OPTIONS ? (
            <Pressable style={styles.addOption} onPress={() => setOptions((prev) => [...prev, ''])}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addOptionText}>إضافة خيار</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.toggleRow} onPress={() => setAllowMultiple((v) => !v)}>
            <View style={[styles.toggle, allowMultiple && styles.toggleOn]}>
              <View style={[styles.toggleDot, allowMultiple && styles.toggleDotOn]} />
            </View>
            <Text style={styles.toggleLabel}>السماح بإجابات متعددة</Text>
          </Pressable>

          <Pressable style={[styles.submitButton, !canSubmit && styles.submitDisabled]} disabled={!canSubmit} onPress={handleSubmit}>
            <Text style={styles.submitText}>إرسال الاستطلاع</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  title: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right', marginTop: 2, marginBottom: spacing.lg },
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
    marginBottom: spacing.sm,
  },
  optionsScroll: { maxHeight: 260 },
  optionRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  optionInput: { flex: 1, marginBottom: spacing.sm },
  addOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
  },
  addOptionText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    padding: 2,
    alignItems: 'flex-start',
  },
  toggleOn: { backgroundColor: colors.primary, alignItems: 'flex-end' },
  toggleDot: { width: 20, height: 20, borderRadius: radius.pill, backgroundColor: colors.surface },
  toggleDotOn: {},
  toggleLabel: { color: colors.text, fontSize: fontSize.body, fontWeight: '600' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

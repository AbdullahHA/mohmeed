import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TextInput } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const REASONS = ['محتوى غير مناسب', 'إزعاج أو سبام', 'تحرش', 'معلومات مضللة', 'أخرى'];

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export default function ReportSheet({ visible, title, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const close = () => {
    setReason(null);
    setNote('');
    onClose();
  };

  const submit = () => {
    if (!reason) return;
    const full = note.trim() ? `${reason}: ${note.trim()}` : reason;
    onSubmit(full);
    setReason(null);
    setNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.reasonsWrap}>
            {REASONS.map((r) => (
              <Pressable key={r} style={[styles.chip, reason === r && styles.chipActive]} onPress={() => setReason(r)}>
                <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="تفاصيل إضافية (اختياري)"
            placeholderTextColor={colors.textFaint}
            value={note}
            onChangeText={setNote}
            textAlign="right"
            multiline
          />
          <Pressable style={[styles.submitButton, !reason && styles.submitDisabled]} disabled={!reason} onPress={submit}>
            <Text style={styles.submitText}>إرسال البلاغ</Text>
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: spacing.lg },
  reasonsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  noteInput: {
    width: '100%',
    minHeight: 60,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

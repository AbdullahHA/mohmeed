import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  TextInput,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { QUICK_RATE_TAGS, type QuickRateTag } from '../types';

type Props = {
  visible: boolean;
  placeName: string;
  onClose: () => void;
  onSubmit: (stars: number, tags: QuickRateTag[], note: string) => void;
};

export default function QuickRateSheet({ visible, placeName, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<QuickRateTag[]>([]);
  const [note, setNote] = useState('');

  const reset = () => {
    setStars(0);
    setTags([]);
    setNote('');
  };

  const toggleTag = (tag: QuickRateTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = () => {
    if (stars === 0) return;
    onSubmit(stars, tags, note.trim());
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>كيف كانت تجربتك في {placeName}؟</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={34} color={colors.accent} />
              </Pressable>
            ))}
          </View>

          <View style={styles.tagsRow}>
            {QUICK_RATE_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Pressable key={tag} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="ملاحظة قصيرة (اختياري)"
            placeholderTextColor={colors.textFaint}
            value={note}
            onChangeText={setNote}
            textAlign="right"
          />

          <Pressable style={[styles.submitButton, stars === 0 && styles.submitDisabled]} disabled={stars === 0} onPress={handleSubmit}>
            <Text style={styles.submitText}>تم</Text>
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
    alignItems: 'center',
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: spacing.lg },
  starsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.lg },
  tagsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  noteInput: {
    width: '100%',
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
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
});

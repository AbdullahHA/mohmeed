import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

type Props = {
  tripTitle: string;
  onUndo: () => void;
  onViewSchedule: () => void;
};

export default function AddedToast({ tripTitle, onUndo, onViewSchedule }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text style={styles.text} numberOfLines={1}>انضاف لـ{tripTitle}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onUndo} activeOpacity={0.7}>
          <Text style={styles.undoText}>تراجع</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onViewSchedule} activeOpacity={0.7}>
          <Text style={styles.viewText}>شوف الجدول</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flex: 1 },
  text: { color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  actions: { flexDirection: 'row-reverse', gap: spacing.md },
  undoText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  viewText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});

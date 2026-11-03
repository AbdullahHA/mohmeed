import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import type { ItinerarySlot } from '../types';

export const SLOT_LABELS: Record<ItinerarySlot, string> = {
  morning: 'الصباح',
  afternoon: 'الظهر',
  evening: 'المساء',
  breakfast: 'فطور',
  lunch: 'غداء',
  dinner: 'عشاء',
};

const SLOTS: ItinerarySlot[] = ['morning', 'afternoon', 'evening'];

type Props = {
  value: ItinerarySlot | null;
  onChange: (slot: ItinerarySlot | null) => void;
};

export default function SlotPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {SLOTS.map((slot) => {
        const active = value === slot;
        return (
          <TouchableOpacity
            key={slot}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onChange(active ? null : slot)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{SLOT_LABELS[slot]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: spacing.sm, flex: 1 },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 11.5, fontWeight: '700' },
  chipTextActive: { color: colors.textOnPrimary },
});

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Text from './Text';
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

const TIME_SLOTS: ItinerarySlot[] = ['morning', 'afternoon', 'evening'];
const MEAL_SLOTS: ItinerarySlot[] = ['breakfast', 'lunch', 'dinner'];

type Props = {
  value: ItinerarySlot | null;
  onChange: (slot: ItinerarySlot | null) => void;
  variant?: 'time' | 'meal';
};

export default function SlotPicker({ value, onChange, variant = 'time' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slots = variant === 'meal' ? MEAL_SLOTS : TIME_SLOTS;

  return (
    <View style={styles.row}>
      {slots.map((slot) => {
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

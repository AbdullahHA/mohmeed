import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Text from './Text';
import RtlScrollRow from './RtlScrollRow';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const WEEKDAY_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTH_SHORT = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];

export function tripDateRange(startDate: string, endDate: string): Date[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end && days.length < 60) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type Props = {
  days: Date[];
  selected: string | null;
  onSelect: (iso: string | null) => void;
};

export default function DayPicker({ days, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <RtlScrollRow contentContainerStyle={styles.row}>
      <TouchableOpacity
        style={[styles.chip, selected === null && styles.chipActive]}
        activeOpacity={0.8}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipAllText, selected === null && styles.chipTextActive]}>الكل</Text>
      </TouchableOpacity>
      {days.map((date) => {
        const iso = formatIsoDate(date);
        const active = selected === iso;
        return (
          <TouchableOpacity
            key={iso}
            style={[styles.dayChip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onSelect(iso)}
          >
            <Text style={[styles.dayWeekday, active && styles.chipTextActive]}>{WEEKDAY_SHORT[date.getDay()]}</Text>
            <Text style={[styles.dayNumber, active && styles.chipTextActive]}>{date.getDate()}</Text>
            <Text style={[styles.dayMonth, active && styles.chipTextActive]}>{MONTH_SHORT[date.getMonth()]}</Text>
          </TouchableOpacity>
        );
      })}
    </RtlScrollRow>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAllText: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  dayChip: {
    width: 58,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTextActive: { color: colors.textOnPrimary },
  dayWeekday: { color: colors.textMuted, fontSize: fontSize.tiny, fontWeight: '600' },
  dayNumber: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  dayMonth: { color: colors.textFaint, fontSize: fontSize.tiny },
});

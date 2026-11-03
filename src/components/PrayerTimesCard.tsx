import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import {
  PRAYER_LABELS,
  formatCountdown,
  formatTime,
  getNextPrayer,
  getPrayerTimesForDay,
  getQiblaBearing,
  type PrayerName,
} from '../lib/prayerTimes';
import type { Coordinate } from '../lib/geo';

type Props = { coordinate: Coordinate };

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerTimesCard({ coordinate }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimes = useMemo(() => getPrayerTimesForDay(coordinate, now), [coordinate, now]);
  const next = useMemo(() => getNextPrayer(coordinate, now), [coordinate, now]);
  const qibla = useMemo(() => getQiblaBearing(coordinate), [coordinate]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="moon-outline" size={16} color={colors.primary} />
        <Text style={styles.headerTitle}>مواقيت الصلاة</Text>
        <Text style={styles.nextLabel}>
          {PRAYER_LABELS[next.name]} {formatCountdown(next.at.getTime() - now.getTime())}
        </Text>
      </View>

      <View style={styles.timesRow}>
        {PRAYER_ORDER.map((p) => (
          <View key={p} style={[styles.timeCell, p === next.name && styles.timeCellActive]}>
            <Text style={[styles.timeLabel, p === next.name && styles.timeLabelActive]}>{PRAYER_LABELS[p]}</Text>
            <Text style={[styles.timeValue, p === next.name && styles.timeLabelActive]}>{formatTime(todayTimes[p])}</Text>
          </View>
        ))}
      </View>

      <View style={styles.qiblaRow}>
        <Ionicons name="navigate" size={14} color={colors.textMuted} style={{ transform: [{ rotate: `${qibla}deg` }] }} />
        <Text style={styles.qiblaText}>اتجاه القبلة {Math.round(qibla)}° من الشمال</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  headerTitle: { color: colors.text, fontSize: 13, fontWeight: '800', flex: 1, textAlign: 'right' },
  nextLabel: { color: colors.primary, fontSize: 11.5, fontWeight: '700' },
  timesRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  timeCell: { alignItems: 'center', flex: 1 },
  timeCellActive: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingVertical: 4 },
  timeLabel: { color: colors.textMuted, fontSize: 10.5, fontWeight: '600' },
  timeLabelActive: { color: colors.primary },
  timeValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 2 },
  qiblaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  qiblaText: { color: colors.textMuted, fontSize: 11 },
});

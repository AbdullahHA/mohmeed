import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type EventRow = {
  id: string;
  name: string;
  city: string;
  category: string;
  starts_at: string;
  ends_at: string;
};

function fmtRange(startsAt: string, endsAt: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const start = new Date(startsAt).toLocaleDateString('ar-SA', opts);
  const end = new Date(endsAt).toLocaleDateString('ar-SA', opts);
  return start === end ? start : `${start} — ${end}`;
}

export default function EventsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('events')
      .select('id,name,city,category,starts_at,ends_at')
      .order('starts_at', { ascending: true });
    setEvents(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const cities = useMemo(() => Array.from(new Set((events ?? []).map((e) => e.city))), [events]);
  const upcoming = useMemo(() => (events ?? []).filter((e) => new Date(e.ends_at).getTime() >= Date.now()), [events]);
  const filtered = cityFilter ? upcoming.filter((e) => e.city === cityFilter) : upcoming;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الفعاليات</Text>
        <View style={{ width: 20 }} />
      </View>

      {cities.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          <TouchableOpacity
            onPress={() => setCityFilter(null)}
            style={[styles.chip, !cityFilter && styles.chipActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, !cityFilter && styles.chipTextActive]}>الكل</Text>
          </TouchableOpacity>
          {cities.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCityFilter(c)}
              style={[styles.chip, cityFilter === c && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, cityFilter === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {events === null ? (
        <Text style={styles.emptyText}>جاري التحميل...</Text>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="لا توجد فعاليات قادمة حاليًا"
          subtitle="تابعنا باستمرار — فعاليات جديدة تنضاف أول ما تتوفر."
        />
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
          {filtered.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EventDetail', { eventId: e.id })}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{e.name}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {e.city} · {e.category} · {fmtRange(e.starts_at, e.ends_at)}
                </Text>
              </View>
              <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  chipsRow: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  chipsContent: { flexDirection: 'row-reverse', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: fontSize.base, fontWeight: '700' },
  chipTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 20 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right' },
});

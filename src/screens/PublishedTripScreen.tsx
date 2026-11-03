import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'PublishedTrip'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type Header = { title: string; destination: string; coverUrl: string | null; ownerName: string };
type Item = { id: string; day: string; time: string; title: string; note: string | null; slot: string | null };

export default function PublishedTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { copyPublishedTrip } = useAppState();
  const { requireAccount } = useRequireAccount();
  const tripId = route.params.tripId;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [header, setHeader] = useState<Header | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [budgetShares, setBudgetShares] = useState<{ category: BudgetCategory; percent: number }[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: tripRow } = await supabase
        .from('trips')
        .select('title,destination,cover_image_url,owner_id,is_published')
        .eq('id', tripId)
        .eq('is_published', true)
        .maybeSingle();
      if (cancelled) return;
      if (!tripRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: ownerRow } = await supabase.from('profiles').select('name').eq('id', tripRow.owner_id).maybeSingle();
      const { data: itemRows } = await supabase
        .from('itinerary_items')
        .select('id,day,time,title,note,slot')
        .eq('trip_id', tripId)
        .order('day', { ascending: true });
      const { data: budgetRows } = await supabase.from('budget_items').select('category,amount').eq('trip_id', tripId);
      if (cancelled) return;

      setHeader({
        title: tripRow.title,
        destination: tripRow.destination,
        coverUrl: tripRow.cover_image_url,
        ownerName: ownerRow?.name ?? 'مسافر',
      });
      setItems((itemRows ?? []) as Item[]);

      const totals: Record<string, number> = {};
      let sum = 0;
      ((budgetRows ?? []) as any[]).forEach((b) => {
        const amt = Number(b.amount) || 0;
        totals[b.category] = (totals[b.category] ?? 0) + amt;
        sum += amt;
      });
      setBudgetShares(
        sum > 0
          ? Object.entries(totals).map(([category, amt]) => ({
              category: category as BudgetCategory,
              percent: Math.round((amt / sum) * 100),
            }))
          : []
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const handleCopy = () => {
    requireAccount('trip', async () => {
      setCopying(true);
      const { tripId: newTripId, error } = await copyPublishedTrip(tripId);
      setCopying(false);
      if (error || !newTripId) {
        Alert.alert('تعذّر نسخ الخطة', error ?? 'حاول مرة ثانية');
        return;
      }
      navigation.replace('TripDetail', { tripId: newTripId });
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !header) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.notFound}>هذه الرحلة غير منشورة أو ما عادت متوفرة</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = Array.from(new Set(items.map((i) => i.day)));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>جدول رحلة منشور</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {header.coverUrl ? <Image source={{ uri: header.coverUrl }} style={styles.cover} /> : null}
        <Text style={styles.title}>{header.title}</Text>
        <Text style={styles.subtitle}>{header.destination} · بواسطة {header.ownerName}</Text>

        {days.length === 0 ? (
          <Text style={styles.emptyText}>ما فيه جدول مضاف لهذي الرحلة بعد</Text>
        ) : (
          days.map((day) => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayLabel}>يوم {day}</Text>
              {items
                .filter((i) => i.day === day)
                .map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemTime}>{item.time || '—'}</Text>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                    </View>
                  </View>
                ))}
            </View>
          ))
        )}

        {budgetShares.length > 0 ? (
          <View style={styles.budgetSection}>
            <Text style={styles.dayLabel}>توزيع الميزانية</Text>
            {budgetShares.map((b) => (
              <View key={b.category} style={styles.budgetRow}>
                <Text style={styles.budgetPercent}>{b.percent}%</Text>
                <Text style={styles.budgetLabel}>{BUDGET_CATEGORY_LABELS[b.category]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.copyButton} activeOpacity={0.85} onPress={handleCopy} disabled={copying}>
          {copying ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.copyButtonText}>انسخ الخطة لرحلتي</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cover: { width: '100%', height: 160, borderRadius: radius.md, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: spacing.xs, marginBottom: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  daySection: { marginBottom: spacing.lg },
  dayLabel: { color: colors.primary, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  itemRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTime: { color: colors.textMuted, fontSize: 11, fontWeight: '700', minWidth: 44, textAlign: 'left' },
  itemTextWrap: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  itemNote: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  budgetSection: { marginTop: spacing.md },
  budgetRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  budgetPercent: { color: colors.primary, fontSize: 13, fontWeight: '700', minWidth: 44 },
  budgetLabel: { color: colors.text, fontSize: 13 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  copyButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center' },
  copyButtonText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
});

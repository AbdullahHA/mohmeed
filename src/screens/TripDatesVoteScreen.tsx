import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatIsoDate } from '../components/DayPicker';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripDatesVote'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type MemberProfile = { id: string; name: string };

const WEEKDAY_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function buildMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadBlanks = first.getDay();
  const cells: (Date | null)[] = Array.from({ length: leadBlanks }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function TripDatesVoteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, confirmTripDates } = useAppState();
  const { profile } = useAuth();

  const trip = trips.find((t) => t.id === route.params.tripId);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [votes, setVotes] = useState<{ userId: string; date: string }[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!trip) return;
    supabase
      .from('profiles')
      .select('id,name')
      .in('id', trip.memberIds)
      .then(({ data }) => setMembers((data ?? []).map((r: any) => ({ id: r.id, name: r.name }))));
  }, [trip?.memberIds.join(',')]);

  const loadVotes = async () => {
    if (!trip) return;
    const { data } = await supabase.from('trip_date_votes').select('user_id,date').eq('trip_id', trip.id);
    setVotes((data ?? []).map((r: any) => ({ userId: r.user_id, date: r.date })));
  };

  useEffect(() => {
    loadVotes();
    if (!trip) return;
    const channel = supabase
      .channel(`trip-dates-${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_date_votes', filter: `trip_id=eq.${trip.id}` },
        () => loadVotes()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip?.id]);

  if (!trip || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const cells = buildMonthDays(baseMonth.getFullYear(), baseMonth.getMonth());

  const votesByDate = new Map<string, Set<string>>();
  for (const v of votes) {
    if (!votesByDate.has(v.date)) votesByDate.set(v.date, new Set());
    votesByDate.get(v.date)!.add(v.userId);
  }

  const myVotedDates = new Set(votes.filter((v) => v.userId === profile.id).map((v) => v.date));

  const toggleDay = async (date: Date) => {
    const iso = formatIsoDate(date);
    const alreadyVoted = myVotedDates.has(iso);
    if (alreadyVoted) {
      await supabase.from('trip_date_votes').delete().eq('trip_id', trip.id).eq('user_id', profile.id).eq('date', iso);
    } else {
      await supabase.from('trip_date_votes').insert({ trip_id: trip.id, user_id: profile.id, date: iso });
    }
    loadVotes();
  };

  const neededLength = trip.flexibleDays ?? 3;
  const threshold = Math.floor(members.length / 2) + 1;

  const bestWindow = useMemo(() => {
    const sortedDates = Array.from(votesByDate.keys()).sort();
    let best: { start: string; end: string; count: number; length: number } | null = null;
    for (let i = 0; i < sortedDates.length; i++) {
      let runLength = 1;
      let minCount = votesByDate.get(sortedDates[i])!.size;
      for (let j = i + 1; j < sortedDates.length; j++) {
        const prevDate = new Date(sortedDates[j - 1] + 'T00:00:00');
        const curDate = new Date(sortedDates[j] + 'T00:00:00');
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
        if (diffDays !== 1) break;
        runLength++;
        minCount = Math.min(minCount, votesByDate.get(sortedDates[j])!.size);
      }
      if (runLength >= Math.min(neededLength, sortedDates.length) && minCount >= Math.max(1, threshold)) {
        if (!best || minCount > best.count || (minCount === best.count && runLength > best.length)) {
          best = { start: sortedDates[i], end: sortedDates[i + runLength - 1], count: minCount, length: runLength };
        }
      }
    }
    return best;
  }, [votes, neededLength, threshold]);

  const isOrganizer = trip.ownerId === profile.id;

  const handleConfirm = async () => {
    if (!bestWindow) return;
    setConfirming(true);
    await confirmTripDates(trip.id, bestWindow.start, bestWindow.end);
    setConfirming(false);
    navigation.replace('TripDetail', { tripId: trip.id });
  };

  const handleRemind = async (memberId: string) => {
    await supabase.from('trip_messages').insert({
      trip_id: trip.id,
      from_id: profile.id,
      text: '⏰ تذكير: حدد الأيام اللي تناسبك عشان نحدد موعد الرحلة',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>متى نسافر؟</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>كل عضو يضغط الأيام اللي تناسبه، وكل ما زاد اللون اخضر كل ما اتفق عليه أكثر</Text>

        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setMonthOffset((m) => m + 1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[baseMonth.getMonth()]} {baseMonth.getFullYear()}</Text>
          <TouchableOpacity onPress={() => setMonthOffset((m) => Math.max(0, m - 1))} hitSlop={10} disabled={monthOffset === 0}>
            <Ionicons name="chevron-forward" size={20} color={monthOffset === 0 ? colors.textFaint : colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_SHORT.map((w) => (
            <Text key={w} style={styles.weekdayText}>{w}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((date, idx) => {
            if (!date) return <View key={idx} style={styles.dayCell} />;
            const iso = formatIsoDate(date);
            const count = votesByDate.get(iso)?.size ?? 0;
            const ratio = members.length > 0 ? count / members.length : 0;
            const mine = myVotedDates.has(iso);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  count > 0 && { backgroundColor: `rgba(31,157,99,${0.15 + ratio * 0.6})` },
                  mine && styles.dayCellMine,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleDay(date)}
              >
                <Text style={styles.dayNumber}>{date.getDate()}</Text>
                {count > 0 ? <Text style={styles.dayCount}>{count}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {bestWindow ? (
          <View style={styles.bestCard}>
            <Ionicons name="sparkles" size={16} color={colors.accentDark} />
            <View style={styles.bestTextWrap}>
              <Text style={styles.bestTitle}>أفضل موعد</Text>
              <Text style={styles.bestMeta}>{bestWindow.start} → {bestWindow.end} · يتفق عليه {bestWindow.count} من {members.length}</Text>
            </View>
            {isOrganizer ? (
              <TouchableOpacity style={styles.adoptButton} activeOpacity={0.85} onPress={handleConfirm} disabled={confirming}>
                <Text style={styles.adoptButtonText}>{confirming ? '...' : 'اعتمد التواريخ'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>الأعضاء</Text>
        <View style={styles.membersList}>
          {members.map((m) => {
            const count = votes.filter((v) => v.userId === m.id).length;
            return (
              <View key={m.id} style={styles.memberRow}>
                <Text style={styles.memberName}>{m.id === profile.id ? 'أنت' : m.name}</Text>
                {count > 0 ? (
                  <Text style={styles.memberCount}>حدد {count} أيام</Text>
                ) : m.id === profile.id ? (
                  <Text style={styles.memberCount}>ما حددت بعد</Text>
                ) : (
                  <TouchableOpacity onPress={() => handleRemind(m.id)}>
                    <Text style={styles.remindText}>ذكّره</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { color: colors.textMuted, fontSize: 12.5, textAlign: 'right', marginBottom: spacing.md, lineHeight: 18 },
  monthRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  weekdayRow: { flexDirection: 'row-reverse', marginBottom: spacing.xs },
  weekdayText: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: 10, fontWeight: '700' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginBottom: 2,
  },
  dayCellMine: { borderWidth: 2, borderColor: colors.primary },
  dayNumber: { color: colors.text, fontSize: 13, fontWeight: '700' },
  dayCount: { color: colors.successDark, fontSize: 9, fontWeight: '700' },
  bestCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  bestTextWrap: { flex: 1 },
  bestTitle: { color: colors.accentDark, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  bestMeta: { color: colors.accentDark, fontSize: 11, textAlign: 'right', marginTop: 2 },
  adoptButton: { backgroundColor: colors.accentDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  adoptButtonText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: spacing.xl, marginBottom: spacing.sm },
  membersList: { gap: spacing.sm },
  memberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  memberName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  memberCount: { color: colors.textMuted, fontSize: 12 },
  remindText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});

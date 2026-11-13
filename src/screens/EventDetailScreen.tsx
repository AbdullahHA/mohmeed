import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EventDetail'>;

type EventRow = {
  id: string;
  name: string;
  city: string;
  category: string;
  starts_at: string;
  ends_at: string;
  official_url: string | null;
  audience: 'public' | 'internal' | 'kids' | 'women_only';
  notify_interested: boolean;
  place_id: string | null;
};

const AUDIENCE_LABEL: Record<EventRow['audience'], string> = {
  public: 'عام',
  internal: 'داخلي',
  kids: 'للأطفال',
  women_only: 'نساء فقط',
};

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function EventDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [interested, setInterested] = useState(false);
  const [togglingInterest, setTogglingInterest] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,name,city,category,starts_at,ends_at,official_url,audience,notify_interested,place_id')
        .eq('id', route.params.eventId)
        .single();
      setEvent(data ?? null);

      if (session?.user.id) {
        const { data: interestRow } = await supabase
          .from('event_interests')
          .select('event_id')
          .eq('event_id', route.params.eventId)
          .eq('user_id', session.user.id)
          .maybeSingle();
        setInterested(!!interestRow);
      }
    })();
  }, [route.params.eventId, session?.user.id]);

  const toggleInterest = async () => {
    if (!session?.user.id || !event) return;
    setTogglingInterest(true);
    if (interested) {
      await supabase.from('event_interests').delete().eq('event_id', event.id).eq('user_id', session.user.id);
    } else {
      await supabase.from('event_interests').insert({ event_id: event.id, user_id: session.user.id });
    }
    setInterested(!interested);
    setTogglingInterest(false);
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-forward" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الفعالية</Text>
          <View style={{ width: 20 }} />
        </View>
        <Text style={styles.emptyText}>جاري التحميل...</Text>
      </SafeAreaView>
    );
  }

  const now = Date.now();
  const startMs = new Date(event.starts_at).getTime();
  const endMs = new Date(event.ends_at).getTime();
  const showSoonBanner = now >= startMs - FIVE_DAYS_MS && now <= endMs;
  const ended = now > endMs;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {showSoonBanner ? (
          <View style={styles.soonBanner}>
            <Ionicons name="flash" size={14} color={colors.accentDark} />
            <Text style={styles.soonBannerText}>يصير هالوكند</Text>
          </View>
        ) : null}

        <Text style={styles.title}>{event.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{event.city} · {event.category}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {fmtDate(event.starts_at)}
            {event.starts_at !== event.ends_at ? ` — ${fmtDate(event.ends_at)}` : ''}
          </Text>
        </View>
        {event.audience !== 'public' ? (
          <View style={styles.audienceBadge}>
            <Text style={styles.audienceBadgeText}>{AUDIENCE_LABEL[event.audience]}</Text>
          </View>
        ) : null}

        {ended ? (
          <View style={styles.endedNotice}>
            <Text style={styles.endedNoticeText}>هذي الفعالية خلصت</Text>
          </View>
        ) : null}

        <View style={styles.disclosure}>
          <Text style={styles.disclosureText}>
            نعرض الرابط الرسمي بس — بدون حجز أو أسعار أو دفع داخل التطبيق. أي تفاصيل حجز أو تذاكر تلاقيها على الموقع الرسمي.
          </Text>
        </View>

        {event.official_url ? (
          <TouchableOpacity
            style={styles.officialBtn}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(event.official_url!)}
          >
            <Ionicons name="open-outline" size={16} color={colors.textOnPrimary} />
            <Text style={styles.officialBtnText}>زيارة الموقع الرسمي</Text>
          </TouchableOpacity>
        ) : null}

        {event.notify_interested && session?.user.id ? (
          <TouchableOpacity
            style={[styles.interestBtn, interested && styles.interestBtnActive]}
            activeOpacity={0.85}
            disabled={togglingInterest}
            onPress={toggleInterest}
          >
            <Ionicons name={interested ? 'heart' : 'heart-outline'} size={16} color={interested ? colors.heart : colors.text} />
            <Text style={[styles.interestBtnText, interested && { color: colors.heart }]}>
              {interested ? 'أنت مهتم بهذي الفعالية' : 'أنا مهتم'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
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
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', flex: 1, textAlign: 'center' },
  body: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  soonBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  soonBannerText: { color: colors.accentDark, fontSize: fontSize.base, fontWeight: '700' },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: '800', textAlign: 'right' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textMuted, fontSize: fontSize.body, textAlign: 'right' },
  audienceBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  audienceBadgeText: { color: colors.textMuted, fontSize: fontSize.small, fontWeight: '700' },
  endedNotice: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  endedNoticeText: { color: colors.textMuted, fontSize: fontSize.body, textAlign: 'center', fontWeight: '600' },
  disclosure: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  disclosureText: { color: colors.textMuted, fontSize: fontSize.base, lineHeight: 18, textAlign: 'right' },
  officialBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginTop: spacing.md,
  },
  officialBtnText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
  interestBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  interestBtnActive: { borderColor: colors.heart },
  interestBtnText: { color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

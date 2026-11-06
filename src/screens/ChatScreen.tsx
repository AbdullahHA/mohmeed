import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import SectionHeader from '../components/SectionHeader';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'trips' | 'communities' | 'direct';
type ConvoRow = {
  key: string;
  kind: 'trip' | 'community' | 'direct';
  title: string;
  subtitle: string;
  at: number | null;
  onPress: () => void;
};

const GUIDE_SUGGESTIONS = ['أرخص شهر لجورجيا', 'وجهة تناسب العائلة'];
const WEEKDAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatRelativeChatTime(at: number): string {
  const date = new Date(at);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (dayDiff === 0) return date.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (dayDiff === 1) return 'أمس';
  if (dayDiff > 1 && dayDiff < 7) return WEEKDAY_AR[date.getDay()];
  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' });
}

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAuth();
  const { guideMessages, sendGuideMessage, trips, friends, communities, communityRequests } = useAppState();
  const [lastTripMessages, setLastTripMessages] = useState<Record<string, { text: string; at: number }>>({});
  const [lastCommunityMessages, setLastCommunityMessages] = useState<Record<string, { text: string; at: number }>>({});
  const [lastDirectMessages, setLastDirectMessages] = useState<Record<string, { text: string; at: number; fromMe: boolean }>>({});
  const [filter, setFilter] = useState<Filter>('all');

  const lastGuideMessage = guideMessages[guideMessages.length - 1];
  const joinedCommunities = communities.filter((c) => c.joined);
  const discoverCommunities = communities.filter((c) => !c.joined);
  const pendingRequest = communityRequests.find((r) => r.status === 'pending');
  const { requireAccount } = useRequireAccount();

  const askGuide = (text?: string) => {
    const trimmed = text ?? '';
    if (!trimmed) {
      navigation.navigate('GuideChat');
      return;
    }
    sendGuideMessage(trimmed);
    navigation.navigate('GuideChat');
  };

  useEffect(() => {
    if (trips.length === 0) {
      setLastTripMessages({});
      return;
    }
    let cancelled = false;
    supabase
      .from('trip_messages')
      .select('trip_id,text,at')
      .in(
        'trip_id',
        trips.map((t) => t.id)
      )
      .order('at', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const latest: Record<string, { text: string; at: number }> = {};
        for (const row of data as any[]) {
          if (!latest[row.trip_id]) latest[row.trip_id] = { text: row.text, at: new Date(row.at).getTime() };
        }
        setLastTripMessages(latest);
      });
    return () => {
      cancelled = true;
    };
  }, [trips.map((t) => t.id).join(',')]);

  useEffect(() => {
    if (joinedCommunities.length === 0) {
      setLastCommunityMessages({});
      return;
    }
    let cancelled = false;
    supabase
      .from('community_messages')
      .select('community_id,text,from_id,at')
      .in(
        'community_id',
        joinedCommunities.map((c) => c.id)
      )
      .order('at', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const latest: Record<string, { text: string; at: number }> = {};
        for (const row of data as any[]) {
          if (!latest[row.community_id]) latest[row.community_id] = { text: row.text, at: new Date(row.at).getTime() };
        }
        setLastCommunityMessages(latest);
      });
    return () => {
      cancelled = true;
    };
  }, [joinedCommunities.map((c) => c.id).join(',')]);

  useEffect(() => {
    if (!profile || friends.length === 0) {
      setLastDirectMessages({});
      return;
    }
    let cancelled = false;
    supabase
      .from('direct_messages')
      .select('sender_id,recipient_id,text,created_at')
      .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const latest: Record<string, { text: string; at: number; fromMe: boolean }> = {};
        for (const row of data as any[]) {
          const otherId = row.sender_id === profile.id ? row.recipient_id : row.sender_id;
          if (!latest[otherId]) {
            latest[otherId] = { text: row.text, at: new Date(row.created_at).getTime(), fromMe: row.sender_id === profile.id };
          }
        }
        setLastDirectMessages(latest);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id, friends.map((f) => f.id).join(',')]);

  const tripRows: ConvoRow[] = trips.map((trip) => {
    const otherMembers = trip.memberIds.length - 1;
    const last = lastTripMessages[trip.id];
    return {
      key: `trip-${trip.id}`,
      kind: 'trip',
      title: trip.title,
      subtitle: last ? last.text : otherMembers > 0 ? `مع ${otherMembers} أعضاء` : 'لسا محد انضم',
      at: last?.at ?? null,
      onPress: () => navigation.navigate('GroupChat', { tripId: trip.id }),
    };
  });

  const communityRows: ConvoRow[] = joinedCommunities.map((community) => {
    const last = lastCommunityMessages[community.id];
    return {
      key: `community-${community.id}`,
      kind: 'community',
      title: community.name,
      subtitle: last ? last.text : community.tagline,
      at: last?.at ?? null,
      onPress: () => navigation.navigate('CommunityChat', { communityId: community.id }),
    };
  });

  const directRows: ConvoRow[] = Object.entries(lastDirectMessages)
    .map((entry): ConvoRow | null => {
      const [friendId, last] = entry;
      const friend = friends.find((f) => f.id === friendId);
      if (!friend) return null;
      return {
        key: `direct-${friendId}`,
        kind: 'direct',
        title: friend.name,
        subtitle: last.fromMe ? `أنت: ${last.text}` : last.text,
        at: last.at,
        onPress: () => navigation.navigate('FriendChat', { friendId }),
      };
    })
    .filter((r): r is ConvoRow => r !== null);

  const filteredRows = useMemo(() => {
    const rows =
      filter === 'trips' ? tripRows : filter === 'communities' ? communityRows : filter === 'direct' ? directRows : [...tripRows, ...communityRows, ...directRows];
    return [...rows].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  }, [filter, tripRows, communityRows, directRows]);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.guideCard}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('GuideChat')}>
            <View style={styles.guideTopRow}>
              <View style={styles.guideIcon}>
                <Ionicons name="compass" size={18} color={colors.primary} />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideTitle}>دليل السفر</Text>
                <Text style={styles.guideSubtitle} numberOfLines={1}>
                  {lastGuideMessage ? lastGuideMessage.text : 'اسألني عن أفضل الوجهات والأوقات والأماكن'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.guideSuggRow}>
            {GUIDE_SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.guideSuggChip} activeOpacity={0.8} onPress={() => askGuide(s)}>
                <Text style={styles.guideSuggChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          {([
            ['all', 'الكل'],
            ['trips', 'الرحلات'],
            ['communities', 'المجتمعات'],
            ['direct', 'خاص'],
          ] as const).map(([key, label]) => {
            const count = key === 'trips' ? tripRows.length : key === 'communities' ? communityRows.length : key === 'direct' ? directRows.length : 0;
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.85}
                onPress={() => setFilter(key)}
              >
                {count > 0 ? (
                  <View style={[styles.filterChipN, active && styles.filterChipNActive]}>
                    <Text style={[styles.filterChipNText, active && styles.filterChipNTextActive]}>{count}</Text>
                  </View>
                ) : null}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredRows.length === 0 ? (
          <Text style={styles.emptyText}>
            {filter === 'direct' ? 'ابدأ محادثة مع صديق وتظهر هنا' : 'ابدأ رحلة أو انضم لمجتمع عشان تظهر محادثته هنا'}
          </Text>
        ) : (
          filteredRows.map((row) => (
            <TouchableOpacity key={row.key} style={styles.rowCard} activeOpacity={0.85} onPress={row.onPress}>
              <View style={styles.rowAvatarWrap}>
                <View style={[styles.rowAvatar, styles[`rowAvatar_${row.kind}` as const]]}>
                  <Ionicons
                    name={row.kind === 'trip' ? 'briefcase' : row.kind === 'community' ? 'people' : 'person'}
                    size={20}
                    color={colors.textOnPrimary}
                  />
                </View>
                <View style={styles.rowKindBadge}>
                  <Ionicons
                    name={row.kind === 'trip' ? 'briefcase-outline' : row.kind === 'community' ? 'people-outline' : 'chatbubble-outline'}
                    size={10}
                    color={colors.primary}
                  />
                </View>
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>{row.subtitle}</Text>
              </View>
              {row.at ? <Text style={styles.rowTime}>{formatRelativeChatTime(row.at)}</Text> : <View style={styles.rowTimeSpacer} />}
            </TouchableOpacity>
          ))
        )}

        {pendingRequest ? (
          <TouchableOpacity
            style={styles.pendingBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CommunityRequest')}
          >
            <Ionicons name="time-outline" size={18} color={colors.accentDark} />
            <Text style={styles.pendingBannerText}>
              طلبك لإنشاء مجتمع «{pendingRequest.name}» قيد المراجعة من الإدارة
            </Text>
          </TouchableOpacity>
        ) : null}

        <SectionHeader title="استكشف مجتمعات سفر" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverRow}
        >
          {discoverCommunities.map((community) => (
            <TouchableOpacity
              key={community.id}
              style={styles.discoverItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CommunityChat', { communityId: community.id })}
            >
              <View style={[styles.discoverAvatar, { borderColor: community.color }]}>
                <Text style={styles.discoverEmoji}>{community.emoji}</Text>
              </View>
              <Text style={styles.discoverLabel} numberOfLines={2}>
                {community.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.discoverItem}
            activeOpacity={0.85}
            onPress={() => requireAccount('chat', () => navigation.navigate('CommunityRequest'))}
          >
            <View style={[styles.discoverAvatar, styles.addAvatar]}>
              <Ionicons name="add" size={26} color={colors.primary} />
            </View>
            <Text style={styles.discoverLabel} numberOfLines={2}>
              اطلب إنشاء مجتمع
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },
  guideCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  guideTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  guideIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextWrap: { flex: 1 },
  guideTitle: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  guideSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'right', marginTop: 2 },
  guideSuggRow: { flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' },
  guideSuggChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  guideSuggChipText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '600' },
  filterRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  filterChipActive: { backgroundColor: colors.text },
  filterChipText: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  filterChipTextActive: { color: colors.background },
  filterChipN: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipNActive: { backgroundColor: colors.surface },
  filterChipNText: { color: colors.textOnPrimary, fontSize: 10, fontWeight: '700' },
  filterChipNTextActive: { color: colors.text },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  rowCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  rowAvatarWrap: { width: 48, height: 48, position: 'relative' },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatar_trip: { backgroundColor: colors.accentDark },
  rowAvatar_community: { backgroundColor: colors.success },
  rowAvatar_direct: { backgroundColor: colors.primary },
  rowKindBadge: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  rowTime: { color: colors.primary, fontSize: 11, fontWeight: '600', width: 48, textAlign: 'left' },
  rowTimeSpacer: { width: 48 },
  discoverRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  discoverItem: { alignItems: 'center', width: 76 },
  discoverAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  addAvatar: { borderColor: colors.primary, borderStyle: 'dashed' },
  discoverEmoji: { fontSize: 26 },
  discoverLabel: { color: colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  pendingBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pendingBannerText: { flex: 1, color: colors.accentDark, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});

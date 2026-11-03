import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import DesertHero from '../components/DesertHero';
import SectionHeader from '../components/SectionHeader';
import DestinationCard from '../components/DestinationCard';
import FilterChip from '../components/FilterChip';
import PersonAvatar from '../components/PersonAvatar';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { INTEREST_TAGS } from '../data/destinations';
import { seasonalHighlights } from '../data/seasonalHighlights';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { formatTripDateRange } from '../lib/tripDates';
import type { FeedPost } from '../types';
import type { RootStackParamList } from '../navigation/types';

const ONBOARDING_QUIZ_SEEN_PREFIX = 'yalla-nsafer:onboarding-quiz-seen:';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const GUIDE_SUGGESTIONS = ['ويكند قريب من الرياض', 'رحلة بميزانية محدودة', 'وجهة تناسب العائلة'];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'مساء الخير';
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'نهارك سعيد';
  return 'مساء الخير';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, sendGuideMessage, currentUser, loadFollowingFeed, followingIds, notifications } = useAppState();
  const { requireAccount } = useRequireAccount();
  const { destinations, offline } = useContent();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [activeInterest, setActiveInterest] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (!profile || profile.interests.length > 0) return;
    const key = `${ONBOARDING_QUIZ_SEEN_PREFIX}${profile.id}`;
    AsyncStorage.getItem(key).then((seen) => {
      if (seen) return;
      AsyncStorage.setItem(key, '1').catch(() => {});
      navigation.navigate('OnboardingQuiz');
    });
  }, [profile?.id]);

  useEffect(() => {
    if (!profile || followingIds.length === 0) {
      setFeed([]);
      return;
    }
    loadFollowingFeed(4).then(setFeed);
  }, [profile?.id, followingIds.length]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const currentMonth = new Date().getMonth() + 1;
  const monthlyDestinations = useMemo(() => {
    const matches = destinations.filter((d) => d.bestMonths.includes(currentMonth));
    return matches.length > 0 ? matches : destinations;
  }, [currentMonth, destinations]);

  const nextTrip = useMemo(() => {
    const now = Date.now();
    const datedTrips = trips.filter(
      (t) => /^\d{4}-\d{2}-\d{2}$/.test(t.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(t.endDate)
    );
    const ongoing = datedTrips.find((t) => {
      const start = new Date(`${t.startDate}T00:00:00`).getTime();
      const end = new Date(`${t.endDate}T23:59:59`).getTime();
      return now >= start && now <= end;
    });
    if (ongoing) return ongoing;
    const upcoming = [...datedTrips]
      .filter((t) => new Date(`${t.startDate}T00:00:00`).getTime() > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    if (upcoming) return upcoming;
    // No trip has real dates yet (still flexible/vote mode) — fall back to the
    // most recently created one so a trip genuinely being planned isn't hidden.
    return trips[0] ?? null;
  }, [trips]);
  const daysUntilTrip = nextTrip ? Math.ceil((new Date(nextTrip.startDate).getTime() - Date.now()) / 86400000) : null;
  const tripBudgetSpent = nextTrip ? nextTrip.budgetItems.reduce((sum, i) => sum + i.amount, 0) : 0;
  const checklistTotal = nextTrip?.checklist.length ?? 0;
  const checklistDone = nextTrip?.checklist.filter((c) => c.done).length ?? 0;

  const recentlyEndedTrip = useMemo(() => {
    const now = Date.now();
    return trips.find((t) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.endDate)) return false;
      const endMs = new Date(t.endDate + 'T23:59:59').getTime();
      const daysSinceEnd = (now - endMs) / 86400000;
      return daysSinceEnd >= 0 && daysSinceEnd <= 7;
    });
  }, [trips]);

  const filteredAllDestinations = useMemo(() => {
    if (!activeInterest) return destinations;
    return destinations.filter((d) => d.interests.includes(activeInterest));
  }, [activeInterest, destinations]);

  const askGuide = (text?: string) => {
    const trimmed = (text ?? query).trim();
    if (!trimmed) return;
    sendGuideMessage(trimmed);
    setQuery('');
    navigation.navigate('GuideChat');
  };

  return (
    <SafeAreaView style={styles.container}>
      {offline ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.textMuted} />
          <Text style={styles.offlineText}>وضع عدم الاتصال — تعرض آخر محتوى محفوظ</Text>
        </View>
      ) : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.apphead}>
          {profile ? (
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={19} color={colors.text} />
              {unreadNotifications > 0 ? <View style={styles.bellDot} /> : null}
            </TouchableOpacity>
          ) : null}
          <View style={styles.hi}>
            <View>
              <Text style={styles.hiGreeting}>{greeting()}</Text>
              <Text style={styles.hiName}>{currentUser.name}</Text>
            </View>
            <PersonAvatar avatarUrl={currentUser.avatarUrl} size={40} />
          </View>
        </View>

        {recentlyEndedTrip ? (
          <TouchableOpacity
            style={styles.returnBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TripSummary', { tripId: recentlyEndedTrip.id })}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.accentDark} />
            <Text style={styles.returnBannerText}>كيف كانت {recentlyEndedTrip.destination}؟</Text>
            <Ionicons name="chevron-back" size={16} color={colors.accentDark} />
          </TouchableOpacity>
        ) : null}

        {nextTrip && daysUntilTrip !== null ? (
          <TouchableOpacity
            style={styles.nextTripWrap}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('TripDetail', { tripId: nextTrip.id })}
          >
            <DesertHero dark style={styles.nextTripBg}>
              {daysUntilTrip >= 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeNum}>{daysUntilTrip}</Text>
                  <Text style={styles.countBadgeLabel}>{daysUntilTrip === 1 ? 'يوم' : 'أيام'}</Text>
                </View>
              ) : null}
              <View style={styles.nextTripIn}>
                <Text style={styles.nextTripLbl}>رحلتك الجاية</Text>
                <Text style={styles.nextTripTitle}>{nextTrip.title}</Text>
                <View style={styles.glassRow}>
                  <View style={styles.glassChip}>
                    <Ionicons name="calendar-outline" size={12} color="#fff" />
                    <Text style={styles.glassChipText}>{formatTripDateRange(nextTrip.startDate, nextTrip.endDate)}</Text>
                  </View>
                  {checklistTotal > 0 ? (
                    <View style={styles.glassChip}>
                      <Ionicons name="checkbox-outline" size={12} color="#fff" />
                      <Text style={styles.glassChipText}>التجهيز {checklistDone} من {checklistTotal}</Text>
                    </View>
                  ) : null}
                  {tripBudgetSpent > 0 ? (
                    <View style={styles.glassChip}>
                      <Ionicons name="wallet-outline" size={12} color="#fff" />
                      <Text style={styles.glassChipText}>
                        {tripBudgetSpent.toLocaleString()} / {nextTrip.budgetTotal.toLocaleString()} ﷼
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </DesertHero>
          </TouchableOpacity>
        ) : (
          <View style={styles.nextTripWrap}>
            <DesertHero dark style={styles.nextTripBg}>
              <View style={styles.nextTripIn}>
                <Text style={styles.nextTripTitle}>رفيقك في كل رحلة</Text>
                <TouchableOpacity
                  style={styles.planTripBtn}
                  activeOpacity={0.85}
                  onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
                >
                  <Ionicons name="add" size={14} color="#141a2b" />
                  <Text style={styles.planTripBtnText}>خطط رحلتك الأولى</Text>
                </TouchableOpacity>
              </View>
            </DesertHero>
          </View>
        )}

        <View style={styles.askCard}>
          <View style={styles.askTop}>
            <View style={styles.askIcon}>
              <Ionicons name="compass-outline" size={18} color={colors.textOnPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.askTitle}>دليل السفر</Text>
              <Text style={styles.askSubtitle}>اسأله عن أي وجهة، يخطط لك في ثواني</Text>
            </View>
          </View>
          <View style={styles.askIn}>
            <TextInput
              style={styles.askInput}
              placeholder="وين تحب تسافر؟ أو أي شهر يناسبك؟"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => askGuide()}
              textAlign="right"
            />
            <TouchableOpacity style={styles.askGo} activeOpacity={0.8} onPress={() => askGuide()}>
              <Ionicons name="send" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggRow}>
            {GUIDE_SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggChip} activeOpacity={0.8} onPress={() => askGuide(s)}>
                <Text style={styles.suggChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.qact}>
          <TouchableOpacity
            style={styles.qactItem}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
          >
            <View style={styles.qactIcon}><Ionicons name="add" size={22} color={colors.primary} /></View>
            <Text style={styles.qactText}>خطط رحلة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qactItem}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Discover' })}
          >
            <View style={styles.qactIcon}><Ionicons name="search" size={20} color={colors.primary} /></View>
            <Text style={styles.qactText}>اكتشف</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qactItem}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('JoinTrip'))}
          >
            <View style={styles.qactIcon}><Ionicons name="key-outline" size={20} color={colors.primary} /></View>
            <Text style={styles.qactText}>رمز دعوة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qactItem}
            activeOpacity={0.85}
            onPress={() => requireAccount('checkIn', () => navigation.navigate('CheckInSearch'))}
          >
            <View style={styles.qactIcon}><Ionicons name="location-outline" size={20} color={colors.primary} /></View>
            <Text style={styles.qactText}>سجّل وصول</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="لفتات الموسم" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          {seasonalHighlights.map((highlight) => (
            <TouchableOpacity
              key={highlight.id}
              style={styles.storyItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('DestinationDetail', { destinationId: highlight.destinationId })}
            >
              <LinearGradient
                colors={[highlight.color, colors.accent, highlight.color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyAvatar}>
                  <Text style={styles.storyEmoji}>{highlight.emoji}</Text>
                </View>
              </LinearGradient>
              <Text style={styles.storyLabel} numberOfLines={2}>{highlight.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SectionHeader
          title={`أفضل الوجهات في ${MONTH_NAMES[currentMonth - 1]}`}
          actionLabel="اسأل الدليل"
          onActionPress={() => navigation.navigate('GuideChat')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationsRow}>
          {monthlyDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
            />
          ))}
        </ScrollView>

        {profile && followingIds.length > 0 ? (
          <>
            <SectionHeader title="من مجتمعك" />
            {feed.length === 0 ? (
              <Text style={styles.emptyMuted}>ما فيه مدونات جديدة من اللي تتابعهم حالياً</Text>
            ) : (
              feed.map(({ post, author }) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.feedCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('UserProfile', { userId: author.id })}
                >
                  <View style={styles.feedWho}>
                    <PersonAvatar avatarUrl={author.avatarUrl} size={28} />
                    <View>
                      <Text style={styles.feedAuthor}>{author.name}</Text>
                      <Text style={styles.feedWhen}>كتب مدونة</Text>
                    </View>
                  </View>
                  <Image source={{ uri: post.imageUrl }} style={styles.feedImage} />
                  {post.caption ? <Text style={styles.feedCaption} numberOfLines={2}>{post.caption}</Text> : null}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : null}

        <SectionHeader title="كل الوجهات" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestChipsRow}>
          <FilterChip label="الكل" active={!activeInterest} onPress={() => setActiveInterest(null)} />
          {INTEREST_TAGS.map((tag) => (
            <FilterChip key={tag} label={tag} active={activeInterest === tag} onPress={() => setActiveInterest(tag)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationsRow}>
          {filteredAllDestinations.length === 0 ? (
            <Text style={styles.emptyMuted}>ما فيه وجهات بهذا التصنيف حاليًا</Text>
          ) : (
            filteredAllDestinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
              />
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.banner}
          activeOpacity={0.85}
          onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>خطط رحلتك مع أصدقائك</Text>
            <Text style={styles.bannerSubtitle}>ميزانية، جدول، ومحادثة جماعية بمكان واحد</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },
  offlineBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  offlineText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  returnBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  returnBannerText: { flex: 1, color: colors.accentDark, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  apphead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  hi: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  hiGreeting: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
  hiName: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  nextTripWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  nextTripBg: { height: 190, borderRadius: radius.xl },
  countBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  countBadgeNum: { color: '#141a2b', fontSize: 20, fontWeight: '700' },
  countBadgeLabel: { color: '#6b7389', fontSize: 10 },
  nextTripIn: { position: 'absolute', bottom: spacing.md, right: spacing.lg, left: spacing.lg, gap: spacing.xs },
  nextTripLbl: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', textAlign: 'right' },
  nextTripTitle: { color: '#fff', fontSize: 19, fontWeight: '700', textAlign: 'right' },
  glassRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  glassChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  glassChipText: { color: '#fff', fontSize: 10.5, fontWeight: '600' },
  planTripBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  planTripBtnText: { color: '#141a2b', fontSize: 12, fontWeight: '700' },
  askCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  askTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  askIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  askSubtitle: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
  askIn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  askInput: { flex: 1, color: colors.text, fontSize: 13 },
  askGo: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggRow: { flexDirection: 'row-reverse', gap: spacing.xs },
  suggChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  suggChipText: { color: colors.text, fontSize: 11 },
  qact: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  qactItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  qactIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qactText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  storiesRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.xl },
  storyItem: { alignItems: 'center', width: 68, gap: 4 },
  storyRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', padding: 2.5 },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyEmoji: { fontSize: 24 },
  storyLabel: { color: colors.text, fontSize: 10.5, fontWeight: '600', textAlign: 'center' },
  destinationsRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  interestChipsRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  emptyMuted: { color: colors.textFaint, fontSize: 12, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  feedCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  feedWho: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  feedAuthor: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  feedWhen: { color: colors.textMuted, fontSize: 10.5, textAlign: 'right' },
  feedImage: { width: '100%', height: 160, borderRadius: radius.md },
  feedCaption: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  bannerSubtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
});

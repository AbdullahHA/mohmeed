import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import FeedbackCard from '../components/FeedbackCard';
import FilterChip from '../components/FilterChip';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { BUDGET_CATEGORY_LABELS } from '../types';
import { INTEREST_TAGS } from '../data/destinations';
import type { RootStackParamList } from '../navigation/types';

const APPEARANCE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'تلقائي' },
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STAMP_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatStampDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${STAMP_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentUser,
    friends,
    trips,
    feedback,
    setFeedback,
    visitedStamps,
    recommendedPlaceIds,
    airlineReviews,
    removeAirlineReview,
    tripTemplates,
  } = useAppState();
  const { destinations, places } = useContent();
  const { profile, signOut, exitGuestMode, updateInterests } = useAuth();
  const { requireAccount } = useRequireAccount();

  const toggleInterest = (tag: string) => {
    requireAccount('interests', () => {
      if (!profile) return;
      const next = profile.interests.includes(tag)
        ? profile.interests.filter((t) => t !== tag)
        : [...profile.interests, tag];
      updateInterests(next);
    });
  };

  const visitedDestinations = visitedStamps
    .map((stamp) => {
      const destination = destinations.find((d) => d.id === stamp.destinationId);
      return destination ? { destination, visitedAt: stamp.visitedAt } : null;
    })
    .filter((entry): entry is { destination: (typeof destinations)[number]; visitedAt: number } => Boolean(entry));

  const recommendedPlaces = places.filter((p) => recommendedPlaceIds.includes(p.id));
  const recommendedByCity = destinations
    .map((destination) => ({
      destination,
      places: recommendedPlaces.filter((p) => p.destinationId === destination.id),
    }))
    .filter((group) => group.places.length > 0);

  const myTemplates = tripTemplates.filter((t) => t.isMine);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: currentUser.color }]}>
            <Text style={styles.avatarEmoji}>{currentUser.emoji}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>رحلات</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{visitedDestinations.length}</Text>
              <Text style={styles.statLabel}>أماكن زرتها</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friends.length}</Text>
              <Text style={styles.statLabel}>أصدقاء</Text>
            </View>
          </View>
        </View>

        {!profile ? (
          <TouchableOpacity
            style={styles.guestBanner}
            activeOpacity={0.8}
            onPress={() => exitGuestMode()}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.guestBannerText}>
              أنت تتصفح كضيف — سجّل دخول أو أنشئ حساب عشان تضيف أصدقاء وتحفظ بياناتك
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>اهتماماتي</Text>
        </View>
        <View style={styles.interestsRow}>
          {INTEREST_TAGS.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              active={Boolean(profile?.interests.includes(tag))}
              onPress={() => toggleInterest(tag)}
            />
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>جواز رحلاتي</Text>
        </View>
        {visitedDestinations.length === 0 ? (
          <Text style={styles.emptyMuted}>
            ما سجلت أي مكان بعد — افتح أي وجهة واضغط "أضفها لأماكن زرتها" عشان تبدأ جوازك
          </Text>
        ) : (
          <View style={styles.stampsGrid}>
            {visitedDestinations.map(({ destination, visitedAt }) => (
              <TouchableOpacity
                key={destination.id}
                style={styles.stampWrap}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
              >
                <View style={styles.stamp}>
                  <Image source={destination.image} style={styles.stampImage} />
                  <View style={styles.stampOverlay} />
                  <View style={styles.stampSeal}>
                    <Ionicons name="ribbon" size={14} color={colors.textOnPrimary} />
                  </View>
                  <Text style={styles.stampName}>{destination.name}</Text>
                </View>
                <Text style={styles.stampDate}>{formatStampDate(visitedAt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>رحلاتي</Text>
        </View>
        {trips.length === 0 ? (
          <Text style={styles.emptyMuted}>لا توجد رحلات بعد</Text>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
              <View style={styles.tripTextWrap}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <Text style={styles.tripSubtitle}>{trip.startDate} → {trip.endDate}</Text>
              </View>
              <Ionicons name="airplane-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>قوالب رحلاتي</Text>
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TripTemplates')}
          >
            <Text style={styles.linkButtonText}>تصفح كل القوالب</Text>
            <Ionicons name="chevron-back" size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {myTemplates.length === 0 ? (
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.85}
            onPress={() => requireAccount('template', () => navigation.navigate('CreateTripTemplate'))}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.ctaCardText}>أنشئ قالب رحلة كامل وشاركه مع الآخرين</Text>
          </TouchableOpacity>
        ) : (
          myTemplates.map((template) => {
            const destination = destinations.find((d) => d.id === template.destinationId);
            return (
              <TouchableOpacity
                key={template.id}
                style={styles.tripRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TripTemplateDetail', { templateId: template.id })}
              >
                <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                <View style={styles.tripTextWrap}>
                  <Text style={styles.tripTitle}>{template.title}</Text>
                  <Text style={styles.tripSubtitle}>
                    {destination?.name} · {template.price === 0 ? 'مجاني' : `${template.price} ر.س`}
                  </Text>
                </View>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>توصياتي</Text>
        </View>
        {recommendedByCity.length === 0 ? (
          <Text style={styles.emptyMuted}>
            ما ضفت توصيات بعد — اضغط على أيقونة القلب بأي مكان من "اكتشف" عشان تضيفه هنا
          </Text>
        ) : (
          recommendedByCity.map((group) => (
            <View key={group.destination.id} style={styles.recommendGroup}>
              <Text style={styles.recommendCity}>{group.destination.name}</Text>
              {group.places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.recommendRow}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                >
                  <Ionicons name="heart" size={14} color={colors.accent} />
                  <Text style={styles.recommendName}>{place.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>تجاربي بالطيران</Text>
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('review', () => navigation.navigate('AddAirlineReview'))}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={styles.linkButtonText}>أضف تجربة</Text>
          </TouchableOpacity>
        </View>
        {airlineReviews.length === 0 ? (
          <Text style={styles.emptyMuted}>ما سجلت أي تجربة طيران بعد</Text>
        ) : (
          airlineReviews.map((review) => (
            <View key={review.id} style={styles.airlineRow}>
              <TouchableOpacity onPress={() => removeAirlineReview(review.id)} activeOpacity={0.7}>
                <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
              </TouchableOpacity>
              <View style={styles.airlineTextWrap}>
                <Text style={styles.airlineRoute}>{review.fromCity} → {review.toCity}</Text>
                <Text style={styles.airlineName}>{review.airline}</Text>
                {review.note ? <Text style={styles.airlineNote}>{review.note}</Text> : null}
              </View>
              <View style={styles.airlineRating}>
                <Ionicons name="star" size={13} color={colors.accent} />
                <Text style={styles.airlineRatingText}>{review.rating}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>أصدقائي</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('friend', () => navigation.navigate('AddFriend'))}
          >
            <Ionicons name="person-add-outline" size={14} color={colors.textOnPrimary} />
            <Text style={styles.addFriendText}>إضافة صديق</Text>
          </TouchableOpacity>
        </View>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendRow}>
            <Text style={styles.friendUsername}>@{friend.username}</Text>
            <View style={styles.friendTextWrap}>
              <Text style={styles.friendName}>{friend.name}</Text>
            </View>
            <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}>
              <Text style={styles.friendEmoji}>{friend.emoji}</Text>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>المظهر</Text>
        </View>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.appearanceChip, active && styles.appearanceChipActive]}
                activeOpacity={0.85}
                onPress={() => setMode(option.value)}
              >
                <Text style={[styles.appearanceChipText, active && styles.appearanceChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FeedbackCard feedback={feedback} onSubmit={setFeedback} />

        {profile?.isAdmin ? (
          <TouchableOpacity
            style={styles.adminLink}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Ionicons name="shield-outline" size={14} color={colors.textFaint} />
            <Text style={styles.adminLinkText}>لوحة التحكم</Text>
          </TouchableOpacity>
        ) : null}

        {profile ? (
          <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={() => signOut()}>
            <Text style={styles.signOutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const STAMP_SIZE = '31%';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  guestBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  guestBannerText: { flex: 1, color: colors.text, fontSize: 12, textAlign: 'right', lineHeight: 18 },
  adminLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  adminLinkText: { color: colors.textFaint, fontSize: 12, fontWeight: '600' },
  signOutButton: {
    backgroundColor: '#1C1C22',
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signOutText: { color: colors.red, fontSize: 14, fontWeight: '700' },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120, paddingHorizontal: spacing.lg },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarEmoji: { fontSize: 30 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  username: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statValue: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  interestsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyMuted: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.md,
    lineHeight: 18,
  },
  linkButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  linkButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  ctaCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  ctaCardText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  stampsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
    marginBottom: spacing.lg,
  },
  stampWrap: {
    width: STAMP_SIZE,
  },
  stamp: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.xs,
  },
  stampImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  stampOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  stampSeal: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampName: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  stampDate: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  addFriendButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addFriendText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700' },
  tripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tripTextWrap: { flex: 1 },
  tripTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  tripSubtitle: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2 },
  recommendGroup: { marginBottom: spacing.md },
  recommendCity: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xs },
  recommendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  recommendName: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  airlineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  airlineTextWrap: { flex: 1 },
  airlineRoute: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  airlineName: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 1 },
  airlineNote: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2 },
  airlineRating: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  airlineRatingText: { color: colors.accentDark, fontSize: 12, fontWeight: '700' },
  friendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  friendAvatar: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  friendEmoji: { fontSize: 16 },
  friendTextWrap: { flex: 1 },
  friendName: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  friendUsername: { color: colors.textFaint, fontSize: 11 },
  appearanceRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  appearanceChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  appearanceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  appearanceChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  appearanceChipTextActive: {
    color: colors.textOnPrimary,
  },
});

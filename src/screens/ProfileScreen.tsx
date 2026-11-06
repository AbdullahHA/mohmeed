import React, { useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import Text from '../components/Text';
import RtlScrollRow from '../components/RtlScrollRow';
import { Alert } from '../lib/alert';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DesertHero from '../components/DesertHero';
import CircularProgress from '../components/CircularProgress';
import FeedbackCard from '../components/FeedbackCard';
import PersonAvatar from '../components/PersonAvatar';
import { radius, spacing, fixedColors, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { computeXp, computeTravelerLevel, nextLevelThreshold } from '../utils/travelerStats';
import { pickAndUploadCoverPhoto } from '../lib/coverPhoto';
import { formatTripDate, formatTripDateRange } from '../lib/tripDates';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STAMP_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatStampDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${STAMP_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

const WORLD_COUNTRIES = 195;

type ProfileTab = 'trips' | 'posts' | 'reviews' | 'saved';

const PROFILE_TABS: { key: ProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'trips', label: 'رحلاتي', icon: 'briefcase-outline' },
  { key: 'posts', label: 'مدوناتي', icon: 'book-outline' },
  { key: 'reviews', label: 'تقييماتي', icon: 'star-outline' },
  { key: 'saved', label: 'محفوظاتي', icon: 'location-outline' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [tabsSectionY, setTabsSectionY] = useState(0);
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('trips');

  const handleCopyUsername = async () => {
    await Clipboard.setStringAsync(currentUser.username);
    setUsernameCopied(true);
    setTimeout(() => setUsernameCopied(false), 1500);
  };
  const {
    currentUser,
    friends,
    trips,
    feedback,
    setFeedback,
    visitedStamps,
    recommendedPlaceIds,
    favoriteDestinationIds,
    toggleFavoriteDestination,
    wishlist,
    removeWishlistItem,
    manualVisitedPlaces,
    removeManualVisitedPlace,
    tripTemplates,
    followersCount,
    followingCount,
    myPosts,
    myPostsLoading,
    removeTravelPost,
    meetupMatches,
  } = useAppState();
  const { destinations, places } = useContent();
  const { profile, session, signOut, exitGuestMode, updateProfile } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [coverUploading, setCoverUploading] = useState(false);

  const handlePickCover = async () => {
    if (!profile || coverUploading) return;
    setCoverUploading(true);
    try {
      const url = await pickAndUploadCoverPhoto(profile.id);
      if (url) await updateProfile({ cover_url: url });
    } catch {
      Alert.alert('تعذّر رفع صورة الغلاف', 'حاول مرة ثانية.');
    } finally {
      setCoverUploading(false);
    }
  };

  const visitedDestinations = visitedStamps
    .map((stamp) => {
      const destination = destinations.find((d) => d.id === stamp.destinationId);
      return destination ? { destination, visitedAt: stamp.visitedAt } : null;
    })
    .filter((entry): entry is { destination: (typeof destinations)[number]; visitedAt: number } => Boolean(entry));

  const favoriteDestinations = destinations.filter((d) => favoriteDestinationIds.includes(d.id));

  const recommendedPlaces = places.filter((p) => recommendedPlaceIds.includes(p.id));
  const recommendedByCity = destinations
    .map((destination) => ({
      destination,
      places: recommendedPlaces.filter((p) => p.destinationId === destination.id),
    }))
    .filter((group) => group.places.length > 0);

  const myTemplates = tripTemplates.filter((t) => t.isMine);

  // Real countries only (destinations tagged with a country) — never a made-up figure.
  const countriesVisited = useMemo(() => {
    const set = new Set(visitedDestinations.map((v) => v.destination.country).filter(Boolean));
    return set.size;
  }, [visitedDestinations]);
  const worldPercent = Math.round((countriesVisited / WORLD_COUNTRIES) * 100);

  // XP = رحلة +100، دولة جديدة +150، مدونة +80، تقييم +20 (SPEC §18) — summed
  // from real counts only.
  const xp = computeXp({
    tripsCount: trips.length,
    countriesCount: countriesVisited,
    postsCount: myPosts.length,
    reviewsCount: recommendedPlaces.length,
  });
  const travelerLevel = computeTravelerLevel(xp);
  const nextLevel = nextLevelThreshold(xp);
  const levelProgress = nextLevel ? Math.min(1, xp / (xp + nextLevel.remaining)) : 1;

  // "خبير محلي": ≥10 ratings or ≥3 posts about the same city (SPEC §18).
  const localExpertCity = useMemo(() => {
    const byRatings = recommendedByCity.find((g) => g.places.length >= 10);
    if (byRatings) return byRatings.destination.name;
    const postCounts = new Map<string, number>();
    myPosts.forEach((p) => {
      if (p.destinationId) postCounts.set(p.destinationId, (postCounts.get(p.destinationId) ?? 0) + 1);
    });
    for (const [destId, count] of postCounts) {
      if (count >= 3) {
        const d = destinations.find((x) => x.id === destId);
        if (d) return d.name;
      }
    }
    return null;
  }, [recommendedByCity, myPosts, destinations]);

  const memberSinceYear = session ? new Date(session.user.created_at).getFullYear() : null;

  const handleShare = () => {
    Share.share({ message: `تابعني على يلا نسافر: @${currentUser.username}` }).catch(() => {});
  };

  type CombinedStamp = {
    id: string;
    name: string;
    dateLabel: string;
    image?: (typeof visitedDestinations)[number]['destination']['image'];
    color: string;
    onPress?: () => void;
    onLongPress?: () => void;
  };

  const combinedStamps: CombinedStamp[] = [
    ...visitedDestinations.map((entry, index) => ({
      id: `d-${entry.destination.id}`,
      name: entry.destination.name,
      dateLabel: formatStampDate(entry.visitedAt),
      image: entry.destination.image,
      color: fixedColors.stamps[index % fixedColors.stamps.length],
      onPress: () => navigation.navigate('DestinationDetail', { destinationId: entry.destination.id }),
    })),
    ...manualVisitedPlaces.map((place, index) => ({
      id: `m-${place.id}`,
      name: place.name,
      dateLabel: formatStampDate(place.visitedAt),
      color: fixedColors.stamps[(visitedDestinations.length + index) % fixedColors.stamps.length],
      onLongPress: () =>
        Alert.alert('حذف الختم؟', `بيُحذف "${place.name}" من أختامك.`, [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: () => removeManualVisitedPlace(place.id) },
        ]),
    })),
  ];

  const now = Date.now();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DesertHero style={styles.cover} imageUri={profile?.coverUrl} dark={!!profile?.coverUrl}>
          {profile ? (
            <TouchableOpacity
              style={styles.editHeroButton}
              activeOpacity={0.8}
              onPress={handlePickCover}
              disabled={coverUploading}
            >
              <Ionicons name={coverUploading ? 'hourglass-outline' : 'camera-outline'} size={16} color="#fff" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </DesertHero>

        <View style={styles.idBlock}>
          <View style={styles.idHead}>
            <LinearGradient
              colors={['#f0a35c', '#e0527d', '#6a5cf0', '#2a9bb0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <PersonAvatar avatarUrl={currentUser.avatarUrl} size={80} style={styles.avatarInner} />
            </LinearGradient>
            {profile ? (
              <View style={styles.levelPill}>
                <Ionicons name="trophy-outline" size={13} color={colors.accentDark} />
                <Text style={styles.levelPillText}>{travelerLevel.label}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.name}>{currentUser.name}</Text>
          <TouchableOpacity style={styles.usernameRow} activeOpacity={0.6} onPress={handleCopyUsername}>
            <Text style={styles.username}>@{currentUser.username}</Text>
            <Ionicons name="copy-outline" size={13} color={colors.textFaint} />
          </TouchableOpacity>
          {usernameCopied ? (
            <View style={styles.copyToast}>
              <Text style={styles.copyToastText}>تم نسخ اسم المستخدم</Text>
            </View>
          ) : null}

          {(localExpertCity || (profile?.interests.length ?? 0) > 0) && (
            <View style={styles.chipsRow}>
              {localExpertCity ? (
                <View style={[styles.chip, styles.chipGold]}>
                  <Ionicons name="ribbon-outline" size={12} color={colors.accentDark} />
                  <Text style={styles.chipGoldText}>خبير محلي · {localExpertCity}</Text>
                </View>
              ) : null}
              {profile?.interests.slice(0, 2).map((tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {profile?.bio ? <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text> : null}

          <View style={styles.metaRow}>
            {profile?.countryOfResidence ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{profile.countryOfResidence}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="globe-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>عربي</Text>
            </View>
            {memberSinceYear ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>عضو منذ {memberSinceYear}</Text>
              </View>
            ) : null}
          </View>

          {profile ? (
            <View style={styles.statsCard}>
              <TouchableOpacity
                style={styles.statCell}
                activeOpacity={0.7}
                onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              >
                <Text style={styles.statValue}>{countriesVisited}</Text>
                <Text style={styles.statLabel}>دولة</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statCell}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Trips' })}
              >
                <Text style={styles.statValue}>{trips.length}</Text>
                <Text style={styles.statLabel}>رحلة</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statCell}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FollowList', { userId: profile.id, mode: 'followers' })}
              >
                <Text style={styles.statValue}>{followersCount}</Text>
                <Text style={styles.statLabel}>متابع</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statCell}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FollowList', { userId: profile.id, mode: 'following' })}
              >
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>يتابع</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {profile ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.textOnPrimary} />
                <Text style={styles.btnPrimaryText}>تعديل الملف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} activeOpacity={0.85} onPress={handleShare}>
                <Ionicons name="share-outline" size={14} color={colors.text} />
                <Text style={styles.btnGhostText}>مشاركة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost, styles.btnIconOnly]}
                activeOpacity={0.85}
                onPress={() => requireAccount('friend', () => navigation.navigate('AddFriend'))}
              >
                <Ionicons name="person-add-outline" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.guestBanner} activeOpacity={0.8} onPress={() => exitGuestMode()}>
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.guestBannerText}>
                أنت تتصفح كضيف — سجّل دخول أو أنشئ حساب عشان تضيف أصدقاء وتحفظ بياناتك
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {combinedStamps.length > 0 ? (
          <RtlScrollRow contentContainerStyle={styles.highlights}>
            <TouchableOpacity
              style={styles.highlightItem}
              activeOpacity={0.8}
              onPress={() => requireAccount('visitedPlace', () => navigation.navigate('AddVisitedPlace'))}
            >
              <View style={styles.highlightAdd}>
                <Ionicons name="add" size={22} color={colors.textMuted} />
              </View>
              <Text style={styles.highlightLabel}>جديد</Text>
            </TouchableOpacity>
            {visitedDestinations.map((entry) => (
              <TouchableOpacity
                key={entry.destination.id}
                style={styles.highlightItem}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DestinationDetail', { destinationId: entry.destination.id })}
              >
                <Image source={entry.destination.image} style={styles.highlightImage} />
                <Text style={styles.highlightLabel} numberOfLines={1}>{entry.destination.name}</Text>
              </TouchableOpacity>
            ))}
          </RtlScrollRow>
        ) : null}

        <TouchableOpacity style={styles.passportCard} activeOpacity={0.9} onPress={() => navigation.navigate('Passport')}>
          <CircularProgress size={66} strokeWidth={6} progress={worldPercent / 100} color={colors.accent} trackColor="rgba(255,255,255,0.18)">
            <Text style={styles.ringPercent}>{worldPercent}%</Text>
            <Text style={styles.ringCaption}>من العالم</Text>
          </CircularProgress>
          <View style={styles.passportTextWrap}>
            <Text style={styles.passportKicker}>YALLA NSAFER · PASSPORT</Text>
            <Text style={styles.passportTitle}>جواز رحلاتي</Text>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
            </View>
            <Text style={styles.passportCaption}>
              {nextLevel
                ? `باقي ${nextLevel.remaining} نقطة عشان تصير "${nextLevel.label}"`
                : 'وصلت لأعلى مستوى 🏆'}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.8)" style={styles.passportGo} />
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity style={styles.linkButton} activeOpacity={0.85} onPress={() => navigation.navigate('Passport')}>
            <Text style={styles.linkButtonText}>الكل ({combinedStamps.length})</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>أختامي</Text>
        </View>
        {combinedStamps.length === 0 ? (
          <Text style={styles.emptyMuted}>
            ما سجلت أي مكان بعد — افتح أي وجهة واضغط "أضفها لأماكن زرتها" أو أضف ختم يدوي عشان يبدأ جوازك
          </Text>
        ) : (
          <View style={styles.stampGrid}>
            {combinedStamps.slice(0, 3).map((stamp) => (
              <TouchableOpacity
                key={stamp.id}
                style={styles.stampCell}
                activeOpacity={0.85}
                onPress={stamp.onPress}
                onLongPress={stamp.onLongPress}
              >
                <View style={[styles.stampRing, { borderColor: stamp.color }]}>
                  {stamp.image ? (
                    <Image source={stamp.image} style={styles.stampImage} />
                  ) : (
                    <Ionicons name="location" size={18} color={stamp.color} />
                  )}
                </View>
                <Text style={styles.stampName} numberOfLines={1}>{stamp.name}</Text>
                <Text style={styles.stampDate}>{stamp.dateLabel}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.stampCell}
              activeOpacity={0.85}
              onPress={() => requireAccount('visitedPlace', () => navigation.navigate('AddVisitedPlace'))}
            >
              <View style={[styles.stampRing, styles.stampRingAdd]}>
                <Ionicons name="add" size={20} color={colors.textMuted} />
              </View>
              <Text style={styles.stampName} numberOfLines={1}>ختم جديد</Text>
            </TouchableOpacity>
          </View>
        )}

        {meetupMatches.length > 0 ? (
          <TouchableOpacity
            style={styles.meetupCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('UserProfile', { userId: meetupMatches[0].user.id })}
          >
            <View style={styles.meetupRow}>
              <View style={styles.meetupIcon}>
                <Ionicons name="airplane" size={16} color={colors.textOnPrimary} />
              </View>
              <View style={styles.meetupTextWrap}>
                <Text style={styles.meetupTitle}>
                  رايح {destinations.find((d) => d.id === meetupMatches[0].destinationId)?.name ?? 'نفس الوجهة'}{' '}
                  {meetupMatches[0].theirTrip.startDate ? formatTripDate(meetupMatches[0].theirTrip.startDate) : ''}
                </Text>
                <Text style={styles.meetupSubtitle}>
                  {meetupMatches.length} {meetupMatches.length === 1 ? 'شخص تتابعه بيكون هناك بنفس الأيام' : 'من اللي تتابعهم بيكونون هناك بنفس الأيام'}
                </Text>
              </View>
            </View>
            <View style={styles.meetupBottomRow}>
              <Text style={styles.meetupGo}>نلتقي؟</Text>
              <Ionicons name="chevron-back" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.ltabs} onLayout={(e) => setTabsSectionY(e.nativeEvent.layout.y)}>
          {PROFILE_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.ltab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={17} color={active ? colors.text : colors.textMuted} />
                <Text style={[styles.ltabText, active && styles.ltabTextActive]}>{tab.label}</Text>
                <View style={[styles.ltabIndicator, active && styles.ltabIndicatorActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'trips' && (
          <>
            {trips.length === 0 ? (
              <Text style={styles.emptyMuted}>لا توجد رحلات بعد</Text>
            ) : (
              trips.map((trip) => {
                const ended = new Date(trip.endDate).getTime() < now;
                const daysUntil = Math.ceil((new Date(trip.startDate).getTime() - now) / 86400000);
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.upcomingCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
                  >
                    <View style={styles.upcomingThumb}>
                      <Ionicons name="airplane-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.upcomingBody}>
                      <Text style={styles.upcomingTitle} numberOfLines={1}>{trip.title}</Text>
                      <Text style={styles.upcomingDates}>
                        {trip.startDate && trip.startDate !== '—' ? formatTripDateRange(trip.startDate, trip.endDate) : 'بدون تاريخ'}
                      </Text>
                      {ended ? (
                        <View style={styles.upcomingChip}>
                          <Ionicons name="create-outline" size={11} color={colors.primary} />
                          <Text style={styles.upcomingChipText}>اكتب عنها مدونة</Text>
                        </View>
                      ) : daysUntil >= 0 ? (
                        <View style={styles.upcomingCount}>
                          <Ionicons name="time-outline" size={11} color={colors.successDark} />
                          <Text style={styles.upcomingCountText}>
                            {daysUntil === 0 ? 'تبدأ اليوم' : `بعد ${daysUntil} ${daysUntil === 1 ? 'يوم' : 'أيام'}`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
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
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripTitle}>{template.title}</Text>
                      <Text style={styles.tripSubtitle}>
                        {destination?.name} · {template.days} أيام
                      </Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {activeTab === 'posts' && profile && (
          <>
            <View style={styles.sectionHeaderRow}>
              <TouchableOpacity
                style={styles.linkButton}
                activeOpacity={0.85}
                onPress={() => requireAccount('travelPost', () => navigation.navigate('AddTravelPost'))}
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.linkButtonText}>أضف مدونة</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>مدوناتي</Text>
            </View>
            {myPostsLoading ? null : myPosts.length === 0 ? (
              <Text style={styles.emptyMuted}>شارك صور رحلاتك مع متابعينك — أول مدونة توصلك هنا</Text>
            ) : (
              <View style={styles.postsGrid}>
                {myPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postTile}
                    activeOpacity={0.85}
                    onLongPress={() =>
                      Alert.alert('حذف المدونة؟', 'بتُحذف هذي الصورة من مدوناتك نهائيًا.', [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => removeTravelPost(post.id) },
                      ])
                    }
                  >
                    <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <>
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
          </>
        )}

        {activeTab === 'saved' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>وجهاتي المفضلة</Text>
              <TouchableOpacity
                style={styles.linkButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('FavoriteDestinations')}
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.linkButtonText}>أضف</Text>
              </TouchableOpacity>
            </View>
            {favoriteDestinations.length === 0 ? (
              <Text style={styles.emptyMuted}>
                ما ضفت وجهات مفضلة بعد — اضغط على "أضف" أو على أيقونة القلب بصفحة أي وجهة
              </Text>
            ) : (
              <View style={styles.favoriteDestRow}>
                {favoriteDestinations.map((destination) => (
                  <TouchableOpacity
                    key={destination.id}
                    style={styles.favoriteDestChip}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
                  >
                    <Ionicons name="heart" size={14} color={colors.accent} />
                    <Text style={styles.favoriteDestText}>{destination.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>قائمة أمنياتي</Text>
              <TouchableOpacity
                style={styles.linkButton}
                activeOpacity={0.85}
                onPress={() => requireAccount('wishlist', () => navigation.navigate('AddWishlistItem'))}
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.linkButtonText}>أضف</Text>
              </TouchableOpacity>
            </View>
            {wishlist.length === 0 ? (
              <Text style={styles.emptyMuted}>
                ما ضفت أي دولة أو مدينة تحلم فيها بعد — أضف أي وجهة بالعالم حتى لو مو موجودة بكتالوجنا
              </Text>
            ) : (
              <View style={styles.favoriteDestRow}>
                {wishlist.map((item) => (
                  <View key={item.id} style={styles.favoriteDestChip}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => removeWishlistItem(item.id)}>
                      <Ionicons name="close-circle-outline" size={14} color={colors.textFaint} />
                    </TouchableOpacity>
                    <Text style={styles.favoriteDestText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
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
        {friends.length === 0 ? (
          <Text style={styles.emptyMuted}>ما ضفت أصدقاء بعد</Text>
        ) : (
          <TouchableOpacity
            style={styles.friendsSummaryRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Friends')}
          >
            <View style={styles.friendsAvatarsRow}>
              {friends.slice(0, 5).map((friend) => (
                <PersonAvatar key={friend.id} avatarUrl={friend.avatarUrl} size={32} style={styles.friendsAvatarOverlap} />
              ))}
            </View>
            <Text style={styles.friendsSummaryText}>
              {friends.length} {friends.length === 1 ? 'صديق' : 'أصدقاء'} — شوفهم وراسلهم
            </Text>
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

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
          <TouchableOpacity style={styles.signOutButton} activeOpacity={0.8} onPress={() => signOut()}>
            <Ionicons name="log-out-outline" size={16} color={colors.red} />
            <Text style={styles.signOutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },
  cover: { height: 130 },
  settingsButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeroButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBlock: { paddingHorizontal: spacing.lg, marginTop: -46 },
  idHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  avatarRing: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', padding: 3 },
  avatarInner: { borderWidth: 3, borderColor: colors.background },
  levelPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  levelPillText: { color: colors.accentDark, fontSize: 11.5, fontWeight: '700' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'right', marginTop: spacing.sm },
  usernameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  username: { color: colors.textMuted, fontSize: 13, textAlign: 'right' },
  copyToast: {
    alignSelf: 'flex-end',
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  copyToastText: { color: colors.background, fontSize: 11, fontWeight: '600' },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  chipGold: { backgroundColor: colors.accentSoft },
  chipGoldText: { color: colors.accentDark, fontSize: 11, fontWeight: '700' },
  bio: { color: colors.text, fontSize: 13, textAlign: 'right', lineHeight: 20, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textMuted, fontSize: 11.5 },
  statsCard: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  btnPrimary: { flex: 1, backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: '700' },
  btnGhost: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  btnIconOnly: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 42,
    width: 42,
    paddingHorizontal: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  guestBannerText: { flex: 1, color: colors.text, fontSize: 12, textAlign: 'right', lineHeight: 18 },
  highlights: { flexDirection: 'row-reverse', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  highlightItem: { alignItems: 'center', gap: spacing.xs, width: 64 },
  highlightImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.surface },
  highlightAdd: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  passportCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  passportGo: { transform: [{ rotate: '180deg' }] },
  ringPercent: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ringCaption: { color: 'rgba(255,255,255,0.75)', fontSize: 9 },
  passportTextWrap: { flex: 1, gap: 4 },
  passportKicker: { color: 'rgba(255,255,255,0.6)', fontSize: 9.5, letterSpacing: 1, textAlign: 'right' },
  passportTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  xpTrack: { height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 2 },
  xpFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  passportCaption: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', textAlign: 'right' },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  emptyMuted: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.md,
    lineHeight: 18,
    marginHorizontal: spacing.lg,
  },
  linkButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  linkButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  stampGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stampCell: { width: 72, alignItems: 'center' },
  stampRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  stampRingAdd: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  stampImage: { width: '100%', height: '100%' },
  stampName: { color: colors.text, fontSize: 10.5, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  stampDate: { color: colors.textFaint, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  meetupCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  meetupRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  meetupIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupTextWrap: { flex: 1 },
  meetupTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  meetupSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  meetupBottomRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  meetupGo: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  postsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 2, paddingHorizontal: spacing.lg },
  postTile: { width: '32.5%', aspectRatio: 1 },
  postImage: { width: '100%', height: '100%', borderRadius: radius.sm },
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
    marginHorizontal: spacing.lg,
  },
  ctaCardText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  ltabs: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  ltab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: spacing.sm },
  ltabText: { color: colors.textMuted, fontSize: 11 },
  ltabTextActive: { color: colors.text, fontWeight: '700' },
  ltabIndicator: { height: 2, width: '100%', backgroundColor: 'transparent', marginTop: 2 },
  ltabIndicatorActive: { backgroundColor: colors.primary },
  upcomingCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  upcomingThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingBody: { flex: 1, gap: 3 },
  upcomingTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  upcomingDates: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
  upcomingCount: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  upcomingCountText: { color: colors.successDark, fontSize: 10.5, fontWeight: '700' },
  upcomingChip: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  upcomingChipText: { color: colors.primary, fontSize: 10.5, fontWeight: '700' },
  tripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tripTextWrap: { flex: 1 },
  tripTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  tripSubtitle: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2 },
  recommendGroup: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
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
  favoriteDestRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg },
  favoriteDestChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  favoriteDestText: { color: colors.text, fontSize: 13, fontWeight: '600' },
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
  friendsSummaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
  },
  friendsAvatarsRow: { flexDirection: 'row-reverse' },
  friendsAvatarOverlap: { marginRight: -10, borderWidth: 2, borderColor: colors.surface },
  friendsSummaryText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  signOutText: { color: colors.red, fontSize: 14, fontWeight: '700' },
});

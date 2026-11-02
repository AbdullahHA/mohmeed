import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import FeedbackCard from '../components/FeedbackCard';
import FilterChip from '../components/FilterChip';
import DestinationsMapView from '../components/DestinationsMapView';
import AchievementsRow, { type Achievement } from '../components/AchievementsRow';
import PersonAvatar from '../components/PersonAvatar';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { BUDGET_CATEGORY_LABELS } from '../types';
import { INTEREST_TAGS } from '../data/destinations';
import { haversineDistanceKm } from '../lib/geo';
import { computeTravelerLevel, nextLevelThreshold } from '../utils/travelerStats';
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

// Cycled per stamp so each manually-added place reads as its own
// little passport stamp, without needing a real flag/photo per place.
const STAMP_BADGE_COLORS = ['#1359D3', '#1C9A6C', '#D9792C', '#B4479A', '#2E9BB0', '#C2454B'];

type ProfileTab = 'saved' | 'reviews' | 'posts' | 'trips';

const PROFILE_TABS: { key: ProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'saved', label: 'محفوظاتي', icon: 'bookmark-outline' },
  { key: 'reviews', label: 'تقييماتي', icon: 'star-outline' },
  { key: 'posts', label: 'مدوناتي', icon: 'grid-outline' },
  { key: 'trips', label: 'رحلاتي', icon: 'airplane-outline' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [passportSectionY, setPassportSectionY] = useState(0);
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
    incomingRequests,
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

  const visitedWithCoords = visitedDestinations
    .filter(
      (entry): entry is { destination: typeof entry.destination & { latitude: number; longitude: number }; visitedAt: number } =>
        typeof entry.destination.latitude === 'number' && typeof entry.destination.longitude === 'number'
    )
    .sort((a, b) => a.visitedAt - b.visitedAt);

  const totalDistanceKm = visitedWithCoords.slice(1).reduce((sum, entry, i) => {
    const prev = visitedWithCoords[i].destination;
    return sum + haversineDistanceKm(prev, entry.destination);
  }, 0);

  const favoriteDestinations = destinations.filter((d) => favoriteDestinationIds.includes(d.id));

  const recommendedPlaces = places.filter((p) => recommendedPlaceIds.includes(p.id));
  const recommendedByCity = destinations
    .map((destination) => ({
      destination,
      places: recommendedPlaces.filter((p) => p.destinationId === destination.id),
    }))
    .filter((group) => group.places.length > 0);

  const myTemplates = tripTemplates.filter((t) => t.isMine);

  const stampCount = visitedDestinations.length + manualVisitedPlaces.length;
  const travelerLevel = computeTravelerLevel(stampCount);
  const nextLevel = nextLevelThreshold(stampCount);
  const levelProgress = nextLevel
    ? Math.min(1, stampCount / (stampCount + nextLevel.remaining))
    : 1;

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
      color: STAMP_BADGE_COLORS[index % STAMP_BADGE_COLORS.length],
      onPress: () => navigation.navigate('DestinationDetail', { destinationId: entry.destination.id }),
    })),
    ...manualVisitedPlaces.map((place, index) => ({
      id: `m-${place.id}`,
      name: place.name,
      dateLabel: formatStampDate(place.visitedAt),
      color: STAMP_BADGE_COLORS[(visitedDestinations.length + index) % STAMP_BADGE_COLORS.length],
      onLongPress: () =>
        Alert.alert('حذف الختم؟', `بيُحذف "${place.name}" من أختامك.`, [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: () => removeManualVisitedPlace(place.id) },
        ]),
    })),
  ];

  const achievements: Achievement[] = [
    { id: 'explorer', icon: '🧭', label: 'مستكشف', unlocked: visitedDestinations.length >= 3 },
    { id: 'recommender', icon: '💛', label: 'موصي', unlocked: recommendedPlaces.length >= 1 },
    { id: 'social', icon: '🤝', label: 'اجتماعي', unlocked: friends.length >= 3 },
    { id: 'author', icon: '📝', label: 'كاتب رحلات', unlocked: myTemplates.length >= 1 },
    { id: 'blogger', icon: '📸', label: 'مدوّن سفر', unlocked: myPosts.length >= 1 },
    {
      id: 'complete',
      icon: '⭐',
      label: 'ملف مكتمل',
      unlocked: Boolean(profile?.bio) && (profile?.interests.length ?? 0) >= 1,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[colors.accentDark, colors.accent, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {profile ? (
            <TouchableOpacity
              style={styles.editProfileButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <PersonAvatar avatarUrl={currentUser.avatarUrl} size={76} style={styles.avatarRing} />
          <Text style={styles.name}>{currentUser.name}</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleCopyUsername}>
            <Text style={styles.username}>@{currentUser.username}</Text>
          </TouchableOpacity>
          {usernameCopied ? (
            <View style={styles.copyToast}>
              <Text style={styles.copyToastText}>تم نسخ اسم المستخدم</Text>
            </View>
          ) : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {profile && stampCount > 0 ? (
            <View style={styles.levelBadge}>
              <Ionicons name="compass-outline" size={13} color="#FFFFFF" />
              <Text style={styles.levelBadgeText}>{travelerLevel.label}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Trips' })}
            >
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>رحلات</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => scrollRef.current?.scrollTo({ y: passportSectionY, animated: true })}
            >
              <Text style={styles.statValue}>{visitedDestinations.length}</Text>
              <Text style={styles.statLabel}>أماكن زرتها</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => requireAccount('friend', () => navigation.navigate('Friends'))}
            >
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{friends.length}</Text>
                {incomingRequests.length > 0 ? (
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>{incomingRequests.length}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.statLabel}>أصدقاء</Text>
            </TouchableOpacity>
          </View>

          {profile ? (
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveTab('posts');
                  scrollRef.current?.scrollTo({ y: tabsSectionY, animated: true });
                }}
              >
                <Text style={styles.statValue}>{myPosts.length}</Text>
                <Text style={styles.statLabel}>مدونات</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FollowList', { userId: profile.id, mode: 'followers' })}
              >
                <Text style={styles.statValue}>{followersCount}</Text>
                <Text style={styles.statLabel}>متابعين</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FollowList', { userId: profile.id, mode: 'following' })}
              >
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>يتابع</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </LinearGradient>

        {meetupMatches.length > 0 ? (
          <TouchableOpacity
            style={styles.meetupCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('UserProfile', { userId: meetupMatches[0].user.id })}
          >
            <View style={styles.meetupIcon}>
              <Ionicons name="people" size={18} color={colors.textOnPrimary} />
            </View>
            <View style={styles.meetupTextWrap}>
              <Text style={styles.meetupTitle}>
                أنتم الاثنين رايحين {destinations.find((d) => d.id === meetupMatches[0].destinationId)?.name ?? 'نفس الوجهة'}!
              </Text>
              <Text style={styles.meetupSubtitle}>
                {meetupMatches[0].user.name} بتواريخ قريبة من رحلتك — {meetupMatches[0].theirTrip.startDate} إلى{' '}
                {meetupMatches[0].theirTrip.endDate}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
          </TouchableOpacity>
        ) : null}

        {profile ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>إنجازاتي</Text>
            </View>
            <AchievementsRow achievements={achievements} />
          </>
        ) : null}

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

        <View
          style={styles.passportCard}
          onLayout={(e) => setPassportSectionY(e.nativeEvent.layout.y)}
        >
          <View style={styles.passportCardHeader}>
            <Ionicons name="ribbon-outline" size={16} color={colors.accent} />
            <Text style={styles.passportCardTitle}>جواز رحلاتي</Text>
          </View>
          <Text style={styles.passportLevelText}>{travelerLevel.label}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
          </View>
          <Text style={styles.passportCaption}>
            {nextLevel
              ? `باقي ${nextLevel.remaining} ${nextLevel.remaining === 1 ? 'ختم' : 'أختام'} عشان تصير "${nextLevel.label}"`
              : 'وصلت لأعلى مستوى 🏆'}
          </Text>
          {visitedWithCoords.length > 0 ? (
            <View style={styles.passportMapWrap}>
              <DestinationsMapView
                destinations={visitedWithCoords.map((entry) => entry.destination)}
                onMarkerPress={(destination) =>
                  navigation.navigate('DestinationDetail', { destinationId: destination.id })
                }
              />
              {totalDistanceKm > 0 ? (
                <Text style={styles.distanceCaption}>
                  قطعت تقريبًا {Math.round(totalDistanceKm).toLocaleString()} كم بين الوجهات اللي زرتها
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('visitedPlace', () => navigation.navigate('AddVisitedPlace'))}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={styles.linkButtonText}>أضف ختم</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>أختامي</Text>
        </View>
        {combinedStamps.length === 0 ? (
          <Text style={styles.emptyMuted}>
            ما سجلت أي مكان بعد — افتح أي وجهة واضغط "أضفها لأماكن زرتها" أو أضف ختم يدوي عشان يبدأ جوازك
          </Text>
        ) : (
          <View style={styles.circleStampRow}>
            {combinedStamps.map((stamp) => (
              <TouchableOpacity
                key={stamp.id}
                style={styles.circleStampWrap}
                activeOpacity={0.85}
                onPress={stamp.onPress}
                onLongPress={stamp.onLongPress}
              >
                <View style={[styles.circleStampRing, { borderColor: stamp.color }]}>
                  {stamp.image ? (
                    <Image source={stamp.image} style={styles.circleStampImage} />
                  ) : (
                    <Ionicons name="location" size={20} color={stamp.color} />
                  )}
                </View>
                <Text style={styles.circleStampName} numberOfLines={1}>
                  {stamp.name}
                </Text>
                <Text style={styles.circleStampDate}>{stamp.dateLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.tabsRow} onLayout={(e) => setTabsSectionY(e.nativeEvent.layout.y)}>
          {PROFILE_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, active && styles.tabPillActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={15} color={active ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'saved' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>وجهاتي المفضلة</Text>
            </View>
            {favoriteDestinations.length === 0 ? (
              <Text style={styles.emptyMuted}>
                ما ضفت وجهات مفضلة بعد — اضغط على أيقونة القلب بصفحة أي وجهة عشان تضيفها هنا
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

        {activeTab === 'trips' && (
          <>
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
                  <Ionicons name="airplane-outline" size={18} color={colors.primary} />
                  <View style={styles.tripTextWrap}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <Text style={styles.tripSubtitle}>{trip.startDate} → {trip.endDate}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
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
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripTitle}>{template.title}</Text>
                      <Text style={styles.tripSubtitle}>
                        {destination?.name} · {template.price === 0 ? 'مجاني' : `${template.price} ر.س`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })
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

const CIRCLE_SIZE = 72;

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
  },
  signOutText: { color: colors.red, fontSize: 14, fontWeight: '700' },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120, paddingHorizontal: spacing.lg },
  headerGradient: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  editProfileButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  name: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  username: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  copyToast: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  copyToastText: { color: colors.background, fontSize: 11, fontWeight: '600' },
  bio: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  statsRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: spacing.sm },
  levelBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  levelBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  meetupCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  meetupIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupTextWrap: { flex: 1 },
  meetupTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  meetupSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  postsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  postTile: { width: '32.5%', aspectRatio: 1 },
  postImage: { width: '100%', height: '100%', borderRadius: radius.sm },
  statItem: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  statValueRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: { color: colors.textOnPrimary, fontSize: 9, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
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
  passportCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  passportCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  passportCardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  passportLevelText: { color: colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  passportCaption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  passportMapWrap: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  distanceCaption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  circleStampRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  circleStampWrap: { width: 76, alignItems: 'center' },
  circleStampRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  circleStampImage: { width: '100%', height: '100%' },
  circleStampName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  circleStampDate: { color: colors.textFaint, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  tabPillActive: { backgroundColor: colors.primarySoft },
  tabPillText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  tabPillTextActive: { color: colors.primary },
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
  favoriteDestRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
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
  friendsSummaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  friendsAvatarsRow: { flexDirection: 'row-reverse' },
  friendsAvatarOverlap: {
    marginRight: -10,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  friendsSummaryText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
});

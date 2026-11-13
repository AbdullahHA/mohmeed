import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { PLACE_TYPE_LABELS, type PlaceType } from '../data/places';
import PlaceCard from '../components/PlaceCard';
import PersonAvatar from '../components/PersonAvatar';
import PrayerTimesCard from '../components/PrayerTimesCard';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import { searchGooglePlaces, cacheGooglePlace, getPlacePhotoUrl, type GooglePlaceResult } from '../lib/googlePlaces';
import { fetchWeatherNow, type WeatherNow } from '../lib/weather';
import { estimateFlightMinutes, formatFlightDuration } from '../lib/geo';
import type { RootStackParamList } from '../navigation/types';
import type { CheckInRecord } from '../types';

type Route = RouteProp<RootStackParamList, 'DestinationDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type TypeFilter = 'all' | PlaceType;
type CityTab = 'places' | 'posts';

const TYPE_FILTERS: TypeFilter[] = [
  'all', 'food', 'cafe', 'hotels', 'experiences', 'events', 'nature', 'landmarks', 'shopping',
];

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const MONTH_SHORT = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
const RIYADH_COORDINATE = { latitude: 24.7136, longitude: 46.6753 };

type CityPost = {
  id: string;
  imageUrl: string;
  caption: string;
  authorName: string;
  authorAvatarUrl: string | null;
};

export default function DestinationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentUser,
    visitedStamps,
    toggleVisited,
    favoriteDestinationIds,
    toggleFavoriteDestination,
    myCheckIn,
    checkIn,
    checkOut,
    sendGuideMessage,
    wishlist,
    addWishlistItem,
    loadDestinationCheckIns,
  } = useAppState();
  const { destinations, places, refresh } = useContent();
  const { requireAccount } = useRequireAccount();
  const destination = destinations.find((d) => d.id === route.params.destinationId);
  const [activeType, setActiveType] = useState<TypeFilter>('all');
  const [activeTab, setActiveTab] = useState<CityTab>('places');
  const [posts, setPosts] = useState<CityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState<GooglePlaceResult[] | null>(null);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [openingResultId, setOpeningResultId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [friendCheckIns, setFriendCheckIns] = useState<CheckInRecord[]>([]);

  useEffect(() => {
    if (!destination?.latitude || !destination?.longitude) return;
    let cancelled = false;
    fetchWeatherNow({ latitude: destination.latitude, longitude: destination.longitude }).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [destination?.id]);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    loadDestinationCheckIns(destination.id).then((rows) => {
      if (!cancelled) setFriendCheckIns(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [destination?.id]);

  useEffect(() => {
    if (!destination || activeTab !== 'posts') return;
    let cancelled = false;
    setPostsLoading(true);
    supabase
      .from('travel_posts')
      .select('id,image_url,caption,profiles(name,avatar_url)')
      .eq('destination_id', destination.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (cancelled) return;
        setPosts(
          (data ?? []).map((row: any) => ({
            id: row.id,
            imageUrl: row.image_url,
            caption: row.caption,
            authorName: row.profiles?.name ?? '',
            authorAvatarUrl: row.profiles?.avatar_url ?? null,
          }))
        );
        setPostsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destination, activeTab]);

  const destinationPlaces = useMemo(
    () => places.filter((p) => p.destinationId === route.params.destinationId),
    [places, route.params.destinationId]
  );
  const filteredPlaces = useMemo(
    () => (activeType === 'all' ? destinationPlaces : destinationPlaces.filter((p) => p.type === activeType)),
    [destinationPlaces, activeType]
  );

  if (!destination) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الوجهة</Text>
      </SafeAreaView>
    );
  }

  const isVisited = visitedStamps.some((s) => s.destinationId === destination.id);
  const isFavorite = favoriteDestinationIds.includes(destination.id);
  const isCheckedInHere = myCheckIn === destination.id;

  const flightMinutes =
    destination.id !== 'riyadh' && destination.latitude != null && destination.longitude != null
      ? estimateFlightMinutes(RIYADH_COORDINATE, { latitude: destination.latitude, longitude: destination.longitude })
      : null;

  const askGuide = () => {
    sendGuideMessage(`وش أفضل وقت وأماكن أزورها في ${destination.name}؟`);
    navigation.navigate('GuideChat');
  };

  const hasCoordinate = destination.latitude != null && destination.longitude != null;

  const handleGoogleSearch = async () => {
    if (!googleQuery.trim() || !hasCoordinate || googleSearching) return;
    setGoogleSearching(true);
    const results = await searchGooglePlaces(googleQuery, {
      latitude: destination.latitude!,
      longitude: destination.longitude!,
    });
    setGoogleResults(results);
    setGoogleSearching(false);
  };

  const handleOpenGoogleResult = (result: GooglePlaceResult) => {
    requireAccount('trip', async () => {
      setOpeningResultId(result.id);
      const placeId = await cacheGooglePlace(result, destination.id);
      if (placeId) {
        await refresh();
        navigation.navigate('PlaceDetail', { placeId });
      }
      setOpeningResultId(null);
    });
  };

  const currentMonth = new Date().getMonth() + 1;

  const handleShare = () => {
    Share.share({ message: `${destination.name} — ${destination.tagline}` });
  };

  const wishlisted = wishlist.some((item) => item.name === destination.name);

  const handleWishlist = () => {
    if (wishlisted) return;
    requireAccount('trip', () => {
      addWishlistItem(destination.name);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrap}>
          <Image source={destination.image} style={styles.image} />
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.glassGroup}>
              <TouchableOpacity style={styles.glassButton} activeOpacity={0.85} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color={colors.textOnPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.glassButton}
                activeOpacity={0.85}
                onPress={() => requireAccount('favoriteDestination', () => toggleFavoriteDestination(destination.id))}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? colors.accent : colors.textOnPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
          {destination.country ? (
            <View style={styles.countryBadge}>
              <Text style={styles.countryBadgeText}>{destination.country}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{destination.name}</Text>
          <Text style={styles.tagline}>{destination.tagline}</Text>

          <TouchableOpacity
            style={[styles.stampButton, isVisited && styles.stampButtonActive]}
            onPress={() => requireAccount('visited', () => toggleVisited(destination.id))}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isVisited ? 'checkmark-circle' : 'ribbon-outline'}
              size={16}
              color={isVisited ? colors.textOnPrimary : colors.primaryDark}
            />
            <Text style={[styles.stampButtonText, isVisited && styles.stampButtonTextActive]}>
              {isVisited ? 'زرتها' : 'أضفها لأماكن زرتها'}
            </Text>
          </TouchableOpacity>

          {flightMinutes != null || weather ? (
            <View style={styles.statsRow}>
              {flightMinutes != null ? (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>من الرياض</Text>
                  <View style={styles.statValueRow}>
                    <Ionicons name="airplane" size={14} color={colors.text} style={styles.statIcon} />
                    <Text style={styles.statValue}>~{formatFlightDuration(flightMinutes)}</Text>
                  </View>
                </View>
              ) : null}
              {weather ? (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>الطقس الحين</Text>
                  <Text style={styles.statValue}>{weather.tempC}° {weather.condition}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.whyVisit}>{destination.whyVisit}</Text>

          <Text style={styles.sectionTitle}>أفضل وقت للزيارة</Text>
          <View style={styles.monthsChart}>
            {MONTH_SHORT.map((label, i) => {
              const month = i + 1;
              const isBest = destination.bestMonths.includes(month);
              const isCurrent = month === currentMonth;
              return (
                <View key={month} style={styles.monthColumn}>
                  <View
                    style={[
                      styles.monthBar,
                      isBest ? styles.monthBarGood : styles.monthBarMuted,
                      isCurrent && styles.monthBarCurrent,
                    ]}
                  />
                  <Text style={[styles.monthLabel, isCurrent && styles.monthLabelCurrent]}>{label}</Text>
                </View>
              );
            })}
          </View>
          {destination.bestMonths.includes(currentMonth) ? (
            <Text style={styles.monthsVerdict}>{MONTH_NAMES[currentMonth - 1]} وقت ممتاز للزيارة</Text>
          ) : null}

          {destination.latitude && destination.longitude ? (
            <PrayerTimesCard
              coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
              timezone={destination.timezone}
            />
          ) : null}

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'places' && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('places')}
            >
              <Text style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}>الأماكن</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>مدونات</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'places' ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeFiltersScroll}
                contentContainerStyle={styles.typeFiltersRow}
              >
                {TYPE_FILTERS.map((item) => {
                  const active = activeType === item;
                  const label = item === 'all' ? 'الكل' : PLACE_TYPE_LABELS[item];
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.typeFilterChip, active && styles.typeFilterChipActive]}
                      activeOpacity={0.8}
                      onPress={() => setActiveType(item)}
                    >
                      <Text style={[styles.typeFilterText, active && styles.typeFilterTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {hasCoordinate ? (
                <View style={styles.googleSearchWrap}>
                  <View style={styles.googleSearchBar}>
                    <TouchableOpacity activeOpacity={0.8} onPress={handleGoogleSearch} disabled={googleSearching}>
                      {googleSearching ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="search" size={16} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                    <TextInput
                      style={styles.googleSearchInput}
                      placeholder={`دور على أي مكان في ${destination.name}…`}
                      placeholderTextColor={colors.textFaint}
                      value={googleQuery}
                      onChangeText={setGoogleQuery}
                      onSubmitEditing={handleGoogleSearch}
                      returnKeyType="search"
                      textAlign="right"
                    />
                  </View>

                  {googleResults !== null ? (
                    googleResults.length === 0 ? (
                      <Text style={styles.emptyPlacesText}>ما لقينا نتائج بجوجل لهذا البحث</Text>
                    ) : (
                      <View style={styles.googleResultsList}>
                        {googleResults.map((result) => (
                          <TouchableOpacity
                            key={result.id}
                            style={styles.googleResultCard}
                            activeOpacity={0.85}
                            disabled={openingResultId === result.id}
                            onPress={() => handleOpenGoogleResult(result)}
                          >
                            {result.photoName ? (
                              <Image
                                source={{ uri: getPlacePhotoUrl(result.photoName, 200) ?? undefined }}
                                style={styles.googleResultImage}
                              />
                            ) : (
                              <View style={[styles.googleResultImage, styles.googleResultImagePlaceholder]}>
                                <Ionicons name="location-outline" size={20} color={colors.textFaint} />
                              </View>
                            )}
                            <View style={styles.googleResultTextWrap}>
                              <Text style={styles.googleResultName} numberOfLines={1}>{result.name}</Text>
                              <Text style={styles.googleResultAddress} numberOfLines={1}>{result.address}</Text>
                              {result.rating ? (
                                <View style={styles.googleResultRatingRow}>
                                  <Ionicons name="star" size={11} color={colors.accentDark} />
                                  <Text style={styles.googleResultRatingText}>{result.rating.toFixed(1)}</Text>
                                  {result.ratingCount ? (
                                    <Text style={styles.googleResultRatingCount}>({result.ratingCount})</Text>
                                  ) : null}
                                </View>
                              ) : null}
                            </View>
                            {openingResultId === result.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )
                  ) : null}
                </View>
              ) : null}

              {destinationPlaces.length === 0 ? (
                <Text style={styles.emptyPlacesText}>لسا ما أضفنا أماكن لهذي الوجهة</Text>
              ) : filteredPlaces.length === 0 ? (
                <Text style={styles.emptyPlacesText}>لا توجد أماكن بهذا التصنيف هنا حاليًا</Text>
              ) : (
                <View style={styles.placesList}>
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                    />
                  ))}
                </View>
              )}
            </>
          ) : postsLoading ? null : posts.length === 0 ? (
            <Text style={styles.emptyPlacesText}>لسا ما فيه مدونات عن {destination.name}</Text>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postTile}>
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                  <View style={styles.postAuthorRow}>
                    <PersonAvatar avatarUrl={post.authorAvatarUrl ?? undefined} size={18} />
                    <Text style={styles.postAuthorName} numberOfLines={1}>{post.authorName}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.checkInCard}>
            <View style={styles.checkInHeader}>
              <Text style={styles.sectionTitle}>أصدقاؤك هنا الحين</Text>
            </View>
            {friendCheckIns.length === 0 && !isCheckedInHere ? (
              <Text style={styles.checkInEmpty}>ولا أحد من أصدقائك متشيك هنا بآخر يوم</Text>
            ) : (
              <View style={styles.checkInPeersRow}>
                {isCheckedInHere ? (
                  <View style={styles.checkInPeer}>
                    <PersonAvatar avatarUrl={currentUser.avatarUrl} size={40} style={styles.checkInAvatarMargin} />
                    <Text style={styles.checkInName}>أنت</Text>
                  </View>
                ) : null}
                {Array.from(new Map(friendCheckIns.map((c) => [c.user?.id ?? c.id, c])).values()).map((peer) => (
                  <View key={peer.id} style={styles.checkInPeer}>
                    <PersonAvatar avatarUrl={peer.user?.avatarUrl ?? undefined} size={40} style={styles.checkInAvatarMargin} />
                    <Text style={styles.checkInName}>{peer.user?.name ?? 'صديق'}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.checkInButton, isCheckedInHere && styles.checkInButtonActive]}
              activeOpacity={0.85}
              onPress={() =>
                isCheckedInHere ? checkOut() : requireAccount('checkIn', () => checkIn(destination.id))
              }
            >
              <Ionicons
                name={isCheckedInHere ? 'close-circle-outline' : 'location-outline'}
                size={15}
                color={isCheckedInHere ? colors.primaryDark : colors.textOnPrimary}
              />
              <Text style={[styles.checkInButtonText, isCheckedInHere && styles.checkInButtonTextActive]}>
                {isCheckedInHere ? 'إلغاء التشك إن' : 'تشك إن هنا'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.guideLink} activeOpacity={0.8} onPress={askGuide}>
            <Ionicons name="chatbubble-outline" size={15} color={colors.primaryDark} />
            <Text style={styles.guideLinkText}>اسأل الدليل عن {destination.name}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.wishlistButton, wishlisted && styles.wishlistButtonActive]}
          activeOpacity={0.85}
          onPress={handleWishlist}
        >
          <Ionicons
            name={wishlisted ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={wishlisted ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.planTripButton}
          activeOpacity={0.85}
          onPress={() =>
            requireAccount('trip', () => navigation.navigate('CreateTrip', { destinationId: destination.id }))
          }
        >
          <Text style={styles.planTripButtonText}>خطط رحلة لـ{destination.name}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  scrollContent: { paddingBottom: 100 },
  imageWrap: { width: '100%', height: 260 },
  image: { width: '100%', height: '100%' },
  headerRow: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassGroup: { flexDirection: 'row-reverse', gap: spacing.sm },
  countryBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  countryBadgeText: { color: colors.textOnPrimary, fontSize: fontSize.small, fontWeight: '700' },
  stampButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  stampButtonActive: {
    backgroundColor: colors.primary,
  },
  stampButtonText: { color: colors.primaryDark, fontSize: fontSize.small, fontWeight: '700' },
  stampButtonTextActive: { color: colors.textOnPrimary },
  body: { padding: spacing.xl },
  name: { color: colors.text, fontSize: fontSize.heading, fontWeight: '700', textAlign: 'right' },
  tagline: { color: colors.textMuted, fontSize: fontSize.bodyLg, textAlign: 'right', marginTop: 4 },
  whyVisit: { color: colors.text, fontSize: fontSize.bodyLg, lineHeight: 22, textAlign: 'right', marginTop: spacing.lg, marginBottom: spacing.xl },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  statLabel: { color: colors.textMuted, fontSize: fontSize.small, marginBottom: 4 },
  statValueRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statIcon: { transform: [{ scaleX: -1 }] },
  statValue: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  monthsChart: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
    marginBottom: spacing.xs,
  },
  monthColumn: { alignItems: 'center', gap: 4, flex: 1 },
  monthBar: { width: 10, height: 28, borderRadius: 4 },
  monthBarGood: { backgroundColor: colors.success },
  monthBarMuted: { backgroundColor: colors.surfaceAlt },
  monthBarCurrent: { borderWidth: 1.5, borderColor: colors.primary },
  monthLabel: { color: colors.textFaint, fontSize: fontSize.tiny },
  monthLabelCurrent: { color: colors.primaryDark, fontWeight: '700' },
  monthsVerdict: { color: colors.successDark, fontSize: fontSize.base, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xl },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  tabButtonActive: { backgroundColor: colors.text },
  tabText: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  tabTextActive: { color: colors.background },
  typeFiltersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.md,
  },
  typeFiltersRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  typeFilterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typeFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeFilterText: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  typeFilterTextActive: {
    color: colors.textOnPrimary,
  },
  emptyPlacesText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  placesList: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.sm,
  },
  googleSearchWrap: { marginBottom: spacing.lg },
  googleSearchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  googleSearchInput: { flex: 1, color: colors.text, fontSize: fontSize.body },
  googleResultsList: { gap: spacing.sm },
  googleResultCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  googleResultImage: { width: 48, height: 48, borderRadius: radius.sm },
  googleResultImagePlaceholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  googleResultTextWrap: { flex: 1 },
  googleResultName: { color: colors.text, fontSize: fontSize.body, fontWeight: '700', textAlign: 'right' },
  googleResultAddress: { color: colors.textMuted, fontSize: fontSize.small, textAlign: 'right', marginTop: 1 },
  googleResultRatingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 2 },
  googleResultRatingText: { color: colors.accentDark, fontSize: fontSize.small, fontWeight: '700' },
  googleResultRatingCount: { color: colors.textFaint, fontSize: fontSize.tiny },
  postsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 2, marginBottom: spacing.lg },
  postTile: { width: '32.5%', aspectRatio: 4 / 5 },
  postImage: { width: '100%', height: '100%', borderRadius: radius.sm },
  postAuthorRow: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    left: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postAuthorName: { color: colors.textOnPrimary, fontSize: fontSize.tiny, fontWeight: '600', flexShrink: 1 },
  guideLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  guideLinkText: { color: colors.primaryDark, fontWeight: '600', fontSize: fontSize.body },
  stickyBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  wishlistButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  planTripButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTripButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.bodyLg },
  checkInCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  checkInHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkInEmpty: { color: colors.textFaint, fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.sm },
  checkInPeersRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  checkInPeer: { alignItems: 'center', width: 52 },
  checkInAvatarMargin: { marginBottom: 2 },
  checkInName: { color: colors.textMuted, fontSize: fontSize.tiny, fontWeight: '600', textAlign: 'center' },
  checkInButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  checkInButtonActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkInButtonText: { color: colors.textOnPrimary, fontSize: fontSize.base, fontWeight: '700' },
  checkInButtonTextActive: { color: colors.primaryDark },
});

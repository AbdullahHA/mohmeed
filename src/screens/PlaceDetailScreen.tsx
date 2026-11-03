import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import PlaceMiniMap from '../components/PlaceMiniMap';
import AddToTripSheet from '../components/AddToTripSheet';
import AddedToast from '../components/AddedToast';
import QuickRateSheet from '../components/QuickRateSheet';
import PersonAvatar from '../components/PersonAvatar';
import ShareToFriendSheet from '../components/ShareToFriendSheet';
import { getMapsUrl } from '../utils/place';
import { encodePlaceShareMessage } from '../lib/placeShare';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import { PLACE_TYPE_LABELS } from '../data/places';
import type { Trip, ItinerarySlot, PlaceQuickRating, QuickRateTag } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'PlaceDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// Honest price-per-person bucket derived from the real 1–3 price level
// (we don't have a real per-place SAR range, so this is a bucket, not a
// made-up number).
const PRICE_RANGE_LABEL: Record<1 | 2 | 3, string> = {
  1: 'أقل من 50 ﷼',
  2: '50 – 150 ﷼',
  3: '150 ﷼ فأكثر',
};

export default function PlaceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { recommendedPlaceIds, toggleRecommended, trips, addItineraryItem, removeItineraryItem, followingIds, friends } = useAppState();
  const { profile } = useAuth();
  const { requireAccount } = useRequireAccount();
  const { places, destinations } = useContent();
  const place = places.find((p) => p.id === route.params.placeId);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [toast, setToast] = useState<{ tripId: string; tripTitle: string; itemId: string } | null>(null);
  const [rateSheetVisible, setRateSheetVisible] = useState(false);
  const [ratings, setRatings] = useState<PlaceQuickRating[]>([]);
  const [myRating, setMyRating] = useState<PlaceQuickRating | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadRatings = async () => {
    if (!place) return;
    const { data } = await supabase
      .from('place_quick_ratings')
      .select('id,place_id,user_id,stars,tags,note,created_at,user:profiles(name,avatar_url)')
      .eq('place_id', place.id)
      .order('created_at', { ascending: false });
    const mapped: PlaceQuickRating[] = ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      placeId: r.place_id,
      userId: r.user_id,
      stars: r.stars,
      tags: r.tags ?? [],
      note: r.note,
      createdAt: new Date(r.created_at).getTime(),
      user: r.user ? { name: r.user.name, avatarUrl: r.user.avatar_url ?? null } : null,
    }));
    mapped.sort((a, b) => {
      const aFollowed = followingIds.includes(a.userId) ? 1 : 0;
      const bFollowed = followingIds.includes(b.userId) ? 1 : 0;
      if (aFollowed !== bFollowed) return bFollowed - aFollowed;
      return b.createdAt - a.createdAt;
    });
    setRatings(mapped);
    setMyRating(mapped.find((r) => r.userId === profile?.id) ?? null);
  };

  useEffect(() => {
    loadRatings();
  }, [place?.id]);

  const handleSubmitRating = async (stars: number, tags: QuickRateTag[], note: string) => {
    if (!place || !profile) return;
    await supabase
      .from('place_quick_ratings')
      .upsert({ place_id: place.id, user_id: profile.id, stars, tags, note: note || null }, { onConflict: 'place_id,user_id' });
    setRateSheetVisible(false);
    loadRatings();
  };

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المكان</Text>
      </SafeAreaView>
    );
  }

  const mapsUrl = getMapsUrl(place.coordinate);
  const isRecommended = recommendedPlaceIds.includes(place.id);
  const destinationName = destinations.find((d) => d.id === place.destinationId)?.name;
  const locationLabel = [destinationName, 'المملكة العربية السعودية'].filter(Boolean).join('، ');

  const handleAddToTrip = () => {
    requireAccount('trip', () => {
      if (trips.length === 0) {
        navigation.navigate('CreateTrip');
        return;
      }
      setPickerVisible(true);
    });
  };

  const handleAdd = async (trip: Trip, day: string | null, slot: ItinerarySlot | null, notifyGroup: boolean) => {
    const WEEKDAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayLabel = day ? WEEKDAY[new Date(day + 'T00:00:00').getDay()] : 'غير محدد';
    const created = await addItineraryItem(trip.id, {
      day: dayLabel,
      time: slot ?? '—',
      title: place.name,
      itemDate: day,
      slot,
      placeId: place.id,
      kind: 'place',
    });
    setPickerVisible(false);
    if (!created) return;
    if (notifyGroup && profile) {
      await supabase.from('trip_messages').insert({
        trip_id: trip.id,
        from_id: profile.id,
        text: `أضاف ${place.name} للجدول${day ? ` — ${dayLabel}` : ''}`,
      });
    }
    setToast({ tripId: trip.id, tripTitle: trip.title, itemId: created.id });
  };

  const handleShareToFriend = async (friend: { id: string }) => {
    setShareSheetVisible(false);
    if (!profile) return;
    await supabase.from('direct_messages').insert({
      sender_id: profile.id,
      recipient_id: friend.id,
      text: encodePlaceShareMessage(place.id),
    });
    navigation.navigate('FriendChat', { friendId: friend.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrap}>
          <Image source={place.image} style={styles.image} />
          <View style={styles.imageHeader}>
            <TouchableOpacity style={styles.glassButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.glassGroup}>
              <TouchableOpacity
                style={styles.glassButton}
                activeOpacity={0.85}
                onPress={() => Share.share({ message: `${place.name} — يلا نسافر` })}
              >
                <Ionicons name="share-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.glassButton}
                activeOpacity={0.85}
                onPress={() => requireAccount('chat', () => setShareSheetVisible(true))}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.glassButton}
                onPress={() => requireAccount('recommend', () => toggleRecommended(place.id))}
                activeOpacity={0.85}
              >
                <Ionicons name={isRecommended ? 'heart' : 'heart-outline'} size={18} color={isRecommended ? colors.heart : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.chipsRow}>
            <View style={[styles.chip, styles.chipGold]}>
              <Text style={styles.chipGoldText}>{PLACE_TYPE_LABELS[place.type]}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{place.category}</Text>
            </View>
          </View>

          <Text style={styles.name}>{place.name}</Text>

          <View style={styles.subRow}>
            <View style={styles.subRate}>
              <Ionicons name="star" size={14} color={colors.accentDark} />
              <Text style={styles.subRateText}>{place.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.subDot}>·</Text>
            <Text style={styles.subText}>{'﷼'.repeat(place.priceLevel)}</Text>
          </View>

          <View style={styles.qaRow}>
            <TouchableOpacity style={styles.qaItem} activeOpacity={0.8} onPress={() => Linking.openURL(mapsUrl)}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.qaText}>الاتجاهات</Text>
            </TouchableOpacity>
            {place.website ? (
              <TouchableOpacity style={styles.qaItem} activeOpacity={0.8} onPress={() => Linking.openURL(place.website!)}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
                <Text style={styles.qaText}>الموقع</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.qaItem}
              activeOpacity={0.8}
              onPress={() => requireAccount('recommend', () => toggleRecommended(place.id))}
            >
              <Ionicons name={isRecommended ? 'heart' : 'heart-outline'} size={18} color={isRecommended ? colors.heart : colors.primary} />
              <Text style={styles.qaText}>{isRecommended ? 'محفوظ' : 'احفظه'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.factsRow}>
            <View style={styles.factCard}>
              <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />
              <Text style={styles.factLabel}>الصنف</Text>
              <Text style={styles.factValue}>{place.category}</Text>
            </View>
            <View style={styles.factCard}>
              <Ionicons name="apps-outline" size={18} color={colors.textMuted} />
              <Text style={styles.factLabel}>النوع</Text>
              <Text style={styles.factValue}>{PLACE_TYPE_LABELS[place.type]}</Text>
            </View>
            <View style={styles.factCard}>
              <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
              <Text style={styles.factLabel}>للشخص</Text>
              <Text style={styles.factValue}>{PRICE_RANGE_LABEL[place.priceLevel]}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>الموقع</Text>
          <View style={styles.mapWrap}>
            <PlaceMiniMap coordinate={place.coordinate} />
          </View>
          {locationLabel ? (
            <View style={styles.locationCard}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.locationText}>{locationLabel}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>لمحة عامة</Text>
          <Text style={styles.description}>{place.description}</Text>

          <View style={styles.ratingsSectionHeader}>
            <Text style={styles.sectionTitle}>آراء المسافرين</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => requireAccount('recommend', () => setRateSheetVisible(true))}
            >
              <Text style={styles.rateLink}>{myRating ? 'عدّل تقييمك' : 'قيّم تجربتك'}</Text>
            </TouchableOpacity>
          </View>

          {ratings.length === 0 ? (
            <Text style={styles.emptyRatings}>ما فيه تقييمات بعد — كن أول من يقيّم</Text>
          ) : (
            <View style={styles.ratingsList}>
              {ratings.map((r) => (
                <View key={r.id} style={styles.ratingRow}>
                  <PersonAvatar avatarUrl={r.user?.avatarUrl ?? null} size={32} />
                  <View style={styles.ratingTextWrap}>
                    <View style={styles.ratingTopRow}>
                      <Text style={styles.ratingName}>{r.userId === profile?.id ? 'أنت' : r.user?.name ?? 'مستخدم'}</Text>
                      <View style={styles.ratingStarsRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons key={i} name={i < r.stars ? 'star' : 'star-outline'} size={12} color={colors.accent} />
                        ))}
                      </View>
                    </View>
                    {r.tags.length > 0 ? (
                      <View style={styles.ratingTagsRow}>
                        {r.tags.map((t) => (
                          <View key={t} style={styles.ratingTagChip}>
                            <Text style={styles.ratingTagText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {r.note ? <Text style={styles.ratingNote}>{r.note}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.footerBtn, styles.footerGhost]} activeOpacity={0.85} onPress={() => Linking.openURL(mapsUrl)}>
          <Ionicons name="navigate" size={16} color={colors.text} />
          <Text style={styles.footerGhostText}>الاتجاهات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.footerPrimary]} activeOpacity={0.85} onPress={handleAddToTrip}>
          <Ionicons name="add" size={18} color={colors.textOnPrimary} />
          <Text style={styles.footerPrimaryText}>أضف لرحلتي</Text>
        </TouchableOpacity>
      </View>

      <AddToTripSheet
        visible={pickerVisible}
        placeName={place.name}
        isRestaurant={place.type === 'food' || place.type === 'cafe'}
        trips={trips}
        onClose={() => setPickerVisible(false)}
        onAdd={handleAdd}
        onNewTrip={() => {
          setPickerVisible(false);
          navigation.navigate('CreateTrip');
        }}
      />

      {toast ? (
        <AddedToast
          tripTitle={toast.tripTitle}
          onUndo={() => {
            removeItineraryItem(toast.tripId, toast.itemId);
            setToast(null);
          }}
          onViewSchedule={() => {
            navigation.navigate('TripDetail', { tripId: toast.tripId });
            setToast(null);
          }}
        />
      ) : null}

      <QuickRateSheet
        visible={rateSheetVisible}
        placeName={place.name}
        onClose={() => setRateSheetVisible(false)}
        onSubmit={handleSubmitRating}
      />

      <ShareToFriendSheet
        visible={shareSheetVisible}
        friends={friends}
        onClose={() => setShareSheetVisible(false)}
        onPick={handleShareToFriend}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 110 },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  imageWrap: { width: '100%', height: 300 },
  image: { width: '100%', height: '100%' },
  imageHeader: {
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
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassGroup: { flexDirection: 'row-reverse', gap: spacing.sm },
  body: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -22,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  chipsRow: { flexDirection: 'row-reverse', gap: 6 },
  chip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  chipGold: { backgroundColor: colors.accentSoft },
  chipGoldText: { color: colors.accentDark, fontSize: 11, fontWeight: '700' },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'right' },
  subRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  subRate: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  subRateText: { color: colors.accentDark, fontWeight: '700', fontSize: 13 },
  subDot: { color: colors.textFaint },
  subText: { color: colors.textMuted, fontSize: 13 },
  qaRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  qaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  qaText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  factsRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  factCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  factLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  factValue: { color: colors.textMuted, fontSize: 10.5, textAlign: 'center' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: spacing.sm },
  mapWrap: { height: 150, borderRadius: radius.md, overflow: 'hidden' },
  locationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  locationText: { color: colors.textMuted, fontSize: 13 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, textAlign: 'right' },
  ratingsSectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  rateLink: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },
  emptyRatings: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.md },
  ratingsList: { gap: spacing.md, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'flex-start' },
  ratingTextWrap: { flex: 1 },
  ratingTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ratingName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  ratingStarsRow: { flexDirection: 'row-reverse', gap: 1 },
  ratingTagsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  ratingTagChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  ratingTagText: { color: colors.textMuted, fontSize: 10.5, fontWeight: '600' },
  ratingNote: { color: colors.textMuted, fontSize: 12.5, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  footer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  footerBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  footerGhost: { flex: 1, borderWidth: 1, borderColor: colors.border },
  footerGhostText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  footerPrimary: { flex: 1.4, backgroundColor: colors.primary },
  footerPrimaryText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Share,
} from 'react-native';
import Text from '../components/Text';
import RtlScrollRow from '../components/RtlScrollRow';
import ReportSheet from '../components/ReportSheet';
import { Alert } from '../lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import PersonAvatar from '../components/PersonAvatar';
import EmptyState from '../components/EmptyState';
import DesertHero from '../components/DesertHero';
import type { PublicProfile, TravelPost } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    friends,
    followingIds,
    followUser,
    unfollowUser,
    blockUser,
    reportUser,
    loadPublicProfile,
    loadFollowers,
    loadFollowing,
    loadUserPosts,
  } = useAppState();
  const { requireAccount } = useRequireAccount();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [publishedTrips, setPublishedTrips] = useState<{ id: string; title: string; destination: string }[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isFollowing = followingIds.includes(params.userId);
  const isFriend = friends.some((f) => f.id === params.userId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadPublicProfile(params.userId),
      loadUserPosts(params.userId),
      loadFollowers(params.userId),
      loadFollowing(params.userId),
      supabase
        .from('trips')
        .select('id,title,destination')
        .eq('owner_id', params.userId)
        .eq('is_published', true),
    ]).then(([p, userPosts, followers, following, publishedTripsResult]) => {
      if (!active) return;
      setProfile(p);
      setPosts(userPosts);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
      setPublishedTrips((publishedTripsResult.data ?? []) as { id: string; title: string; destination: string }[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId]);

  const handleToggleFollow = () => {
    requireAccount('follow', async () => {
      setBusy(true);
      if (isFollowing) {
        await unfollowUser(params.userId);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(params.userId);
        setFollowersCount((c) => c + 1);
      }
      setBusy(false);
    });
  };

  const handleShare = () => {
    if (!profile) return;
    Share.share({ message: `شوف ملف ${profile.name} على يلا نسافر: @${profile.username}` }).catch(() => {});
  };

  const handleBlock = () => {
    if (!profile) return;
    requireAccount('block', () => {
      Alert.alert(
        `حظر ${profile.name}؟`,
        'ما بيقدر يتابعك أو يراسلك أو يشوف ملفك مرة ثانية.',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'حظر',
            style: 'destructive',
            onPress: async () => {
              if (isFollowing) await unfollowUser(params.userId);
              const { error } = await blockUser(params.userId);
              if (error) {
                Alert.alert('صار خطأ', error);
                return;
              }
              navigation.goBack();
            },
          },
        ]
      );
    });
  };

  const handleOptions = () => {
    if (!profile) return;
    Alert.alert(profile.name, undefined, [
      { text: 'إبلاغ عن المستخدم', onPress: () => requireAccount('report', () => setReportOpen(true)) },
      { text: 'حظر المستخدم', style: 'destructive', onPress: handleBlock },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleSubmitReport = async (reason: string) => {
    setReportOpen(false);
    const { error } = await reportUser(params.userId, reason);
    Alert.alert(error ? 'صار خطأ' : 'تم الإرسال', error ?? 'وصل بلاغك، بنراجعه قريبًا.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <DesertHero style={styles.cover}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </DesertHero>
        <EmptyState icon="person-outline" title="ما لقينا هذا الملف" subtitle="ممكن الحساب محذوف أو غير متاح" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DesertHero style={styles.cover}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.8} onPress={handleOptions}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.8} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </DesertHero>

        <View style={styles.profileCard}>
          <PersonAvatar avatarUrl={profile.avatarUrl} size={80} style={styles.avatarMargin} />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {profile.interests.length > 0 ? (
            <View style={styles.interestsRow}>
              {profile.interests.map((tag) => (
                <View key={tag} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>مدونة</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FollowList', { userId: params.userId, mode: 'followers' })}
            >
              <Text style={styles.statValue}>{followersCount}</Text>
              <Text style={styles.statLabel}>متابعين</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FollowList', { userId: params.userId, mode: 'following' })}
            >
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>يتابع</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleToggleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing ? 'يتابعه' : 'متابعة'}
              </Text>
            </TouchableOpacity>
            {isFriend ? (
              <TouchableOpacity
                style={styles.messageButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('FriendChat', { friendId: profile.id })}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                <Text style={styles.messageButtonText}>مراسلة</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {publishedTrips.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>رحلات منشورة</Text>
            <RtlScrollRow contentContainerStyle={styles.publishedRow}>
              {publishedTrips.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.publishedCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PublishedTrip', { tripId: t.id })}
                >
                  <Text style={styles.publishedTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.publishedDestination} numberOfLines={1}>{t.destination}</Text>
                </TouchableOpacity>
              ))}
            </RtlScrollRow>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>المدونات</Text>
        {posts.length === 0 ? (
          <Text style={styles.emptyMuted}>ما نشر أي مدونة سفر بعد</Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
              </View>
            )}
          />
        )}
      </ScrollView>

      <ReportSheet
        visible={reportOpen}
        title={`إبلاغ عن ${profile.name}`}
        onClose={() => setReportOpen(false)}
        onSubmit={handleSubmitReport}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { height: 130 },
  backButton: {
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
  heroActions: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  heroActionButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: { alignItems: 'center', padding: spacing.xl, marginTop: -46 },
  avatarMargin: { marginBottom: spacing.sm, borderWidth: 3, borderColor: colors.background, borderRadius: 999 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  username: { color: colors.textFaint, fontSize: 13, marginTop: 2 },
  bio: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  interestsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  interestChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  interestChipText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  statItem: { alignItems: 'center', minWidth: 56 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg, width: '100%' },
  followButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  followButtonTextActive: { color: colors.text },
  messageButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  messageButtonText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMuted: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  publishedRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.xl },
  publishedCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  publishedTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  publishedDestination: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: 2 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: radius.sm },
});

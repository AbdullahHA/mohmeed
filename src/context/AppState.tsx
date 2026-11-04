import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, type ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedTripTemplates } from '../data/tripTemplates';
import { heroDestination, type Destination } from '../data/destinations';
import { useContent } from './ContentContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { useTheme } from './ThemeContext';
import type {
  BudgetItem,
  ChatMessage,
  GuidePlanDay,
  ChecklistItem,
  Community,
  CommunityRequest,
  Feedback,
  Friend,
  ItineraryItem,
  LoyaltyMembership,
  Trip,
  TripPreview,
  TripTemplate,
  TripTemplateItem,
  VisitedStamp,
  WishlistItem,
  ManualVisitedPlace,
  PlaceSearchResult,
  CheckInRecord,
  TravelPost,
  FeedPost,
  TripWindow,
  MeetupMatch,
  PublicProfile,
  TravelerType,
  TripNeed,
  TripDatesMode,
  TripDateVote,
  AppNotification,
} from '../types';

const STORAGE_KEY = 'yalla-nsafer:state:v1';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'guide-welcome',
  fromId: 'guide',
  text: 'مرحباً بك في يلا نسافر 👋 أنا دليلك للسفر. اسألني عن أفضل الوجهات، الفنادق، أو المطاعم في أي شهر.',
  at: Date.now(),
};

type PersistedState = {
  guideMessages: ChatMessage[];
  feedback: Feedback | null;
  visitedStamps: VisitedStamp[];
  recommendedPlaceIds: string[];
  favoriteDestinationIds: string[];
  loyaltyMemberships: LoyaltyMembership[];
  wishlist: WishlistItem[];
  manualVisitedPlaces: ManualVisitedPlace[];
  tripTemplates: TripTemplate[];
  myCheckIn: string | null;
};

type NewTripInput = {
  title: string;
  destination: string;
  coverImage: ImageSourcePropType;
  startDate: string;
  endDate: string;
  memberIds: string[];
  budgetTotal: number;
  travelerType: TravelerType | null;
  needs: TripNeed[];
  datesMode: TripDatesMode;
  flexibleMonth: string | null;
  flexibleDays: number | null;
};

type NewCommunityRequestInput = {
  name: string;
  tagline: string;
  emoji: string;
  reason: string;
};

type NewTripTemplateInput = {
  title: string;
  destinationId: string;
  days: number;
  items: Omit<TripTemplateItem, 'id'>[];
};

type AppStateValue = {
  currentUser: Friend;
  friends: Friend[];
  trips: Trip[];
  tripsLoading: boolean;
  tripsOffline: boolean;
  guideMessages: ChatMessage[];
  guideThinking: boolean;
  communities: Community[];
  communitiesLoading: boolean;
  communityRequests: CommunityRequest[];
  feedback: Feedback | null;
  visitedStamps: VisitedStamp[];
  recommendedPlaceIds: string[];
  favoriteDestinationIds: string[];
  loyaltyMemberships: LoyaltyMembership[];
  wishlist: WishlistItem[];
  manualVisitedPlaces: ManualVisitedPlace[];
  tripTemplates: TripTemplate[];
  myCheckIn: string | null;
  friendsLoading: boolean;
  blockedUserIds: string[];
  incomingRequests: Friend[];
  outgoingRequests: Friend[];
  notifications: AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addFriend: (username: string) => Promise<{ error: string | null }>;
  removeFriend: (friendId: string) => Promise<{ error: string | null }>;
  blockUser: (friendId: string) => Promise<{ error: string | null }>;
  unblockUser: (userId: string) => Promise<{ error: string | null }>;
  acceptFriendRequest: (requesterId: string) => Promise<{ error: string | null }>;
  declineFriendRequest: (requesterId: string) => Promise<{ error: string | null }>;
  cancelFriendRequest: (recipientId: string) => Promise<{ error: string | null }>;
  createTrip: (input: NewTripInput) => Promise<Trip | null>;
  confirmTripDates: (tripId: string, startDate: string, endDate: string) => Promise<void>;
  publishTrip: (tripId: string, published: boolean) => Promise<{ error: string | null }>;
  copyPublishedTrip: (tripId: string) => Promise<{ tripId: string | null; error: string | null }>;
  joinTripByCode: (code: string) => Promise<{ tripId: string | null; error: string | null }>;
  previewTripByCode: (code: string) => Promise<{ preview: TripPreview | null; error: string | null }>;
  addMember: (tripId: string, friendId: string) => Promise<void>;
  addBudgetItem: (tripId: string, item: Omit<BudgetItem, 'id'>) => Promise<void>;
  removeBudgetItem: (tripId: string, itemId: string) => Promise<void>;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id' | 'addedBy' | 'done'>) => Promise<ItineraryItem | null>;
  removeItineraryItem: (tripId: string, itemId: string) => Promise<void>;
  toggleItineraryItemDone: (tripId: string, itemId: string) => Promise<void>;
  postponeItineraryItemToTomorrow: (tripId: string, itemId: string) => Promise<void>;
  addChecklistItem: (tripId: string, item: Omit<ChecklistItem, 'id' | 'done'>) => Promise<void>;
  toggleChecklistItem: (tripId: string, itemId: string) => Promise<void>;
  removeChecklistItem: (tripId: string, itemId: string) => Promise<void>;
  sendGuideMessage: (text: string) => void;
  resetGuideConversation: () => void;
  joinCommunity: (communityId: string) => Promise<{ error: string | null }>;
  leaveCommunity: (communityId: string) => Promise<{ error: string | null }>;
  submitCommunityRequest: (input: NewCommunityRequestInput) => Promise<{ error: string | null }>;
  reportCommunityMessage: (communityId: string, messageId: string, reason: string) => Promise<{ error: string | null }>;
  reportCommunityMember: (communityId: string, memberId: string, reason: string) => Promise<{ error: string | null }>;
  setFeedback: (value: Feedback | null) => void;
  toggleVisited: (destinationId: string) => void;
  toggleRecommended: (placeId: string) => void;
  toggleFavoriteDestination: (destinationId: string) => void;
  addLoyaltyMembership: (input: Omit<LoyaltyMembership, 'id'>) => void;
  removeLoyaltyMembership: (id: string) => void;
  addWishlistItem: (name: string) => void;
  removeWishlistItem: (id: string) => void;
  addManualVisitedPlace: (name: string) => void;
  removeManualVisitedPlace: (id: string) => void;
  addTripTemplate: (input: NewTripTemplateInput) => TripTemplate;
  removeTripTemplate: (id: string) => void;
  applyTripTemplate: (templateId: string) => Promise<Trip | null>;
  checkIn: (destinationId: string) => void;
  checkOut: () => void;
  myCheckIns: CheckInRecord[];
  myCheckInsLoading: boolean;
  searchVenues: (query: string) => Promise<PlaceSearchResult[]>;
  checkInToVenue: (venue: PlaceSearchResult) => Promise<{ error: string | null }>;
  loadVenueCheckIns: (venueId: string) => Promise<CheckInRecord[]>;
  loadDestinationCheckIns: (destinationId: string) => Promise<CheckInRecord[]>;
  followersCount: number;
  followingCount: number;
  followingIds: string[];
  followUser: (userId: string) => Promise<{ error: string | null }>;
  unfollowUser: (userId: string) => Promise<{ error: string | null }>;
  loadPublicProfile: (userId: string) => Promise<PublicProfile | null>;
  loadFollowers: (userId: string) => Promise<Friend[]>;
  loadFollowing: (userId: string) => Promise<Friend[]>;
  myPosts: TravelPost[];
  myPostsLoading: boolean;
  addTravelPost: (imageUrl: string, caption: string, destinationId: string | null) => Promise<{ error: string | null }>;
  removeTravelPost: (id: string) => void;
  loadUserPosts: (userId: string) => Promise<TravelPost[]>;
  loadFollowingFeed: (limit?: number) => Promise<FeedPost[]>;
  meetupMatches: MeetupMatch[];
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// The guide-chat model sometimes replies with markdown emphasis
// (**bold**), but every place this text gets rendered — the guide bubble,
// a shared copy pasted into a trip/community chat — is a plain Text node
// with no markdown parser, so the literal asterisks showed up to users.
// Stripped once here, at the one place the reply enters app state.
function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
}

function buildGuideReply(question: string, destinations: Destination[]): string {
  const text = question.trim();
  const lower = text.toLowerCase();

  const matchedDestination = destinations.find(
    (d) => text.includes(d.name) || lower.includes(d.name.toLowerCase())
  );

  if (matchedDestination) {
    const hotels = matchedDestination.topHotels.slice(0, 2).join('، ');
    const restaurants = matchedDestination.topRestaurants.slice(0, 2).join('، ');
    return `${matchedDestination.name}: ${matchedDestination.whyVisit}\nمن الفنادق المقترحة: ${hotels}.\nومن المطاعم: ${restaurants}.`;
  }

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const monthIndex = monthNames.findIndex((m) => text.includes(m));
  if (monthIndex >= 0) {
    const monthNumber = monthIndex + 1;
    const matches = destinations.filter((d) => d.bestMonths.includes(monthNumber));
    if (matches.length > 0) {
      const names = matches.map((d) => d.name).join('، ');
      return `في ${monthNames[monthIndex]}، أفضل الوجهات هي: ${names}. أي وحدة منها تحب أعطيك تفاصيل أكثر عنها (فنادق ومطاعم)؟`;
    }
  }

  return 'حياك! قولي وش الوجهة أو الشهر اللي تفكر تسافر فيه، وبقترح لك أفضل الأماكن والفنادق والمطاعم المناسبة.';
}

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { colors: themeColors } = useTheme();
  const { destinations, places: contentPlaces } = useContent();
  const { profile, loading: authLoading } = useAuth();
  const currentUser: Friend = profile
    ? {
        id: 'me',
        name: profile.name,
        username: profile.username,
        emoji: profile.emoji,
        color: profile.color,
        avatarUrl: profile.avatarUrl,
      }
    : authLoading
      ? { id: 'me', name: '...', username: '', emoji: '🧳', color: colors.primary }
      : { id: 'me', name: 'ضيف', username: 'guest', emoji: '🧳', color: colors.textFaint };
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [myCheckIns, setMyCheckIns] = useState<CheckInRecord[]>([]);
  const [myCheckInsLoading, setMyCheckInsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [myPosts, setMyPosts] = useState<TravelPost[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(true);
  const [meetupMatches, setMeetupMatches] = useState<MeetupMatch[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsOffline, setTripsOffline] = useState(false);
  const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [guideThinking, setGuideThinking] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const [visitedStamps, setVisitedStamps] = useState<VisitedStamp[]>([]);
  const [recommendedPlaceIds, setRecommendedPlaceIds] = useState<string[]>([]);
  const [favoriteDestinationIds, setFavoriteDestinationIds] = useState<string[]>([]);
  const [loyaltyMemberships, setLoyaltyMemberships] = useState<LoyaltyMembership[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [manualVisitedPlaces, setManualVisitedPlaces] = useState<ManualVisitedPlace[]>([]);
  const [tripTemplates, setTripTemplates] = useState<TripTemplate[]>(seedTripTemplates);
  const [myCheckIn, setMyCheckIn] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  // Set only when hydration actually replaced seed data, so the write effect below
  // can skip the one redundant write-back of data it just read from storage.
  const justHydratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      let loadedFromStorage = false;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Partial<PersistedState> = JSON.parse(raw);
          if (Array.isArray(parsed.guideMessages) && parsed.guideMessages.length > 0) {
            setGuideMessages(parsed.guideMessages);
            loadedFromStorage = true;
          }
          if (
            parsed.feedback &&
            typeof parsed.feedback === 'object' &&
            [1, 2, 3, 4, 5].includes(parsed.feedback.rating)
          ) {
            setFeedbackState(parsed.feedback);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.visitedStamps)) {
            setVisitedStamps(parsed.visitedStamps);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.recommendedPlaceIds)) {
            setRecommendedPlaceIds(parsed.recommendedPlaceIds);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.favoriteDestinationIds)) {
            setFavoriteDestinationIds(parsed.favoriteDestinationIds);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.loyaltyMemberships)) {
            setLoyaltyMemberships(parsed.loyaltyMemberships);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.wishlist)) {
            setWishlist(parsed.wishlist);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.manualVisitedPlaces)) {
            setManualVisitedPlaces(parsed.manualVisitedPlaces);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.tripTemplates)) {
            setTripTemplates(parsed.tripTemplates);
            loadedFromStorage = true;
          }
          if (typeof parsed.myCheckIn === 'string' || parsed.myCheckIn === null) {
            setMyCheckIn(parsed.myCheckIn ?? null);
            loadedFromStorage = true;
          }
        }
      } catch {
        // corrupt or unavailable storage: keep the seed data
      } finally {
        hydratedRef.current = true;
        justHydratedRef.current = loadedFromStorage;
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (justHydratedRef.current) {
      justHydratedRef.current = false;
      return;
    }
    const payload: PersistedState = {
      guideMessages,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      loyaltyMemberships,
      wishlist,
      manualVisitedPlaces,
      tripTemplates,
      myCheckIn,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [
    guideMessages,
    feedback,
    visitedStamps,
    recommendedPlaceIds,
    favoriteDestinationIds,
    loyaltyMemberships,
    wishlist,
    manualVisitedPlaces,
    tripTemplates,
    myCheckIn,
  ]);

  const loadFriends = async () => {
    if (!profile) {
      setFriends([]);
      setFriendsLoading(false);
      return;
    }
    setFriendsLoading(true);
    try {
      const [outgoing, incoming] = await Promise.all([
        supabase
          .from('friendships')
          .select('friend:profiles!friendships_friend_id_fkey(id,name,username,emoji,color,avatar_url)')
          .eq('user_id', profile.id),
        supabase
          .from('friendships')
          .select('user:profiles!friendships_user_id_fkey(id,name,username,emoji,color,avatar_url)')
          .eq('friend_id', profile.id),
      ]);
      const mapRow = (row: any): Friend => ({
        id: row.id,
        name: row.name,
        username: row.username,
        emoji: row.emoji,
        color: row.color,
        avatarUrl: row.avatar_url ?? null,
      });
      const list: Friend[] = [
        ...((outgoing.data ?? []).map((r: any) => r.friend).filter(Boolean).map(mapRow)),
        ...((incoming.data ?? []).map((r: any) => r.user).filter(Boolean).map(mapRow)),
      ];
      setFriends(list);
    } catch {
      // keep whatever we had — network/Supabase hiccup
    } finally {
      setFriendsLoading(false);
    }
  };

  const mapCheckInRow = (row: any): CheckInRecord => ({
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venue_name,
    venueAddress: row.venue_address ?? '',
    category: row.venue_category ?? 'other',
    createdAt: new Date(row.created_at).getTime(),
    user: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          emoji: row.user.emoji,
          color: row.user.color,
          avatarUrl: row.user.avatar_url ?? null,
        }
      : undefined,
  });

  const loadMyCheckIns = async () => {
    if (!profile) {
      setMyCheckIns([]);
      setMyCheckInsLoading(false);
      return;
    }
    setMyCheckInsLoading(true);
    try {
      const { data } = await supabase
        .from('check_ins')
        .select('id,venue_id,venue_name,venue_address,venue_category,created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setMyCheckIns((data ?? []).map(mapCheckInRow));
    } catch {
      // keep whatever we had — network/Supabase hiccup
    } finally {
      setMyCheckInsLoading(false);
    }
  };

  const loadBlocked = async () => {
    if (!profile) {
      setBlockedUserIds([]);
      return;
    }
    const { data } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', profile.id);
    setBlockedUserIds((data ?? []).map((r: any) => r.blocked_id));
  };

  const mapRequestRow = (row: any, key: 'sender' | 'recipient'): Friend => {
    const r = row[key];
    return { id: r.id, name: r.name, username: r.username, emoji: r.emoji, color: r.color, avatarUrl: r.avatar_url ?? null };
  };

  const loadFriendRequests = async () => {
    if (!profile) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }
    const [incoming, outgoing] = await Promise.all([
      supabase
        .from('friend_requests')
        .select('sender:profiles!friend_requests_sender_id_fkey(id,name,username,emoji,color,avatar_url)')
        .eq('recipient_id', profile.id),
      supabase
        .from('friend_requests')
        .select('recipient:profiles!friend_requests_recipient_id_fkey(id,name,username,emoji,color,avatar_url)')
        .eq('sender_id', profile.id),
    ]);
    setIncomingRequests(((incoming.data ?? []) as any[]).map((r) => mapRequestRow(r, 'sender')));
    setOutgoingRequests(((outgoing.data ?? []) as any[]).map((r) => mapRequestRow(r, 'recipient')));
  };

  const mapNotificationRow = (row: any): AppNotification => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    read: row.read,
    createdAt: new Date(row.created_at).getTime(),
  });

  const loadNotifications = async () => {
    if (!profile) {
      setNotifications([]);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('id,type,title,body,data,read,created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(((data ?? []) as any[]).map(mapNotificationRow));
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllNotificationsRead = async () => {
    if (!profile) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
  };

  const mapProfileToFriend = (r: any): Friend => ({
    id: r.id,
    name: r.name,
    username: r.username,
    emoji: r.emoji,
    color: r.color,
    avatarUrl: r.avatar_url ?? null,
  });

  const loadFollowCounts = async () => {
    if (!profile) {
      setFollowersCount(0);
      setFollowingCount(0);
      setFollowingIds([]);
      return;
    }
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('follows').select('following_id').eq('follower_id', profile.id),
    ]);
    setFollowersCount(followers.count ?? 0);
    const ids = (following.data ?? []).map((r: any) => r.following_id as string);
    setFollowingCount(ids.length);
    setFollowingIds(ids);
  };

  const followUser = async (userId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase.from('follows').insert({ follower_id: profile.id, following_id: userId });
    if (error) return { error: 'تعذّرت المتابعة، حاول مرة ثانية' };
    setFollowingIds((prev) => [...prev, userId]);
    setFollowingCount((prev) => prev + 1);
    return { error: null };
  };

  const unfollowUser = async (userId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', profile.id)
      .eq('following_id', userId);
    if (error) return { error: 'تعذّر إلغاء المتابعة' };
    setFollowingIds((prev) => prev.filter((id) => id !== userId));
    setFollowingCount((prev) => Math.max(0, prev - 1));
    return { error: null };
  };

  const loadPublicProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id,name,username,emoji,color,avatar_url,bio,interests')
      .eq('id', userId)
      .single();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      emoji: data.emoji,
      color: data.color,
      avatarUrl: data.avatar_url ?? null,
      bio: data.bio ?? null,
      interests: data.interests ?? [],
    };
  };

  const loadFollowers = async (userId: string) => {
    const { data } = await supabase
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(id,name,username,emoji,color,avatar_url)')
      .eq('following_id', userId);
    return ((data ?? []) as any[]).map((r) => mapProfileToFriend(r.follower)).filter(Boolean);
  };

  const loadFollowing = async (userId: string) => {
    const { data } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(id,name,username,emoji,color,avatar_url)')
      .eq('follower_id', userId);
    return ((data ?? []) as any[]).map((r) => mapProfileToFriend(r.following)).filter(Boolean);
  };

  const mapPostRow = (row: any): TravelPost => ({
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    caption: row.caption ?? '',
    destinationId: row.destination_id,
    createdAt: new Date(row.created_at).getTime(),
  });

  const loadMyPosts = async () => {
    if (!profile) {
      setMyPosts([]);
      setMyPostsLoading(false);
      return;
    }
    setMyPostsLoading(true);
    try {
      const { data } = await supabase
        .from('travel_posts')
        .select('id,user_id,image_url,caption,destination_id,created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setMyPosts((data ?? []).map(mapPostRow));
    } catch {
      // keep whatever we had
    } finally {
      setMyPostsLoading(false);
    }
  };

  const addTravelPost = async (
    imageUrl: string,
    caption: string,
    destinationId: string | null
  ): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { data, error } = await supabase
      .from('travel_posts')
      .insert({ user_id: profile.id, image_url: imageUrl, caption: caption.trim(), destination_id: destinationId })
      .select('id,user_id,image_url,caption,destination_id,created_at')
      .single();
    if (error || !data) return { error: 'تعذّر نشر المدونة، حاول مرة ثانية' };
    setMyPosts((prev) => [mapPostRow(data), ...prev]);
    return { error: null };
  };

  const removeTravelPost = (id: string) => {
    setMyPosts((prev) => prev.filter((p) => p.id !== id));
    supabase.from('travel_posts').delete().eq('id', id).then(() => {});
  };

  const loadUserPosts = async (userId: string) => {
    const { data } = await supabase
      .from('travel_posts')
      .select('id,user_id,image_url,caption,destination_id,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(mapPostRow);
  };

  // Travel posts from people the current user follows, newest first — the
  // home screen's "من مجتمعك" section. No likes/comments exist yet, so the
  // feed only shows real post content, not fabricated engagement counts.
  const loadFollowingFeed = async (limit = 6): Promise<FeedPost[]> => {
    if (followingIds.length === 0) return [];
    const { data } = await supabase
      .from('travel_posts')
      .select('id,user_id,image_url,caption,destination_id,created_at,author:profiles!travel_posts_user_id_fkey(id,name,username,avatar_url)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);
    return ((data ?? []) as any[])
      .filter((row) => row.author)
      .map((row) => ({
        post: mapPostRow(row),
        author: {
          id: row.author.id,
          name: row.author.name,
          username: row.author.username,
          avatarUrl: row.author.avatar_url,
        },
      }));
  };

  const mapBudgetRow = (row: any): BudgetItem => ({
    id: row.id,
    category: row.category,
    label: row.label,
    amount: Number(row.amount) || 0,
    paidBy: row.paid_by ?? null,
    splitBetween: row.split_between ?? [],
  });

  const mapItineraryRow = (row: any): ItineraryItem => ({
    id: row.id,
    day: row.day,
    time: row.time,
    title: row.title,
    note: row.note ?? undefined,
    itemDate: row.item_date ?? null,
    slot: row.slot ?? null,
    addedBy: row.added_by ?? null,
    placeId: row.place_id ?? null,
    kind: row.kind ?? 'place',
    done: row.done ?? false,
  });

  const mapChecklistRow = (row: any): ChecklistItem => ({
    id: row.id,
    group: row.group_name,
    title: row.title,
    assigneeId: row.assignee_id ?? null,
    dueDate: row.due_date ?? null,
    done: row.done,
  });

  const mapTripRow = (row: any): Trip => {
    const memberIds = Array.from(
      new Set<string>([row.owner_id, ...((row.trip_members ?? []) as any[]).map((m) => m.profile_id)])
    );
    return {
      id: row.id,
      ownerId: row.owner_id,
      title: row.title,
      destination: row.destination,
      coverImage: row.cover_image_url ? { uri: row.cover_image_url } : heroDestination.image,
      startDate: row.start_date,
      endDate: row.end_date,
      memberIds,
      budgetTotal: Number(row.budget_total) || 0,
      budgetItems: ((row.budget_items ?? []) as any[]).map(mapBudgetRow),
      itinerary: ((row.itinerary_items ?? []) as any[]).map(mapItineraryRow),
      checklist: ((row.trip_checklist ?? []) as any[]).map(mapChecklistRow),
      shareCode: row.share_code,
      travelerType: (row.traveler_type as TravelerType | null) ?? null,
      needs: ((row.needs ?? []) as TripNeed[]),
      datesMode: (row.dates_mode as TripDatesMode) ?? 'exact',
      flexibleMonth: row.flexible_month ?? null,
      flexibleDays: row.flexible_days ?? null,
      isPublished: Boolean(row.is_published),
    };
  };

  const TRIP_SELECT =
    'id,owner_id,title,destination,cover_image_url,start_date,end_date,budget_total,share_code,is_published,' +
    'traveler_type,needs,dates_mode,flexible_month,flexible_days,' +
    'trip_members(profile_id),' +
    'budget_items(id,category,label,amount,paid_by,split_between),' +
    'itinerary_items(id,day,time,title,note,item_date,slot,added_by,place_id,kind,done),' +
    'trip_checklist(id,group_name,title,assignee_id,due_date,done)';

  const tripsCacheKey = (userId: string) => `yalla-nsafer:trips-cache:${userId}`;
  // Tracks which profile's trips have actually finished loading (success or
  // offline-fallback), so the persist effect below can't fire on the brief
  // transient render where `profile` has just resolved but `tripsLoading` is
  // still a stale `false` left over from an earlier early-return — which would
  // otherwise overwrite the real offline cache with an empty array.
  const tripsLoadedForRef = useRef<string | null>(null);

  const loadTrips = async () => {
    if (!profile) {
      tripsLoadedForRef.current = null;
      setTrips([]);
      setTripsLoading(false);
      setTripsOffline(false);
      return;
    }
    setTripsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(TRIP_SELECT)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = ((data ?? []) as any[]).map(mapTripRow);
      setTrips(mapped);
      setTripsOffline(false);
      tripsLoadedForRef.current = profile.id;
    } catch {
      // Network/Supabase unavailable — fall back to the last offline-saved copy
      // (SPEC §22.2: the trip schedule stays viewable without internet).
      try {
        const raw = await AsyncStorage.getItem(tripsCacheKey(profile.id));
        if (raw) {
          setTrips(JSON.parse(raw));
          setTripsOffline(true);
        }
      } catch {
        // corrupt cache — leave trips as they were
      }
      tripsLoadedForRef.current = profile.id;
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile || tripsLoading || tripsOffline) return;
    if (tripsLoadedForRef.current !== profile.id) return;
    // Keep the offline copy in sync with every local change (not just a fresh
    // fetch), so a trip created/edited while online is still there if the
    // network drops right after — not just whatever the last full reload saw.
    AsyncStorage.setItem(tripsCacheKey(profile.id), JSON.stringify(trips)).catch(() => {});
  }, [trips, tripsLoading, tripsOffline, profile?.id]);

  const mirrorTripWindow = (trip: Trip) => {
    if (!profile) return;
    const destination = destinations.find((d) => d.name === trip.destination);
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate) ? trip.startDate : null;
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(trip.endDate) ? trip.endDate : null;
    supabase
      .from('trip_windows')
      .upsert(
        {
          user_id: profile.id,
          local_trip_id: trip.id,
          title: trip.title,
          destination_id: destination?.id ?? null,
          start_date: startDate,
          end_date: endDate,
        },
        { onConflict: 'user_id,local_trip_id' }
      )
      .then(() => {});
  };

  const loadMeetupMatches = async () => {
    if (!profile) {
      setMeetupMatches([]);
      return;
    }
    const { data } = await supabase
      .from('trip_windows')
      .select('id,local_trip_id,title,destination_id,start_date,end_date,user_id,user:profiles!trip_windows_user_id_fkey(id,name,username,emoji,color,avatar_url)');
    const rows = (data ?? []) as any[];
    const mine = rows.filter((r) => r.user_id === profile.id && r.destination_id && r.start_date && r.end_date);
    const theirs = rows.filter((r) => r.user_id !== profile.id && r.destination_id && r.start_date && r.end_date);

    const toWindow = (r: any): TripWindow => ({
      id: r.id,
      localTripId: r.local_trip_id,
      title: r.title,
      destinationId: r.destination_id,
      startDate: r.start_date,
      endDate: r.end_date,
    });

    const matches: MeetupMatch[] = [];
    mine.forEach((myRow) => {
      theirs.forEach((theirRow) => {
        if (myRow.destination_id !== theirRow.destination_id) return;
        const overlap = myRow.start_date <= theirRow.end_date && theirRow.start_date <= myRow.end_date;
        if (!overlap) return;
        matches.push({
          user: mapProfileToFriend(theirRow.user),
          destinationId: myRow.destination_id,
          myTrip: toWindow(myRow),
          theirTrip: toWindow(theirRow),
        });
      });
    });
    setMeetupMatches(matches);
  };

  useEffect(() => {
    loadFriends();
    loadBlocked();
    loadFriendRequests();
    loadNotifications();
    loadMyCheckIns();
    loadFollowCounts();
    loadMyPosts();
    loadMeetupMatches();
    loadTrips();
    loadCommunities();
    loadCommunityRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const row = mapNotificationRow(payload.new);
          setNotifications((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const addFriend = async (username: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const handle = username.trim().toLowerCase().replace(/^@/, '');
    if (!handle) return { error: 'اكتب اسم المستخدم' };
    if (handle === profile.username) return { error: 'ما تقدر تضيف نفسك' };

    const { data: found, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', handle)
      .maybeSingle();
    if (lookupError) return { error: 'تعذّر البحث، حاول مرة ثانية' };
    if (!found) return { error: 'ما فيه مستخدم بهذا الاسم' };

    const alreadyFriend = friends.some((f) => f.username === handle);
    if (alreadyFriend) return { error: 'هذا الشخص بالفعل في قائمة أصدقائك' };
    if (outgoingRequests.some((f) => f.id === found.id)) return { error: 'سبق أرسلت له طلب صداقة' };

    const { data: blockRows } = await supabase
      .from('blocked_users')
      .select('blocker_id,blocked_id')
      .or(
        `and(blocker_id.eq.${profile.id},blocked_id.eq.${found.id}),and(blocker_id.eq.${found.id},blocked_id.eq.${profile.id})`
      );
    if (blockRows && blockRows.length > 0) return { error: 'ما تقدر تضيف هذا المستخدم' };

    // If they already sent me a request, accepting it is more natural than
    // sending a second one that would just sit next to theirs.
    const reverseRequest = incomingRequests.some((f) => f.id === found.id);
    if (reverseRequest) {
      return acceptFriendRequest(found.id);
    }

    const { error: insertError } = await supabase
      .from('friend_requests')
      .insert({ sender_id: profile.id, recipient_id: found.id });
    if (insertError) {
      if (insertError.code === '23505') return { error: 'سبق أرسلت له طلب صداقة' };
      return { error: 'تعذّر إرسال الطلب، حاول مرة ثانية' };
    }

    await loadFriendRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requesterId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ user_id: requesterId, friend_id: profile.id });
    if (insertError) return { error: 'تعذّر قبول الطلب، حاول مرة ثانية' };
    await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', requesterId)
      .eq('recipient_id', profile.id);
    await Promise.all([loadFriends(), loadFriendRequests()]);
    return { error: null };
  };

  const declineFriendRequest = async (requesterId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', requesterId)
      .eq('recipient_id', profile.id);
    if (error) return { error: 'تعذّر رفض الطلب، حاول مرة ثانية' };
    setIncomingRequests((prev) => prev.filter((f) => f.id !== requesterId));
    return { error: null };
  };

  const cancelFriendRequest = async (recipientId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', profile.id)
      .eq('recipient_id', recipientId);
    if (error) return { error: 'تعذّر إلغاء الطلب، حاول مرة ثانية' };
    setOutgoingRequests((prev) => prev.filter((f) => f.id !== recipientId));
    return { error: null };
  };

  const removeFriend = async (friendId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(
        `and(user_id.eq.${profile.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${profile.id})`
      );
    if (error) return { error: 'تعذّر الحذف، حاول مرة ثانية' };
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    return { error: null };
  };

  const blockUser = async (friendId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: profile.id, blocked_id: friendId });
    if (error) return { error: 'تعذّر الحظر، حاول مرة ثانية' };
    await supabase
      .from('friendships')
      .delete()
      .or(
        `and(user_id.eq.${profile.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${profile.id})`
      );
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    setBlockedUserIds((prev) => (prev.includes(friendId) ? prev : [...prev, friendId]));
    return { error: null };
  };

  const unblockUser = async (userId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', profile.id)
      .eq('blocked_id', userId);
    if (error) return { error: 'تعذّر إلغاء الحظر، حاول مرة ثانية' };
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
    return { error: null };
  };

  const updateTripLocal = (tripId: string, updater: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? updater(trip) : trip)));
  };

  const createTrip = async (input: NewTripInput): Promise<Trip | null> => {
    if (!profile) return null;
    const coverUri = (input.coverImage as { uri?: string } | undefined)?.uri ?? null;
    const { data, error } = await supabase
      .from('trips')
      .insert({
        owner_id: profile.id,
        title: input.title,
        destination: input.destination,
        cover_image_url: coverUri,
        start_date: input.startDate,
        end_date: input.endDate,
        budget_total: input.budgetTotal,
        traveler_type: input.travelerType,
        needs: input.needs,
        dates_mode: input.datesMode,
        flexible_month: input.flexibleMonth,
        flexible_days: input.flexibleDays,
      })
      .select(
        'id,owner_id,title,destination,cover_image_url,start_date,end_date,budget_total,share_code,traveler_type,needs,dates_mode,flexible_month,flexible_days'
      )
      .single();
    if (error || !data) return null;

    const memberIds = input.memberIds.filter((id) => id !== profile.id);
    if (memberIds.length > 0) {
      await supabase.from('trip_members').insert(memberIds.map((id) => ({ trip_id: data.id, profile_id: id })));
    }

    const trip = mapTripRow({
      ...data,
      trip_members: memberIds.map((id) => ({ profile_id: id })),
      budget_items: [],
      itinerary_items: [],
      trip_checklist: [],
    });
    setTrips((prev) => [trip, ...prev]);
    mirrorTripWindow(trip);
    return trip;
  };

  const confirmTripDates = async (tripId: string, startDate: string, endDate: string) => {
    const { error } = await supabase
      .from('trips')
      .update({ start_date: startDate, end_date: endDate, dates_mode: 'exact' })
      .eq('id', tripId);
    if (error) return;
    updateTripLocal(tripId, (t) => ({ ...t, startDate, endDate, datesMode: 'exact' }));
    const trip = trips.find((t) => t.id === tripId);
    if (trip) mirrorTripWindow({ ...trip, startDate, endDate });
  };

  const publishTrip = async (tripId: string, published: boolean): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('trips')
      .update({ is_published: published })
      .eq('id', tripId)
      .eq('owner_id', profile.id);
    if (error) return { error: 'تعذّر تحديث حالة النشر' };
    updateTripLocal(tripId, (t) => ({ ...t, isPublished: published }));
    return { error: null };
  };

  const copyPublishedTrip = async (tripId: string): Promise<{ tripId: string | null; error: string | null }> => {
    if (!profile) return { tripId: null, error: 'سجّل دخولك أولاً' };
    const { data: tripRow, error: tripError } = await supabase
      .from('trips')
      .select('title,destination,cover_image_url')
      .eq('id', tripId)
      .eq('is_published', true)
      .single();
    if (tripError || !tripRow) return { tripId: null, error: 'تعذّر العثور على الرحلة' };

    const { data: itemRows } = await supabase
      .from('itinerary_items')
      .select('day,time,title,note,item_date,slot,place_id,kind')
      .eq('trip_id', tripId);

    const newTrip = await createTrip({
      title: `نسخة من ${tripRow.title}`,
      destination: tripRow.destination,
      coverImage: tripRow.cover_image_url ? { uri: tripRow.cover_image_url } : heroDestination.image,
      startDate: '—',
      endDate: '—',
      memberIds: [],
      budgetTotal: 0,
      travelerType: null,
      needs: [],
      datesMode: 'vote',
      flexibleMonth: null,
      flexibleDays: null,
    });
    if (!newTrip) return { tripId: null, error: 'تعذّر إنشاء مسودة الرحلة' };

    for (const row of (itemRows ?? []) as any[]) {
      await addItineraryItem(newTrip.id, {
        day: row.day,
        time: row.time,
        title: row.title,
        note: row.note ?? undefined,
        itemDate: null,
        slot: row.slot,
        placeId: row.place_id,
        kind: row.kind,
      });
    }

    return { tripId: newTrip.id, error: null };
  };

  const joinTripByCode = async (code: string): Promise<{ tripId: string | null; error: string | null }> => {
    if (!profile) return { tripId: null, error: 'سجّل دخولك أولاً' };
    const trimmed = code.trim();
    if (!trimmed) return { tripId: null, error: 'اكتب رمز الدعوة' };
    const { data, error } = await supabase.rpc('join_trip_by_code', { _code: trimmed });
    if (error) return { tripId: null, error: 'تعذّر الانضمام، حاول مرة ثانية' };
    if (!data) return { tripId: null, error: 'ما لقينا رحلة بهذا الرمز. تأكد منه مع اللي أرسل لك الدعوة.' };
    await loadTrips();
    return { tripId: data as string, error: null };
  };

  const previewTripByCode = async (code: string): Promise<{ preview: TripPreview | null; error: string | null }> => {
    const trimmed = code.trim();
    if (!trimmed) return { preview: null, error: 'اكتب رمز الدعوة' };
    const { data, error } = await supabase.rpc('preview_trip_by_code', { _code: trimmed });
    if (error) return { preview: null, error: 'تعذّر البحث، حاول مرة ثانية' };
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return { preview: null, error: 'ما لقينا رحلة بهذا الرمز. تأكد منه مع اللي أرسل لك الدعوة.' };
    return {
      preview: {
        tripId: row.trip_id,
        title: row.title,
        destination: row.destination,
        coverImageUrl: row.cover_image_url ?? null,
        startDate: row.start_date,
        endDate: row.end_date,
        ownerName: row.owner_name,
        memberNames: row.member_names ?? [],
        memberCount: row.member_count ?? 0,
        itineraryCount: row.itinerary_count ?? 0,
        alreadyMember: !!row.already_member,
      },
      error: null,
    };
  };

  const addMember = async (tripId: string, friendId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (trip?.memberIds.includes(friendId)) return;
    const { error } = await supabase.from('trip_members').insert({ trip_id: tripId, profile_id: friendId });
    if (error) return;
    updateTripLocal(tripId, (t) => ({
      ...t,
      memberIds: Array.from(new Set([...t.memberIds, friendId])),
    }));
  };

  const addBudgetItem = async (tripId: string, item: Omit<BudgetItem, 'id'>) => {
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        trip_id: tripId,
        category: item.category,
        label: item.label,
        amount: item.amount,
        paid_by: item.paidBy,
        split_between: item.splitBetween,
      })
      .select()
      .single();
    if (error || !data) return;
    updateTripLocal(tripId, (t) => ({ ...t, budgetItems: [...t.budgetItems, mapBudgetRow(data)] }));
  };

  const removeBudgetItem = async (tripId: string, itemId: string) => {
    updateTripLocal(tripId, (t) => ({ ...t, budgetItems: t.budgetItems.filter((b) => b.id !== itemId) }));
    await supabase.from('budget_items').delete().eq('id', itemId);
  };

  const addItineraryItem = async (tripId: string, item: Omit<ItineraryItem, 'id' | 'addedBy' | 'done'>): Promise<ItineraryItem | null> => {
    if (!profile) return null;
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({
        trip_id: tripId,
        day: item.day,
        time: item.time,
        title: item.title,
        note: item.note ?? null,
        item_date: item.itemDate,
        slot: item.slot,
        added_by: profile.id,
        place_id: item.placeId,
        kind: item.kind,
      })
      .select()
      .single();
    if (error || !data) return null;
    const mapped = mapItineraryRow(data);
    updateTripLocal(tripId, (t) => ({ ...t, itinerary: [...t.itinerary, mapped] }));
    return mapped;
  };

  const removeItineraryItem = async (tripId: string, itemId: string) => {
    updateTripLocal(tripId, (t) => ({ ...t, itinerary: t.itinerary.filter((i) => i.id !== itemId) }));
    await supabase.from('itinerary_items').delete().eq('id', itemId);
  };

  const toggleItineraryItemDone = async (tripId: string, itemId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const item = trip?.itinerary.find((i) => i.id === itemId);
    if (!item) return;
    const done = !item.done;
    updateTripLocal(tripId, (t) => ({
      ...t,
      itinerary: t.itinerary.map((i) => (i.id === itemId ? { ...i, done } : i)),
    }));
    await supabase.from('itinerary_items').update({ done }).eq('id', itemId);
  };

  // "أجّل" (SPEC 22.4): pushes the item to the same slot/time tomorrow. A
  // precise "next free gap today" (as the mockup literally says) would need
  // real commute-time + venue-hours data we don't have — same gap already
  // called out and left unfaked in خريطة اليوم's conflict detection — so this
  // is the honest, simple version: move it a day forward, not invent a gap.
  const postponeItineraryItemToTomorrow = async (tripId: string, itemId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const item = trip?.itinerary.find((i) => i.id === itemId);
    if (!item?.itemDate) return;
    const nextDate = new Date(`${item.itemDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    const itemDate = nextDate.toISOString().slice(0, 10);
    updateTripLocal(tripId, (t) => ({
      ...t,
      itinerary: t.itinerary.map((i) => (i.id === itemId ? { ...i, itemDate } : i)),
    }));
    await supabase.from('itinerary_items').update({ item_date: itemDate }).eq('id', itemId);
  };

  const addChecklistItem = async (tripId: string, item: Omit<ChecklistItem, 'id' | 'done'>) => {
    const { data, error } = await supabase
      .from('trip_checklist')
      .insert({
        trip_id: tripId,
        group_name: item.group,
        title: item.title,
        assignee_id: item.assigneeId,
        due_date: item.dueDate,
      })
      .select()
      .single();
    if (error || !data) return;
    updateTripLocal(tripId, (t) => ({ ...t, checklist: [...t.checklist, mapChecklistRow(data)] }));
  };

  const toggleChecklistItem = async (tripId: string, itemId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const item = trip?.checklist.find((c) => c.id === itemId);
    if (!item) return;
    const done = !item.done;
    updateTripLocal(tripId, (t) => ({
      ...t,
      checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done } : c)),
    }));
    await supabase.from('trip_checklist').update({ done }).eq('id', itemId);
  };

  const removeChecklistItem = async (tripId: string, itemId: string) => {
    updateTripLocal(tripId, (t) => ({ ...t, checklist: t.checklist.filter((c) => c.id !== itemId) }));
    await supabase.from('trip_checklist').delete().eq('id', itemId);
  };

  const sendGuideMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = { id: uid('gmsg'), fromId: 'me', text: trimmed, at: Date.now() };
    const history = [...guideMessages, userMessage].slice(-12).map((m) => ({
      role: m.fromId === 'me' ? 'user' : 'assistant',
      content: m.text,
    }));
    setGuideMessages((prev) => [...prev, userMessage]);
    setGuideThinking(true);
    (async () => {
      let replyText: string | null = null;
      let planDays: GuidePlanDay[] | undefined;
      try {
        const { data, error } = await supabase.functions.invoke('guide-chat', {
          body: {
            messages: history,
            destinations: destinations.map((d) => ({
              name: d.name,
              whyVisit: d.whyVisit,
              topHotels: d.topHotels,
              topRestaurants: d.topRestaurants,
              bestMonths: d.bestMonths,
            })),
          },
        });
        if (error) throw error;
        if (typeof data?.reply === 'string' && data.reply.trim()) {
          replyText = stripMarkdownEmphasis(data.reply.trim());
        }
        if (Array.isArray(data?.days) && data.days.length > 0) {
          const valid = data.days.filter(
            (d: any) => d && typeof d.label === 'string' && Array.isArray(d.activities) && d.activities.length > 0
          );
          if (valid.length > 0) planDays = valid;
        }
      } catch {
        // fall back below
      }
      const replyMessage: ChatMessage = {
        id: uid('gmsg'),
        fromId: 'guide',
        text: replyText ?? buildGuideReply(trimmed, destinations),
        at: Date.now() + 1,
        planDays,
      };
      setGuideMessages((prev) => [...prev, replyMessage]);
      setGuideThinking(false);
    })();
  };

  const resetGuideConversation = () => {
    setGuideMessages([WELCOME_MESSAGE]);
  };

  const loadCommunities = async () => {
    setCommunitiesLoading(true);
    const [{ data: communityRows }, { data: memberRows }] = await Promise.all([
      supabase.from('communities').select('id,name,tagline,emoji,color,base_member_count'),
      supabase.from('community_members').select('community_id,profile_id,role'),
    ]);
    const memberCounts: Record<string, number> = {};
    const myMemberships: Record<string, Community['myRole']> = {};
    (memberRows ?? []).forEach((m: any) => {
      memberCounts[m.community_id] = (memberCounts[m.community_id] ?? 0) + 1;
      if (profile && m.profile_id === profile.id) {
        myMemberships[m.community_id] = m.role;
      }
    });
    const mapped: Community[] = (communityRows ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      emoji: c.emoji,
      color: c.color,
      memberCount: (c.base_member_count ?? 0) + (memberCounts[c.id] ?? 0),
      joined: Boolean(myMemberships[c.id]),
      myRole: myMemberships[c.id] ?? null,
    }));
    setCommunities(mapped);
    setCommunitiesLoading(false);
  };

  const loadCommunityRequests = async () => {
    if (!profile) {
      setCommunityRequests([]);
      return;
    }
    const { data } = await supabase
      .from('community_requests')
      .select('id,name,tagline,emoji,reason,status,created_at')
      .eq('requester_id', profile.id)
      .order('created_at', { ascending: false });
    setCommunityRequests(
      (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        tagline: r.tagline,
        emoji: r.emoji,
        reason: r.reason,
        status: r.status,
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
  };

  const joinCommunity = async (communityId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('community_members')
      .insert({ community_id: communityId, profile_id: profile.id });
    if (error && error.code !== '23505') return { error: 'تعذّر الانضمام، حاول مرة ثانية' };
    await loadCommunities();
    return { error: null };
  };

  const leaveCommunity = async (communityId: string): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('profile_id', profile.id);
    if (error) return { error: 'تعذّر مغادرة المجتمع' };
    await loadCommunities();
    return { error: null };
  };

  const submitCommunityRequest = async (input: NewCommunityRequestInput): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase.from('community_requests').insert({
      requester_id: profile.id,
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      emoji: input.emoji.trim() || '🧭',
      reason: input.reason.trim(),
    });
    if (error) return { error: 'تعذّر إرسال الطلب، حاول مرة ثانية' };
    await loadCommunityRequests();
    return { error: null };
  };

  const reportCommunityMessage = async (
    communityId: string,
    messageId: string,
    reason: string
  ): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase.from('community_reports').insert({
      community_id: communityId,
      reporter_id: profile.id,
      reported_message_id: messageId,
      reason: reason.trim() || 'غير محدد',
    });
    if (error) return { error: 'تعذّر إرسال البلاغ' };
    return { error: null };
  };

  const reportCommunityMember = async (
    communityId: string,
    memberId: string,
    reason: string
  ): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'سجّل دخولك أولاً' };
    const { error } = await supabase.from('community_reports').insert({
      community_id: communityId,
      reporter_id: profile.id,
      reported_user_id: memberId,
      reason: reason.trim() || 'غير محدد',
    });
    if (error) return { error: 'تعذّر إرسال البلاغ' };
    return { error: null };
  };

  const setFeedback = (value: Feedback | null) => {
    setFeedbackState(value);
  };

  const toggleVisited = (destinationId: string) => {
    setVisitedStamps((prev) =>
      prev.some((s) => s.destinationId === destinationId)
        ? prev.filter((s) => s.destinationId !== destinationId)
        : [...prev, { destinationId, visitedAt: Date.now() }]
    );
  };

  const toggleRecommended = (placeId: string) => {
    setRecommendedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const toggleFavoriteDestination = (destinationId: string) => {
    setFavoriteDestinationIds((prev) =>
      prev.includes(destinationId) ? prev.filter((id) => id !== destinationId) : [...prev, destinationId]
    );
  };

  const addLoyaltyMembership = (input: Omit<LoyaltyMembership, 'id'>) => {
    setLoyaltyMemberships((prev) => [{ ...input, id: uid('loy') }, ...prev]);
  };

  const removeLoyaltyMembership = (id: string) => {
    setLoyaltyMemberships((prev) => prev.filter((m) => m.id !== id));
  };

  const addWishlistItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWishlist((prev) => [{ id: uid('wish'), name: trimmed }, ...prev]);
  };

  const removeWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const addManualVisitedPlace = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setManualVisitedPlaces((prev) => [{ id: uid('visited'), name: trimmed, visitedAt: Date.now() }, ...prev]);
  };

  const removeManualVisitedPlace = (id: string) => {
    setManualVisitedPlaces((prev) => prev.filter((item) => item.id !== id));
  };

  const addTripTemplate = (input: NewTripTemplateInput): TripTemplate => {
    const template: TripTemplate = {
      id: uid('tpl'),
      title: input.title,
      destinationId: input.destinationId,
      authorName: currentUser.name,
      isMine: true,
      days: input.days,
      items: input.items.map((item) => ({ ...item, id: uid('tplitem') })),
    };
    setTripTemplates((prev) => [template, ...prev]);
    return template;
  };

  const removeTripTemplate = (id: string) => {
    setTripTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const applyTripTemplate = async (templateId: string): Promise<Trip | null> => {
    const template = tripTemplates.find((t) => t.id === templateId);
    if (!template) return null;
    const destination = destinations.find((d) => d.id === template.destinationId);
    const trip = await createTrip({
      title: template.title,
      destination: destination?.name ?? template.destinationId,
      coverImage: destination?.image ?? heroDestination.image,
      startDate: '—',
      endDate: '—',
      memberIds: [],
      budgetTotal: 0,
      travelerType: null,
      needs: [],
      datesMode: 'exact',
      flexibleMonth: null,
      flexibleDays: null,
    });
    if (!trip) return null;
    for (const item of template.items) {
      await addItineraryItem(trip.id, {
        day: 'غير محدد',
        time: '—',
        title: item.label,
        itemDate: null,
        slot: null,
        placeId: null,
        kind: 'place',
      });
    }
    return trip;
  };

  const checkIn = (destinationId: string) => {
    setMyCheckIn(destinationId);
  };

  const checkOut = () => {
    setMyCheckIn(null);
  };

  const searchVenues = async (query: string): Promise<PlaceSearchResult[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    try {
      const { data, error } = await supabase.functions.invoke('places-search', {
        body: { query: trimmed },
      });
      if (error || !Array.isArray(data?.results)) return [];
      return data.results as PlaceSearchResult[];
    } catch {
      return [];
    }
  };

  const checkInToVenue = async (venue: PlaceSearchResult): Promise<{ error: string | null }> => {
    if (!profile) return { error: 'يحتاج حساب حقيقي' };
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: profile.id,
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address,
        venue_category: venue.category,
        lat: venue.lat,
        lng: venue.lng,
      })
      .select('id,venue_id,venue_name,venue_address,venue_category,created_at')
      .single();
    if (error || !data) return { error: 'تعذّر تسجيل الوصول، حاول مرة ثانية' };
    setMyCheckIns((prev) => [mapCheckInRow(data), ...prev]);
    return { error: null };
  };

  const loadVenueCheckIns = async (venueId: string): Promise<CheckInRecord[]> => {
    try {
      const { data } = await supabase
        .from('check_ins')
        .select(
          'id,venue_id,venue_name,venue_address,venue_category,created_at,user:profiles!check_ins_user_id_fkey(id,name,emoji,color,avatar_url)'
        )
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data ?? []).map(mapCheckInRow);
    } catch {
      return [];
    }
  };

  // "مسافرين هنا الحين" on a destination page: real check-ins (not the old
  // static demo list) at any real place within that destination, in the
  // last 24h. RLS on check_ins only exposes your own + friends' rows, so
  // this surfaces friends who are actually there — not a public city count,
  // which the DB doesn't let us compute without inventing a number.
  const loadDestinationCheckIns = async (destinationId: string): Promise<CheckInRecord[]> => {
    try {
      const placeIds = contentPlaces.filter((p) => p.destinationId === destinationId).map((p) => p.id);
      if (placeIds.length === 0) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('check_ins')
        .select(
          'id,venue_id,venue_name,venue_address,venue_category,created_at,user:profiles!check_ins_user_id_fkey(id,name,emoji,color,avatar_url)'
        )
        .in('venue_id', placeIds)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data ?? []).map(mapCheckInRow);
    } catch {
      return [];
    }
  };

  const value = useMemo<AppStateValue>(
    () => ({
      currentUser,
      friends,
      friendsLoading,
      blockedUserIds,
      incomingRequests,
      outgoingRequests,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      trips,
      tripsLoading,
      tripsOffline,
      guideMessages,
      guideThinking,
      communities,
      communitiesLoading,
      communityRequests,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      loyaltyMemberships,
      wishlist,
      manualVisitedPlaces,
      tripTemplates,
      myCheckIn,
      addFriend,
      removeFriend,
      blockUser,
      unblockUser,
      acceptFriendRequest,
      declineFriendRequest,
      cancelFriendRequest,
      createTrip,
      confirmTripDates,
      publishTrip,
      copyPublishedTrip,
      joinTripByCode,
      previewTripByCode,
      addMember,
      addBudgetItem,
      removeBudgetItem,
      addItineraryItem,
      removeItineraryItem,
      toggleItineraryItemDone,
      postponeItineraryItemToTomorrow,
      addChecklistItem,
      toggleChecklistItem,
      removeChecklistItem,
      sendGuideMessage,
      resetGuideConversation,
      joinCommunity,
      leaveCommunity,
      submitCommunityRequest,
      reportCommunityMessage,
      reportCommunityMember,
      setFeedback,
      toggleVisited,
      toggleRecommended,
      toggleFavoriteDestination,
      addLoyaltyMembership,
      removeLoyaltyMembership,
      addWishlistItem,
      removeWishlistItem,
      addManualVisitedPlace,
      removeManualVisitedPlace,
      addTripTemplate,
      removeTripTemplate,
      applyTripTemplate,
      checkIn,
      checkOut,
      myCheckIns,
      myCheckInsLoading,
      searchVenues,
      checkInToVenue,
      loadVenueCheckIns,
      loadDestinationCheckIns,
      followersCount,
      followingCount,
      followingIds,
      followUser,
      unfollowUser,
      loadPublicProfile,
      loadFollowers,
      loadFollowing,
      myPosts,
      myPostsLoading,
      addTravelPost,
      removeTravelPost,
      loadUserPosts,
      loadFollowingFeed,
      meetupMatches,
    }),
    [
      currentUser,
      friends,
      friendsLoading,
      blockedUserIds,
      incomingRequests,
      outgoingRequests,
      notifications,
      trips,
      tripsLoading,
      tripsOffline,
      guideMessages,
      guideThinking,
      communities,
      communitiesLoading,
      communityRequests,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      loyaltyMemberships,
      wishlist,
      manualVisitedPlaces,
      tripTemplates,
      myCheckIn,
      myCheckIns,
      myCheckInsLoading,
      followersCount,
      followingCount,
      followingIds,
      myPosts,
      myPostsLoading,
      meetupMatches,
    ]
  );

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

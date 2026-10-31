import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, type ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedTrips } from '../data/trips';
import { seedCommunities } from '../data/communities';
import { seedTripTemplates } from '../data/tripTemplates';
import { heroDestination, type Destination } from '../data/destinations';
import { useContent } from './ContentContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { useTheme } from './ThemeContext';
import type {
  AirlineReview,
  BudgetItem,
  ChatMessage,
  Community,
  Feedback,
  Friend,
  ItineraryItem,
  LoyaltyMembership,
  Trip,
  TripTemplate,
  TripTemplateItem,
  VisitedStamp,
  WishlistItem,
} from '../types';

const STORAGE_KEY = 'yalla-nsafer:state:v1';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'guide-welcome',
  fromId: 'guide',
  text: 'مرحباً بك في يلا نسافر 👋 أنا دليلك للسفر. اسألني عن أفضل الوجهات، الفنادق، أو المطاعم في أي شهر.',
  at: Date.now(),
};

type PersistedState = {
  trips: Trip[];
  guideMessages: ChatMessage[];
  communities: Community[];
  feedback: Feedback | null;
  visitedStamps: VisitedStamp[];
  recommendedPlaceIds: string[];
  favoriteDestinationIds: string[];
  airlineReviews: AirlineReview[];
  loyaltyMemberships: LoyaltyMembership[];
  wishlist: WishlistItem[];
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
};

type NewTripTemplateInput = {
  title: string;
  destinationId: string;
  days: number;
  price: number;
  items: Omit<TripTemplateItem, 'id'>[];
};

type AppStateValue = {
  currentUser: Friend;
  friends: Friend[];
  trips: Trip[];
  guideMessages: ChatMessage[];
  guideThinking: boolean;
  communities: Community[];
  feedback: Feedback | null;
  visitedStamps: VisitedStamp[];
  recommendedPlaceIds: string[];
  favoriteDestinationIds: string[];
  airlineReviews: AirlineReview[];
  loyaltyMemberships: LoyaltyMembership[];
  wishlist: WishlistItem[];
  tripTemplates: TripTemplate[];
  myCheckIn: string | null;
  friendsLoading: boolean;
  addFriend: (username: string) => Promise<{ error: string | null }>;
  createTrip: (input: NewTripInput) => Trip;
  addMember: (tripId: string, friendId: string) => void;
  addBudgetItem: (tripId: string, item: Omit<BudgetItem, 'id'>) => void;
  removeBudgetItem: (tripId: string, itemId: string) => void;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id'>) => void;
  removeItineraryItem: (tripId: string, itemId: string) => void;
  sendGroupMessage: (tripId: string, text: string) => void;
  sendGuideMessage: (text: string) => void;
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  sendCommunityMessage: (communityId: string, text: string) => void;
  setFeedback: (value: Feedback | null) => void;
  toggleVisited: (destinationId: string) => void;
  toggleRecommended: (placeId: string) => void;
  toggleFavoriteDestination: (destinationId: string) => void;
  addAirlineReview: (input: Omit<AirlineReview, 'id'>) => void;
  removeAirlineReview: (id: string) => void;
  addLoyaltyMembership: (input: Omit<LoyaltyMembership, 'id'>) => void;
  removeLoyaltyMembership: (id: string) => void;
  addWishlistItem: (name: string) => void;
  removeWishlistItem: (id: string) => void;
  addTripTemplate: (input: NewTripTemplateInput) => TripTemplate;
  removeTripTemplate: (id: string) => void;
  applyTripTemplate: (templateId: string) => Trip | null;
  checkIn: (destinationId: string) => void;
  checkOut: () => void;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
  const { destinations } = useContent();
  const { profile, loading: authLoading } = useAuth();
  const currentUser: Friend = profile
    ? { id: 'me', name: profile.name, username: profile.username, emoji: profile.emoji, color: profile.color }
    : authLoading
      ? { id: 'me', name: '...', username: '', emoji: '🧳', color: colors.primary }
      : { id: 'me', name: 'ضيف', username: 'guest', emoji: '🧳', color: colors.textFaint };
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [guideThinking, setGuideThinking] = useState(false);
  const [communities, setCommunities] = useState<Community[]>(seedCommunities);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const [visitedStamps, setVisitedStamps] = useState<VisitedStamp[]>([]);
  const [recommendedPlaceIds, setRecommendedPlaceIds] = useState<string[]>([]);
  const [favoriteDestinationIds, setFavoriteDestinationIds] = useState<string[]>([]);
  const [airlineReviews, setAirlineReviews] = useState<AirlineReview[]>([]);
  const [loyaltyMemberships, setLoyaltyMemberships] = useState<LoyaltyMembership[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
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
          if (Array.isArray(parsed.trips)) {
            setTrips(parsed.trips);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.guideMessages) && parsed.guideMessages.length > 0) {
            setGuideMessages(parsed.guideMessages);
            loadedFromStorage = true;
          }
          if (Array.isArray(parsed.communities)) {
            setCommunities(parsed.communities);
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
          if (Array.isArray(parsed.airlineReviews)) {
            setAirlineReviews(parsed.airlineReviews);
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
      trips,
      guideMessages,
      communities,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      airlineReviews,
      loyaltyMemberships,
      wishlist,
      tripTemplates,
      myCheckIn,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [
    trips,
    guideMessages,
    communities,
    feedback,
    visitedStamps,
    recommendedPlaceIds,
    favoriteDestinationIds,
    airlineReviews,
    loyaltyMemberships,
    wishlist,
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
          .select('friend:profiles!friendships_friend_id_fkey(id,name,username,emoji,color)')
          .eq('user_id', profile.id),
        supabase
          .from('friendships')
          .select('user:profiles!friendships_user_id_fkey(id,name,username,emoji,color)')
          .eq('friend_id', profile.id),
      ]);
      const list: Friend[] = [
        ...((outgoing.data ?? []).map((r: any) => r.friend).filter(Boolean) as Friend[]),
        ...((incoming.data ?? []).map((r: any) => r.user).filter(Boolean) as Friend[]),
      ];
      setFriends(list);
    } catch {
      // keep whatever we had — network/Supabase hiccup
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
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

    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ user_id: profile.id, friend_id: found.id });
    if (insertError) return { error: 'تعذّرت الإضافة، حاول مرة ثانية' };

    await loadFriends();
    return { error: null };
  };

  const createTrip = (input: NewTripInput): Trip => {
    const trip: Trip = {
      id: uid('trip'),
      title: input.title,
      destination: input.destination,
      coverImage: input.coverImage,
      startDate: input.startDate,
      endDate: input.endDate,
      memberIds: Array.from(new Set(['me', ...input.memberIds])),
      budgetTotal: input.budgetTotal,
      budgetItems: [],
      itinerary: [],
      messages: [],
      shareCode: uid('CODE').slice(-8).toUpperCase(),
    };
    setTrips((prev) => [trip, ...prev]);
    return trip;
  };

  const updateTrip = (tripId: string, updater: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? updater(trip) : trip)));
  };

  const addMember = (tripId: string, friendId: string) => {
    updateTrip(tripId, (trip) =>
      trip.memberIds.includes(friendId)
        ? trip
        : { ...trip, memberIds: [...trip.memberIds, friendId] }
    );
  };

  const addBudgetItem = (tripId: string, item: Omit<BudgetItem, 'id'>) => {
    updateTrip(tripId, (trip) => ({
      ...trip,
      budgetItems: [...trip.budgetItems, { ...item, id: uid('budget') }],
    }));
  };

  const removeBudgetItem = (tripId: string, itemId: string) => {
    updateTrip(tripId, (trip) => ({
      ...trip,
      budgetItems: trip.budgetItems.filter((item) => item.id !== itemId),
    }));
  };

  const addItineraryItem = (tripId: string, item: Omit<ItineraryItem, 'id'>) => {
    updateTrip(tripId, (trip) => ({
      ...trip,
      itinerary: [...trip.itinerary, { ...item, id: uid('itin') }],
    }));
  };

  const removeItineraryItem = (tripId: string, itemId: string) => {
    updateTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.filter((item) => item.id !== itemId),
    }));
  };

  const sendGroupMessage = (tripId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    updateTrip(tripId, (trip) => ({
      ...trip,
      messages: [...trip.messages, { id: uid('msg'), fromId: 'me', text: trimmed, at: Date.now() }],
    }));
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
          replyText = data.reply.trim();
        }
      } catch {
        // fall back below
      }
      const replyMessage: ChatMessage = {
        id: uid('gmsg'),
        fromId: 'guide',
        text: replyText ?? buildGuideReply(trimmed, destinations),
        at: Date.now() + 1,
      };
      setGuideMessages((prev) => [...prev, replyMessage]);
      setGuideThinking(false);
    })();
  };

  const updateCommunity = (communityId: string, updater: (community: Community) => Community) => {
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? updater(c) : c)));
  };

  const joinCommunity = (communityId: string) => {
    updateCommunity(communityId, (c) => (c.joined ? c : { ...c, joined: true }));
  };

  const leaveCommunity = (communityId: string) => {
    updateCommunity(communityId, (c) => (c.joined ? { ...c, joined: false } : c));
  };

  const sendCommunityMessage = (communityId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    updateCommunity(communityId, (c) => ({
      ...c,
      joined: true,
      messages: [...c.messages, { id: uid('cmsg'), fromName: currentUser.name, text: trimmed, at: Date.now() }],
    }));
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

  const addAirlineReview = (input: Omit<AirlineReview, 'id'>) => {
    setAirlineReviews((prev) => [{ ...input, id: uid('air') }, ...prev]);
  };

  const removeAirlineReview = (id: string) => {
    setAirlineReviews((prev) => prev.filter((r) => r.id !== id));
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

  const addTripTemplate = (input: NewTripTemplateInput): TripTemplate => {
    const template: TripTemplate = {
      id: uid('tpl'),
      title: input.title,
      destinationId: input.destinationId,
      authorName: currentUser.name,
      isMine: true,
      days: input.days,
      price: input.price,
      items: input.items.map((item) => ({ ...item, id: uid('tplitem') })),
    };
    setTripTemplates((prev) => [template, ...prev]);
    return template;
  };

  const removeTripTemplate = (id: string) => {
    setTripTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const applyTripTemplate = (templateId: string): Trip | null => {
    const template = tripTemplates.find((t) => t.id === templateId);
    if (!template) return null;
    const destination = destinations.find((d) => d.id === template.destinationId);
    const trip = createTrip({
      title: template.title,
      destination: destination?.name ?? template.destinationId,
      coverImage: destination?.image ?? heroDestination.image,
      startDate: '—',
      endDate: '—',
      memberIds: [],
      budgetTotal: 0,
    });
    template.items.forEach((item) => {
      addItineraryItem(trip.id, { day: 'غير محدد', time: '—', title: item.label });
    });
    return trip;
  };

  const checkIn = (destinationId: string) => {
    setMyCheckIn(destinationId);
  };

  const checkOut = () => {
    setMyCheckIn(null);
  };

  const value = useMemo<AppStateValue>(
    () => ({
      currentUser,
      friends,
      friendsLoading,
      trips,
      guideMessages,
      guideThinking,
      communities,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      airlineReviews,
      loyaltyMemberships,
      wishlist,
      tripTemplates,
      myCheckIn,
      addFriend,
      createTrip,
      addMember,
      addBudgetItem,
      removeBudgetItem,
      addItineraryItem,
      removeItineraryItem,
      sendGroupMessage,
      sendGuideMessage,
      joinCommunity,
      leaveCommunity,
      sendCommunityMessage,
      setFeedback,
      toggleVisited,
      toggleRecommended,
      toggleFavoriteDestination,
      addAirlineReview,
      removeAirlineReview,
      addLoyaltyMembership,
      removeLoyaltyMembership,
      addWishlistItem,
      removeWishlistItem,
      addTripTemplate,
      removeTripTemplate,
      applyTripTemplate,
      checkIn,
      checkOut,
    }),
    [
      currentUser,
      friends,
      friendsLoading,
      trips,
      guideMessages,
      guideThinking,
      communities,
      feedback,
      visitedStamps,
      recommendedPlaceIds,
      favoriteDestinationIds,
      airlineReviews,
      loyaltyMemberships,
      wishlist,
      tripTemplates,
      myCheckIn,
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

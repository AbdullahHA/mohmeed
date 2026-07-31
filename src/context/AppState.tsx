import React, { createContext, useContext, useMemo, useState } from 'react';
import { currentUser, seedFriends } from '../data/friends';
import { seedTrips } from '../data/trips';
import { destinations } from '../data/destinations';
import type { BudgetItem, ChatMessage, Friend, ItineraryItem, Trip } from '../types';

type NewTripInput = {
  title: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  memberIds: string[];
  budgetTotal: number;
};

type AppStateValue = {
  currentUser: Friend;
  friends: Friend[];
  trips: Trip[];
  guideMessages: ChatMessage[];
  addFriend: (name: string) => Friend;
  createTrip: (input: NewTripInput) => Trip;
  addMember: (tripId: string, friendId: string) => void;
  addBudgetItem: (tripId: string, item: Omit<BudgetItem, 'id'>) => void;
  removeBudgetItem: (tripId: string, itemId: string) => void;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id'>) => void;
  removeItineraryItem: (tripId: string, itemId: string) => void;
  sendGroupMessage: (tripId: string, text: string) => void;
  sendGuideMessage: (text: string) => void;
};

const AVATAR_EMOJIS = ['🌵', '🏖️', '🏔️', '🕌', '🚗', '🎈', '🧳', '☕'];
const AVATAR_COLORS = ['#0E5F58', '#FF6A45', '#2E9E6B', '#E85A38', '#5B6B68'];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function buildGuideReply(question: string): string {
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
  const [friends, setFriends] = useState<Friend[]>(seedFriends);
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([
    {
      id: 'guide-welcome',
      fromId: 'guide',
      text: 'مرحباً بك في يلا نسافر 👋 أنا دليلك للسفر. اسألني عن أفضل الوجهات، الفنادق، أو المطاعم في أي شهر.',
      at: Date.now(),
    },
  ]);

  const addFriend = (name: string): Friend => {
    const friend: Friend = {
      id: uid('friend'),
      name,
      username: name.trim().replace(/\s+/g, '_').toLowerCase(),
      emoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };
    setFriends((prev) => [...prev, friend]);
    return friend;
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
    const replyMessage: ChatMessage = {
      id: uid('gmsg'),
      fromId: 'guide',
      text: buildGuideReply(trimmed),
      at: Date.now() + 1,
    };
    setGuideMessages((prev) => [...prev, userMessage, replyMessage]);
  };

  const value = useMemo<AppStateValue>(
    () => ({
      currentUser,
      friends,
      trips,
      guideMessages,
      addFriend,
      createTrip,
      addMember,
      addBudgetItem,
      removeBudgetItem,
      addItineraryItem,
      removeItineraryItem,
      sendGroupMessage,
      sendGuideMessage,
    }),
    [friends, trips, guideMessages]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

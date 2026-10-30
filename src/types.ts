import type { ImageSourcePropType } from 'react-native';

export type Friend = {
  id: string;
  name: string;
  username: string;
  emoji: string;
  color: string;
};

export type BudgetCategory = 'hotels' | 'food' | 'transport' | 'activities' | 'other';

export type BudgetItem = {
  id: string;
  category: BudgetCategory;
  label: string;
  amount: number;
};

export type ItineraryItem = {
  id: string;
  day: string;
  time: string;
  title: string;
  note?: string;
};

export type ChatMessage = {
  id: string;
  fromId: string;
  text: string;
  at: number;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  coverImage: ImageSourcePropType;
  startDate: string;
  endDate: string;
  memberIds: string[];
  budgetTotal: number;
  budgetItems: BudgetItem[];
  itinerary: ItineraryItem[];
  messages: ChatMessage[];
  shareCode: string;
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  hotels: 'الفنادق',
  food: 'المطاعم',
  transport: 'التنقل',
  activities: 'الأنشطة',
  other: 'أخرى',
};

export type CommunityMessage = {
  id: string;
  fromName: string;
  text: string;
  at: number;
};

export type Community = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  baseMemberCount: number;
  joined: boolean;
  messages: CommunityMessage[];
};

export type Feedback = {
  rating: 1 | 2 | 3 | 4 | 5;
  reasons: string[];
  note: string;
};

export type VisitedStamp = {
  destinationId: string;
  visitedAt: number;
};

export type AirlineReview = {
  id: string;
  fromCity: string;
  toCity: string;
  airline: string;
  note: string;
  rating: number;
};

export type TripTemplateItem = {
  id: string;
  category: BudgetCategory;
  label: string;
};

export type TripTemplate = {
  id: string;
  title: string;
  destinationId: string;
  authorName: string;
  isMine: boolean;
  days: number;
  price: number;
  items: TripTemplateItem[];
};

export type CheckInPeer = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

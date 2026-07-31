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
  coverImage: string;
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

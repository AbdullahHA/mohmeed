/** نموذج البيانات. نفس الحقول في Supabase (supabase/migrations) بصيغة snake_case. */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISOTime = string; // HH:MM

export type Category = 'food' | 'cafe' | 'events' | 'experiences' | 'hotels' | 'landmarks' | 'nature' | 'shopping';
export type TravelerType = 'solo' | 'couple' | 'family' | 'group';
export type Need = 'kids_under_5' | 'elderly' | 'wheelchair';
export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'evening';
export type Role = 'organizer' | 'member' | 'viewer';
export type Visibility = 'private' | 'followers' | 'public';
export type SceneName = 'desert' | 'sea' | 'city' | 'green' | 'night' | 'food' | 'old' | 'mountain';

export interface Base {
  id: ID;
  updatedAt: number;
  deleted?: boolean;
}

export interface User extends Base {
  name: string;
  handle: string;
  color: string;
  bio: string;
  city: string;
  languages: string[];
  travelSince: number;
  verified: boolean;
  localExpertCity?: string;
  avatarUrl?: string | null;
  coverScene: SceneName;
  interests: string[];
  cuisines: string[];
  dietary: string[];
  travelerType?: TravelerType;
  budget?: 'low' | 'mid' | 'high';
  pace?: 'relaxed' | 'balanced' | 'packed';
  privacyTrips: Visibility;
  showHere: boolean;
  isAdmin?: boolean;
}

export interface Follow extends Base {
  followerId: ID;
  followingId: ID;
}

export interface City extends Base {
  name: string;
  country: string;
  countryCode: string;
  region: string;
  scene: SceneName;
  lat: number;
  lng: number;
  blurb: string;
  /** 12 شهر: 2 ممتاز، 1 مقبول، 0 غير مناسب */
  bestMonths: number[];
  budgetPerDay: number;
  flightFromRUH?: number;
  tempNow: number;
  tempNight: number;
  ourRating: number;
  ourCount: number;
  googleRating: number;
  googleCount: number;
  group: 'saudi' | 'gulf' | 'europe' | 'asia';
}

export interface Place extends Base {
  name: string;
  category: Category;
  cityId: ID;
  kind: string;
  cuisine?: string;
  priceLevel: 1 | 2 | 3 | 4;
  avgMin?: number;
  avgMax?: number;
  rating: number;
  ratingCount: number;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  website?: string;
  menuUrl?: string;
  open: ISOTime;
  close: ISOTime;
  amenities: ('parking' | 'wifi' | 'family' | 'reservation' | 'wheelchair' | 'halal' | 'prayer' | 'kids')[];
  tags: string[];
  scene: SceneName;
  photo?: string | null;
  description: string;
  featured?: boolean;
  sponsored?: boolean;
  trending?: boolean;
  bestTime?: string;
  durationMin: number;
  eventDates?: string;
  ticketFrom?: number;
  affiliateUrl?: string;
}

export interface Trip extends Base {
  title: string;
  cityId: ID;
  startDate?: ISODate | null;
  endDate?: ISODate | null;
  flexMonth?: number | null;
  flexDays?: number | null;
  datesMode: 'fixed' | 'flexible' | 'vote';
  travelerType: TravelerType;
  needs: Need[];
  ownerId: ID;
  visibility: Visibility;
  scene: SceneName;
  plannedBudget: number;
  inviteCode: string;
  published: boolean;
  offlineSavedAt?: number | null;
  createdAt: number;
}

export interface TripMember extends Base {
  tripId: ID;
  userId: ID;
  role: Role;
}

export interface TripItem extends Base {
  tripId: ID;
  placeId?: ID | null;
  title?: string;
  day?: ISODate | null;
  slot?: Slot | null;
  time?: ISOTime | null;
  durationMin?: number;
  addedBy: ID;
  via?: 'poll' | 'guide' | 'doc';
  note?: string;
  order: number;
}

export type ExpenseCategory = 'stay' | 'food' | 'transport' | 'activities' | 'other';
export interface Expense extends Base {
  tripId: ID;
  paidBy: ID;
  amount: number;
  currency: string;
  amountSar: number;
  fxRate: number;
  category: ExpenseCategory;
  splitBetween: ID[];
  note: string;
  fromChat?: boolean;
  createdAt: number;
}

export interface ChecklistItem extends Base {
  tripId: ID;
  group: 'bookings' | 'bag' | 'docs' | 'other';
  title: string;
  assigneeId?: ID | null;
  done: boolean;
  due?: ISODate | null;
}

export interface TripDoc extends Base {
  tripId: ID;
  ownerId: ID;
  kind: 'flight' | 'stay' | 'ticket' | 'private' | 'other';
  visibility: 'shared' | 'private';
  title: string;
  data: Record<string, string>;
  fileUri?: string | null;
  startsAt?: string | null;
}

export interface DateVote extends Base {
  tripId: ID;
  userId: ID;
  date: ISODate;
}

export interface Chat extends Base {
  type: 'trip' | 'community' | 'direct' | 'guide';
  tripId?: ID | null;
  communityId?: ID | null;
  memberIds: ID[];
  title?: string;
  pinned?: ID[];
  muted?: ID[];
}

export interface Message extends Base {
  chatId: ID;
  senderId: ID;
  kind: 'text' | 'place' | 'poll' | 'expense' | 'image' | 'system' | 'plan';
  body?: string;
  placeId?: ID | null;
  pollId?: ID | null;
  expenseId?: ID | null;
  plan?: GuidePlan | null;
  createdAt: number;
}

export interface GuidePlan {
  cityId: ID;
  intro: string;
  days: { title: string; placeIds: ID[]; notes: string[] }[];
}

export interface Poll extends Base {
  chatId: ID;
  question: string;
  options: { id: ID; label: string; placeId?: ID | null }[];
  votes: Record<ID, ID>;
  closed: boolean;
  target?: { tripId: ID; day: ISODate; slot: Slot } | null;
  createdBy: ID;
}

export interface ChatRead extends Base {
  chatId: ID;
  userId: ID;
  lastReadAt: number;
}

export interface Post extends Base {
  userId: ID;
  photos: SceneName[];
  photoUris?: string[];
  body: string;
  placeId?: ID | null;
  tripId?: ID | null;
  type: 'post' | 'review' | 'recap';
  likes: ID[];
  comments: number;
  createdAt: number;
}

export interface Review extends Base {
  userId: ID;
  placeId: ID;
  rating: number;
  tags: string[];
  text: string;
  createdAt: number;
}

export interface Community extends Base {
  name: string;
  icon: string;
  color: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: ID;
  memberIds: ID[];
  moderatorIds: ID[];
  rejectReason?: string;
}

export interface Report extends Base {
  reporterId: ID;
  communityId?: ID | null;
  messageId?: ID | null;
  userId?: ID | null;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: number;
}

export type NotifKind = 'invite' | 'poll' | 'reminder' | 'like' | 'follow' | 'task' | 'overlap' | 'message' | 'community';
export interface AppNotification extends Base {
  userId: ID;
  kind: NotifKind;
  actorId?: ID | null;
  text: string;
  createdAt: number;
  read: boolean;
  refId?: ID | null;
}

export interface Story extends Base {
  title: string;
  scene: SceneName;
  cityId?: ID | null;
  slides: { title: string; text: string }[];
  startsAt: ISODate;
  endsAt: ISODate;
}

export interface Checkin extends Base {
  userId: ID;
  placeId: ID;
  cityId: ID;
  createdAt: number;
}

export interface StampRec extends Base {
  userId: ID;
  cityId: ID;
  date: ISODate;
  manual?: boolean;
}

export interface CountryInfo extends Base {
  code: string;
  name: string;
  visaSA: string;
  visaGCC: string;
  passportMonths: number;
  currency: string;
  plugs: string;
  sim: string;
  emergency: string;
  embassy: string;
  sourceUrl: string;
}

export interface SavedPlace extends Base {
  userId: ID;
  placeId: ID;
}

export interface Wish extends Base {
  userId: ID;
  cityId: ID;
}

export interface LocationShare extends Base {
  userId: ID;
  withUserId: ID;
  expiresAt: number;
  active: boolean;
}

export interface Flag extends Base {
  key: 'sponsored_places' | 'affiliate_booking' | 'premium';
  enabled: boolean;
}

export interface Db {
  users: User[];
  follows: Follow[];
  cities: City[];
  places: Place[];
  trips: Trip[];
  members: TripMember[];
  items: TripItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  docs: TripDoc[];
  dateVotes: DateVote[];
  chats: Chat[];
  messages: Message[];
  polls: Poll[];
  reads: ChatRead[];
  posts: Post[];
  reviews: Review[];
  communities: Community[];
  reports: Report[];
  notifications: AppNotification[];
  stories: Story[];
  checkins: Checkin[];
  stamps: StampRec[];
  countries: CountryInfo[];
  saved: SavedPlace[];
  wishes: Wish[];
  shares: LocationShare[];
  flags: Flag[];
}
export type Collection = keyof Db;

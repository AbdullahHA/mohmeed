import type { ImageSourcePropType } from 'react-native';

export type Friend = {
  id: string;
  name: string;
  username: string;
  emoji: string;
  color: string;
  avatarUrl?: string | null;
};

export type BudgetCategory = 'hotels' | 'food' | 'transport' | 'activities' | 'other';

export type BudgetItem = {
  id: string;
  category: BudgetCategory;
  label: string;
  amount: number;
  paidBy: string | null;
  splitBetween: string[];
};

export type ItinerarySlot = 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'evening';
export type ItineraryKind = 'place' | 'note' | 'flight' | 'stay';

export type ItineraryItem = {
  id: string;
  day: string;
  time: string;
  title: string;
  note?: string;
  itemDate: string | null;
  slot: ItinerarySlot | null;
  addedBy: string | null;
  placeId: string | null;
  kind: ItineraryKind;
};

export type ChecklistGroup = 'الحجوزات' | 'الشنطة' | 'الأوراق' | 'أخرى';

export type ChecklistItem = {
  id: string;
  group: ChecklistGroup;
  title: string;
  assigneeId: string | null;
  dueDate: string | null;
  done: boolean;
};

export type ChatMessage = {
  id: string;
  fromId: string;
  text: string;
  at: number;
};

export type TravelerType = 'solo' | 'couple' | 'family' | 'group';
export type TripNeed = 'kids_under_5' | 'elderly' | 'wheelchair';
export type TripDatesMode = 'exact' | 'flexible' | 'vote';

export const TRAVELER_TYPE_LABELS: Record<TravelerType, string> = {
  solo: 'لحالي',
  couple: 'مع شريكي',
  family: 'مع العائلة',
  group: 'مع الشلة',
};

export const TRIP_NEED_LABELS: Record<TripNeed, string> = {
  kids_under_5: 'أطفال تحت 5',
  elderly: 'كبار سن',
  wheelchair: 'كرسي متحرك',
};

export type TripDateVote = {
  id: string;
  tripId: string;
  userId: string;
  date: string;
};

export type Trip = {
  id: string;
  ownerId: string;
  title: string;
  destination: string;
  coverImage: ImageSourcePropType;
  startDate: string;
  endDate: string;
  memberIds: string[];
  budgetTotal: number;
  budgetItems: BudgetItem[];
  itinerary: ItineraryItem[];
  checklist: ChecklistItem[];
  shareCode: string;
  travelerType: TravelerType | null;
  needs: TripNeed[];
  datesMode: TripDatesMode;
  flexibleMonth: string | null;
  flexibleDays: number | null;
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

export type LoyaltyMembership = {
  id: string;
  airline: string;
  memberNumber: string;
};

// A free-text "I've been here" stamp — unlike VisitedStamp (which only
// covers destinations in our own catalog), this lets someone log any
// country or city, matching how real travel-passport features work.
export type ManualVisitedPlace = {
  id: string;
  name: string;
  visitedAt: number;
};

export type WishlistItem = {
  id: string;
  name: string;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  at: number;
};

export type TripMessage = {
  id: string;
  tripId: string;
  fromId: string;
  text: string;
  at: number;
};

export type CheckInPeer = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

// Real venue search result from the places-search edge function (Google Places).
export type VenueCategory = 'restaurant' | 'cafe' | 'hotel' | 'shopping' | 'attraction' | 'other';

export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string;
  category: VenueCategory;
  lat: number | null;
  lng: number | null;
};

// A real check-in at a searched venue, stored in Supabase (not the destination-only local demo).
export type CheckInRecord = {
  id: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  category: VenueCategory;
  createdAt: number;
  user?: {
    id: string;
    name: string;
    emoji?: string | null;
    color?: string | null;
    avatarUrl?: string | null;
  };
};

// A public photo post on someone's profile ("مدونات").
export type TravelPost = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  destinationId: string | null;
  createdAt: number;
};

// A travel post from someone the current user follows, for the home
// screen's "من مجتمعك" feed.
export type FeedPost = {
  post: TravelPost;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
};

// Minimal public profile info for the other-user ("كما يشوفه غيري") view.
export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  emoji: string;
  color: string;
  avatarUrl?: string | null;
  bio?: string | null;
  interests: string[];
};

// A lightweight mirror of a local trip's destination + dates, used only to
// find genuine overlaps with people you follow ("نلتقي؟"). Full trip
// content (budget, itinerary, chat) never leaves the device.
export type TripWindow = {
  id: string;
  localTripId: string;
  title: string;
  destinationId: string | null;
  startDate: string | null;
  endDate: string | null;
};

// A detected overlap: someone you follow has a trip to the same destination
// with dates that intersect one of your own trips.
export type MeetupMatch = {
  user: Friend;
  destinationId: string;
  myTrip: TripWindow;
  theirTrip: TripWindow;
};

export type VisaStatus = 'required' | 'on_arrival' | 'e_visa' | 'none';
export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  required: 'تأشيرة مسبقة مطلوبة',
  on_arrival: 'تأشيرة عند الوصول',
  e_visa: 'تأشيرة إلكترونية',
  none: 'بدون تأشيرة',
};

export type CountryInfo = {
  country: string;
  visaStatus: VisaStatus | null;
  passportValidityMonths: number | null;
  currency: string | null;
  plugTypes: string[];
  esimAvailable: boolean;
  emergencyNumber: string | null;
  embassyAddress: string | null;
  embassyPhone: string | null;
  sourceUrl: string | null;
  updatedAt: number;
};

export type TripDocumentKind = 'flight' | 'stay' | 'ticket' | 'personal';
export type TripDocumentVisibility = 'shared' | 'private';

export const TRIP_DOCUMENT_KIND_LABELS: Record<TripDocumentKind, string> = {
  flight: 'طيران',
  stay: 'سكن',
  ticket: 'تذاكر',
  personal: 'خاص فيك',
};

export type FlightDocumentData = {
  airportFrom: string;
  airportTo: string;
  flightNumber: string;
  gate: string;
  seat: string;
  bookingRef: string;
};

export type StayDocumentData = {
  address: string;
  checkInTime: string;
  bookingRef: string;
  phone: string;
};

export type TripDocument = {
  id: string;
  tripId: string;
  ownerId: string;
  kind: TripDocumentKind;
  visibility: TripDocumentVisibility;
  title: string;
  data: Record<string, string>;
  fileUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: number;
};

export type QuickRateTag = 'يستاهل' | 'زحمة' | 'غالي' | 'للعوائل';
export const QUICK_RATE_TAGS: QuickRateTag[] = ['يستاهل', 'زحمة', 'غالي', 'للعوائل'];

export type PlaceQuickRating = {
  id: string;
  placeId: string;
  userId: string;
  stars: number;
  tags: QuickRateTag[];
  note: string | null;
  createdAt: number;
  user: { name: string; avatarUrl: string | null } | null;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Discover: undefined;
  Trips: undefined;
  Home: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlaceDetail: { placeId: string };
  DestinationDetail: { destinationId: string };
  TripDetail: { tripId: string };
  CreateTrip: { destinationId?: string } | undefined;
  JoinTrip: undefined;
  GroupChat: { tripId: string };
  GuideChat: undefined;
  CommunityChat: { communityId: string };
  AddFriend: undefined;
  EditProfile: undefined;
  AddLoyaltyMembership: undefined;
  AddWishlistItem: undefined;
  Settings: undefined;
  About: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  TripTemplates: undefined;
  TripTemplateDetail: { templateId: string };
  CreateTripTemplate: undefined;
  AddAirlineReview: undefined;
  AdminDashboard: undefined;
  AdminEditDestination: { destinationId: string };
  AdminEditPlace: { placeId: string };
  AdminNotifications: undefined;
};

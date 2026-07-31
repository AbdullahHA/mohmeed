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
  TripDetail: { tripId: string };
  CreateTrip: undefined;
  GroupChat: { tripId: string };
  AddFriend: undefined;
};

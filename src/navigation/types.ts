import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Trips: undefined;
  Discover: undefined;
  CheckIn: undefined;
  Trending: { city?: string } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlaceDetail: { placeId: string };
  TripDetail: { tripId: string };
  Chat: { tripId?: string } | undefined;
  Dashboard: undefined;
};

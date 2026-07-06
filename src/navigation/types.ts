import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Discover: undefined;
  Trips: undefined;
  Home: undefined;
  Chat: undefined;
  Bookings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlaceDetail: { placeId: string };
};

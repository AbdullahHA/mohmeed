import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Category } from '../data/types';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Trips: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Results: { category?: Category; cityId?: string; query?: string; when?: string };
  Search: undefined;
  Place: { id: string };
  City: { id: string };
  CreateTrip: { cityId?: string } | undefined;
  Trip: { id: string; tab?: 'schedule' | 'budget' | 'checklist' };
  TripMap: { id: string; day?: string };
  Docs: { id: string };
  Dates: { id: string };
  Chat: { id: string };
  Guide: { q?: string } | undefined;
  Notifications: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Passport: { userId?: string } | undefined;
  User: { id: string };
  People: { userId: string; tab: 'followers' | 'following' };
  Join: { code?: string } | undefined;
  Checkin: undefined;
  Communities: undefined;
  NewPost: { tripId?: string; placeId?: string; recap?: boolean } | undefined;
  PublicTrip: { id: string };
  Story: { id: string };
  Wallet: undefined;
  Privacy: undefined;
};

export type RootProps<K extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, K>;
export type TabProps<K extends keyof TabParamList> = CompositeScreenProps<BottomTabScreenProps<TabParamList, K>, NativeStackScreenProps<RootStackParamList>>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

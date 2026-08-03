import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import TripsScreen from '../screens/TripsScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CheckInScreen from '../screens/CheckInScreen';
import TrendingScreen from '../screens/TrendingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Trips: 'bag-handle-outline',
  Discover: 'compass-outline',
  CheckIn: 'navigate-outline',
  Trending: 'flame-outline',
  Profile: 'person-outline',
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Trips: 'رحلاتي',
  Discover: 'اكتشف',
  CheckIn: 'وصلت',
  Trending: 'الرائج',
  Profile: 'حسابي',
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Trips"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabel: TAB_LABELS[route.name as keyof MainTabParamList],
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semiBold },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import TripsScreen from '../screens/TripsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import DestinationDetailScreen from '../screens/DestinationDetailScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import JoinTripScreen from '../screens/JoinTripScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import GuideChatScreen from '../screens/GuideChatScreen';
import CommunityChatScreen from '../screens/CommunityChatScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import TripTemplatesScreen from '../screens/TripTemplatesScreen';
import TripTemplateDetailScreen from '../screens/TripTemplateDetailScreen';
import CreateTripTemplateScreen from '../screens/CreateTripTemplateScreen';
import AddAirlineReviewScreen from '../screens/AddAirlineReviewScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminEditDestinationScreen from '../screens/AdminEditDestinationScreen';
import AdminEditPlaceScreen from '../screens/AdminEditPlaceScreen';
import AdminNotificationsScreen from '../screens/AdminNotificationsScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="JoinTrip" component={JoinTripScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="GuideChat" component={GuideChatScreen} />
      <Stack.Screen name="CommunityChat" component={CommunityChatScreen} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="TripTemplates" component={TripTemplatesScreen} />
      <Stack.Screen name="TripTemplateDetail" component={TripTemplateDetailScreen} />
      <Stack.Screen
        name="CreateTripTemplate"
        component={CreateTripTemplateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddAirlineReview"
        component={AddAirlineReviewScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminEditDestination" component={AdminEditDestinationScreen} />
      <Stack.Screen name="AdminEditPlace" component={AdminEditPlaceScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    </Stack.Navigator>
  );
}

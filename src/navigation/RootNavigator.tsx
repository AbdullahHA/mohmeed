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
import ResultsScreen from '../screens/ResultsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDatesVoteScreen from '../screens/TripDatesVoteScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import DayMapScreen from '../screens/DayMapScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentViewScreen from '../screens/DocumentViewScreen';
import JoinTripScreen from '../screens/JoinTripScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import GuideChatScreen from '../screens/GuideChatScreen';
import CommunityChatScreen from '../screens/CommunityChatScreen';
import CommunityRequestScreen from '../screens/CommunityRequestScreen';
import PublishedTripScreen from '../screens/PublishedTripScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import FriendsScreen from '../screens/FriendsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import SupportScreen from '../screens/SupportScreen';
import NewSupportTicketScreen from '../screens/NewSupportTicketScreen';
import SupportTicketScreen from '../screens/SupportTicketScreen';
import CuratedListScreen from '../screens/CuratedListScreen';
import SavedPlacesScreen from '../screens/SavedPlacesScreen';
import FriendChatScreen from '../screens/FriendChatScreen';
import LocationShareScreen from '../screens/LocationShareScreen';
import LocationViewScreen from '../screens/LocationViewScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PassportScreen from '../screens/PassportScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import AddLoyaltyMembershipScreen from '../screens/AddLoyaltyMembershipScreen';
import AddWishlistItemScreen from '../screens/AddWishlistItemScreen';
import AddVisitedPlaceScreen from '../screens/AddVisitedPlaceScreen';
import CheckInSearchScreen from '../screens/CheckInSearchScreen';
import CheckInVenueScreen from '../screens/CheckInVenueScreen';
import MyCheckInsScreen from '../screens/MyCheckInsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import FollowListScreen from '../screens/FollowListScreen';
import AddTravelPostScreen from '../screens/AddTravelPostScreen';
import WalletScreen from '../screens/WalletScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingQuizScreen from '../screens/OnboardingQuizScreen';
import CountrySettingScreen from '../screens/CountrySettingScreen';
import CurrencySettingScreen from '../screens/CurrencySettingScreen';
import CurrencyConverterScreen from '../screens/CurrencyConverterScreen';
import AppearanceSettingScreen from '../screens/AppearanceSettingScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TripTemplatesScreen from '../screens/TripTemplatesScreen';
import TripTemplateDetailScreen from '../screens/TripTemplateDetailScreen';
import CreateTripTemplateScreen from '../screens/CreateTripTemplateScreen';
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
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="TripDatesVote" component={TripDatesVoteScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="DayMap" component={DayMapScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="DocumentView" component={DocumentViewScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="JoinTrip" component={JoinTripScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="GuideChat" component={GuideChatScreen} />
      <Stack.Screen name="CommunityChat" component={CommunityChatScreen} />
      <Stack.Screen name="CommunityRequest" component={CommunityRequestScreen} />
      <Stack.Screen name="PublishedTrip" component={PublishedTripScreen} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="NewSupportTicket" component={NewSupportTicketScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="SupportTicket" component={SupportTicketScreen} />
      <Stack.Screen name="CuratedList" component={CuratedListScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
      <Stack.Screen name="FriendChat" component={FriendChatScreen} />
      <Stack.Screen name="LocationShare" component={LocationShareScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="LocationView" component={LocationViewScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Passport" component={PassportScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen
        name="AddLoyaltyMembership"
        component={AddLoyaltyMembershipScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="AddWishlistItem"
        component={AddWishlistItemScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="AddVisitedPlace"
        component={AddVisitedPlaceScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="CheckInSearch"
        component={CheckInSearchScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="CheckInVenue" component={CheckInVenueScreen} />
      <Stack.Screen name="MyCheckIns" component={MyCheckInsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen
        name="AddTravelPost"
        component={AddTravelPostScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="OnboardingQuiz" component={OnboardingQuizScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="CountrySetting" component={CountrySettingScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="CurrencySetting" component={CurrencySettingScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="AppearanceSetting" component={AppearanceSettingScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TripTemplates" component={TripTemplatesScreen} />
      <Stack.Screen name="TripTemplateDetail" component={TripTemplateDetailScreen} />
      <Stack.Screen
        name="CreateTripTemplate"
        component={CreateTripTemplateScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminEditDestination" component={AdminEditDestinationScreen} />
      <Stack.Screen name="AdminEditPlace" component={AdminEditPlaceScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    </Stack.Navigator>
  );
}

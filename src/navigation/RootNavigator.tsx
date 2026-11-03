import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../data/store';
import { useUnreadTotal } from '../data/selectors';
import { AuthScreen, OnboardingScreen } from '../screens/Auth';
import { ChatScreen, ChatsScreen, CommunitiesScreen, GuideScreen } from '../screens/Chat';
import { ExploreScreen, ResultsScreen, SearchScreen } from '../screens/Explore';
import { HomeScreen } from '../screens/Home';
import { CheckinScreen, NotificationsScreen, PrivacyScreen, PublicTripScreen, SettingsScreen, StoryScreen, WalletScreen } from '../screens/Misc';
import { CityScreen, PlaceScreen } from '../screens/Place';
import { EditProfileScreen, NewPostScreen, PassportScreen, PeopleScreen, ProfileTab, UserScreen } from '../screens/Profile';
import { DocsScreen, TripMapScreen, TripScreen } from '../screens/Trip';
import { CreateTripScreen, DatesScreen, JoinScreen, TripsScreen } from '../screens/Trips';
import { useAppTheme } from '../theme/ThemeProvider';
import { Txt } from '../ui';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TABS: Record<keyof TabParamList, { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
  Home: { label: 'الرئيسية', icon: 'home-outline', active: 'home' },
  Explore: { label: 'اكتشف', icon: 'compass-outline', active: 'compass' },
  Trips: { label: 'رحلاتي', icon: 'briefcase-outline', active: 'briefcase' },
  Chats: { label: 'المحادثة', icon: 'chatbubbles-outline', active: 'chatbubbles' },
  Profile: { label: 'حسابي', icon: 'person-outline', active: 'person' },
};

/** الشريط السفلي العائم (القسم 2: BottomNav) */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, shadow } = useAppTheme();
  const insets = useSafeAreaInsets();
  const unread = useUnreadTotal();
  return (
    <View
      style={[
        {
          position: 'absolute',
          start: 10,
          end: 10,
          bottom: Math.max(insets.bottom, 10),
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: colors.tabBar,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 6,
          paddingHorizontal: 4,
        },
        shadow.float,
        Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as object) : null,
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((r, i) => {
        const on = state.index === i;
        const t = TABS[r.name as keyof TabParamList];
        return (
          <Pressable
            key={r.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t.label}${r.name === 'Chats' && unread ? `، ${unread} رسائل جديدة` : ''}`}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
              if (!on && !e.defaultPrevented) navigation.navigate(r.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: 18, backgroundColor: on ? colors.primarySoft : 'transparent', minHeight: 48 }}
          >
            <View>
              <Ionicons name={on ? t.active : t.icon} size={21} color={on ? colors.primaryInk : colors.mutedForeground} />
              {r.name === 'Chats' && unread ? (
                <View style={{ position: 'absolute', top: -4, end: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.card }}>
                  <Txt variant="badge" style={{ color: '#fff', fontSize: 10, lineHeight: 12 }}>
                    {unread > 9 ? '9+' : unread}
                  </Txt>
                </View>
              ) : null}
            </View>
            <Txt variant="caption" style={{ fontSize: 11, color: on ? colors.primaryInk : colors.mutedForeground, fontFamily: on ? 'IBMPlexSansArabic_600SemiBold' : 'IBMPlexSansArabic_500Medium' }}>
              {t.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }} initialRouteName="Home">
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const session = useStore((s) => s.session);
  const signedIn = !!session.userId || session.guest;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!signedIn ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !session.onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Place" component={PlaceScreen} />
          <Stack.Screen name="City" component={CityScreen} />
          <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Trip" component={TripScreen} />
          <Stack.Screen name="TripMap" component={TripMapScreen} />
          <Stack.Screen name="Docs" component={DocsScreen} />
          <Stack.Screen name="Dates" component={DatesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Guide" component={GuideScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Passport" component={PassportScreen} />
          <Stack.Screen name="User" component={UserScreen} />
          <Stack.Screen name="People" component={PeopleScreen} />
          <Stack.Screen name="Join" component={JoinScreen} />
          <Stack.Screen name="Checkin" component={CheckinScreen} />
          <Stack.Screen name="Communities" component={CommunitiesScreen} />
          <Stack.Screen name="NewPost" component={NewPostScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="PublicTrip" component={PublicTripScreen} />
          <Stack.Screen name="Story" component={StoryScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

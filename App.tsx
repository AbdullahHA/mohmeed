import { NavigationContainer, DarkTheme, DefaultTheme, type LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AddToTripSheet, QuickReviewSheet, SharePlaceSheet } from './src/components';
import { useStore } from './src/data/store';
import { startSync } from './src/lib/sync';
import RootNavigator from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/types';
import { AppThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { ToastHost } from './src/ui';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'https://yallansafer.app'],
  config: {
    screens: {
      Tabs: { screens: { Home: '', Explore: 'explore', Trips: 'trips', Chats: 'chat', Profile: 'profile' } },
      Join: 'join/:code',
      Place: 'places/:id',
      City: 'city/:id',
      Trip: 'trips/:id',
      PublicTrip: 'p/:id',
      User: 'u/:id',
      Guide: 'guide',
      Settings: 'settings',
      Notifications: 'notifications',
    },
  },
};

function Shell() {
  const { colors, scheme } = useAppTheme();
  const mode = useStore((s) => s.session.mode);
  useEffect(() => (mode === 'cloud' ? startSync() : undefined), [mode]);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      linking={linking}
      documentTitle={{ formatter: () => 'يلا نسافر' }}
      direction="rtl"
      theme={{ ...base, colors: { ...base.colors, background: colors.background, card: colors.card, text: colors.foreground, border: colors.border, primary: colors.primary } }}
    >
      <RootNavigator />
      <AddToTripSheet />
      <SharePlaceSheet />
      <QuickReviewSheet />
      <ToastHost />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <Shell />
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

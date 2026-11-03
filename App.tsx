import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppStateProvider } from './src/context/AppState';
import { ContentProvider } from './src/context/ContentContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RegionProvider } from './src/context/RegionContext';
import AuthGateScreen from './src/screens/AuthGateScreen';
import AppIntro from './src/components/AppIntro';
import BiometricLockGate from './src/components/BiometricLockGate';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

void SplashScreen.preventAutoHideAsync();

function Gate() {
  const { session, guestMode, loading } = useAuth();
  const { colors, scheme } = useTheme();

  const navigationTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session && !guestMode) {
    return <AuthGateScreen />;
  }

  return (
    <ContentProvider>
      <AppStateProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AppStateProvider>
    </ContentProvider>
  );
}

function AppShell() {
  const [showIntro, setShowIntro] = useState(true);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    // Matches the native background to the current theme so there's no
    // white flash on launch or screen transitions (Android especially).
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BiometricLockGate>
          <Gate />
        </BiometricLockGate>
      </AuthProvider>
      {showIntro && <AppIntro onDone={() => setShowIntro(false)} />}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <RegionProvider>
        <AppShell />
      </RegionProvider>
    </ThemeProvider>
  );
}

export default sentryDsn ? Sentry.wrap(App) : App;

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppStateProvider } from './src/context/AppState';
import { ContentProvider } from './src/context/ContentContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AuthGateScreen from './src/screens/AuthGateScreen';
import AppIntro from './src/components/AppIntro';

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
  const { scheme } = useTheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
      {showIntro && <AppIntro onDone={() => setShowIntro(false)} />}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

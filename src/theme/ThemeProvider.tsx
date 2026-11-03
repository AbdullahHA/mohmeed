/**
 * المظهر (فاتح / داكن / تلقائي) + تحميل الخط + RTL.
 * "تلقائي" هو الافتراضي ويتبع إعداد الجوال مباشرة.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform, useColorScheme } from 'react-native';

import { palette, shadow, type ColorScheme, type Colors } from './tokens';

export type ThemeChoice = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'yalla-theme';

// التطبيق عربي فقط. في iOS/Android يتفعّل RTL من إعداد expo-localization في app.json،
// وهذا احتياط لو انبنى بدونه (يحتاج إعادة تشغيل أول مرة).
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

void SplashScreen.preventAutoHideAsync().catch(() => {});

type Ctx = {
  choice: ThemeChoice;
  scheme: ColorScheme;
  colors: Colors;
  shadow: (typeof shadow)[ColorScheme];
  setChoice: (c: ThemeChoice) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoiceState] = useState<ThemeChoice>('system');
  const [loaded, setLoaded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setChoiceState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const scheme: ColorScheme = choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice;
  const colors = palette[scheme] as Colors;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.background;
      document.documentElement.style.colorScheme = scheme;
    }
  }, [colors.background, scheme]);

  const ready = (fontsLoaded || !!fontError) && loaded;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    void AsyncStorage.setItem(STORAGE_KEY, c).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ choice, scheme, colors, shadow: shadow[scheme], setChoice }),
    [choice, scheme, colors, setChoice],
  );

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return ctx;
}

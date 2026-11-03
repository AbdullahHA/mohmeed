/**
 * يلا نسافر — المظهر (فاتح / داكن / تلقائي) + الخط + RTL لـ Expo
 *
 * التثبيت:
 *   npx expo install @expo-google-fonts/ibm-plex-sans-arabic expo-font expo-splash-screen \
 *     @react-native-async-storage/async-storage expo-status-bar expo-system-ui
 *
 * app.json (تأكد من صيغة نسخة Expo عندك في التوثيق الرسمي):
 *   "userInterfaceStyle": "automatic",
 *   "extra": { "supportsRTL": true, "forcesRTL": true },
 *   "ios": { "infoPlist": { "CFBundleDevelopmentRegion": "ar" } }
 *
 * الاستخدام في app/_layout.tsx (expo-router):
 *   export default function RootLayout() {
 *     return (
 *       <AppThemeProvider>
 *         <Stack screenOptions={{ headerShown: false }} />
 *       </AppThemeProvider>
 *     );
 *   }
 *
 * داخل أي شاشة:
 *   const { colors, scheme, choice, setChoice } = useAppTheme();
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nManager, Platform, useColorScheme } from "react-native";

import { palette, shadow, type ColorScheme, type Colors } from "./tokens";

export type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "yalla-theme";

// RTL: التطبيق عربي فقط. يحتاج إعادة تشغيل أول مرة على الجوال.
if (Platform.OS !== "web" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.dir = "rtl";
  document.documentElement.lang = "ar";
}

void SplashScreen.preventAutoHideAsync();

type Ctx = {
  choice: ThemeChoice;
  scheme: ColorScheme;
  colors: Colors;
  shadow: (typeof shadow)[ColorScheme];
  setChoice: (c: ThemeChoice) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme(); // يتحدّث تلقائياً لو المستخدم غيّر وضع الجوال
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [loaded, setLoaded] = useState(false);

  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setChoiceState(v);
      })
      .finally(() => setLoaded(true));
  }, []);

  const scheme: ColorScheme = choice === "system" ? (system === "dark" ? "dark" : "light") : choice;
  const colors = palette[scheme];

  useEffect(() => {
    // لون خلف التطبيق (يمنع الوميض الأبيض في الانتقالات و Android)
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (fontsLoaded && loaded) void SplashScreen.hideAsync();
  }, [fontsLoaded, loaded]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    void AsyncStorage.setItem(STORAGE_KEY, c);
  }, []);

  const value = useMemo(
    () => ({ choice, scheme, colors, shadow: shadow[scheme], setChoice }),
    [choice, scheme, colors, setChoice],
  );

  if (!fontsLoaded || !loaded) return null; // شاشة البداية ظاهرة لين يجهز الخط والمظهر

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside <AppThemeProvider>");
  return ctx;
}

/**
 * يلا نسافر — مزوّد المظهر (فاتح / داكن / تلقائي)
 *
 * الاستخدام:
 *   1) لفّ التطبيق: <ThemeProvider>{children}</ThemeProvider>
 *   2) في صفحة الإعدادات: const { theme, setTheme } = useTheme();
 *   3) حط THEME_BOOT_SCRIPT داخل <head> (قبل أي CSS) عشان ما يطلع وميض أبيض عند فتح التطبيق بالوضع الداكن.
 *
 * "system" هو الافتراضي ويتبع إعداد الجوال ويتحدّث مباشرة لو تغيّر.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "yalla-theme";

const LIGHT_BG = "#f6f8fb";
const DARK_BG = "#10162a";

/** حطّه كـ <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} /> في <head> */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemIsDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

async function syncNativeChrome(dark: boolean) {
  // شريط الحالة في iOS/Android (Capacitor). يتجاهل بهدوء على الويب.
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  } catch {
    /* web */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? DARK_BG : LIGHT_BG);
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && systemIsDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  void syncNativeChrome(dark);
  return dark;
}

type Ctx = { theme: ThemeChoice; resolved: "light" | "dark"; setTheme: (t: ThemeChoice) => void };
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = readChoice();
    setThemeState(initial);
    setResolved(apply(initial) ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system") ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemeChoice) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    setThemeState(t);
    setResolved(apply(t) ? "dark" : "light");
  }, []);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

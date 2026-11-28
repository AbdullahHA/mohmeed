/**
 * يلا نسافر — مكوّن النص الموحّد
 * المحاذاة الافتراضية "auto" تبدأ من اليمين لما RTL مفعّل، فلا تحط textAlign: "right" (ينقلب في بعض المنصات).
 * استخدمه بدل <Text> من react-native في كل التطبيق، عشان الخط والألوان والاتجاه يكونون صح دايماً.
 *
 *   <AppText variant="section">أختامي</AppText>
 *   <AppText variant="caption" tone="muted">الرياض · 2.1 كم</AppText>
 *   <AppText variant="badge" tone="successInk">مفتوح الآن</AppText>
 */
import { Text, type TextProps } from "react-native";

import { type Colors, type } from "./tokens";
import { useAppTheme } from "./ThemeProvider";

type Variant = keyof typeof type;
type Tone = "foreground" | "muted" | "primaryInk" | "goldInk" | "successInk" | "destructive" | "white";

const toneKey: Record<Tone, keyof Colors | null> = {
  foreground: "foreground",
  muted: "mutedForeground",
  primaryInk: "primaryInk",
  goldInk: "goldInk",
  successInk: "successInk",
  destructive: "destructive",
  white: null,
};

export function AppText({
  variant = "body",
  tone = "foreground",
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useAppTheme();
  const key = toneKey[tone];
  return (
    <Text
      // يحترم تكبير الخط من إعدادات الجوال، بحد أقصى 2x عشان ما ينكسر التصميم
      allowFontScaling
      maxFontSizeMultiplier={2}
      style={[type[variant], { color: key ? colors[key] : "#ffffff", writingDirection: "rtl" }, style]}
      {...rest}
    />
  );
}

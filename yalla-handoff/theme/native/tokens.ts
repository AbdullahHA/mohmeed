/**
 * يلا نسافر — Design tokens لـ React Native / Expo (iOS + Android + Web)
 *
 * كل الألوان hex لأن React Native ما يدعم oklch.
 * القاعدة: النص الملوّن يستخدم *Ink (primaryInk, goldInk, successInk)،
 * والخلفيات والأيقونات تستخدم اللون الأساسي. كل النصوص تباينها ≥ 4.5:1 بالوضعين.
 */

export const palette = {
  light: {
    background: "#f6f8fb", // خلفية الشاشة
    foreground: "#141a2b", // النص الأساسي
    card: "#ffffff",
    cardForeground: "#141a2b",
    muted: "#eef1f7", // خلفيات خفيفة (حقول، شرائح غير مختارة)
    mutedForeground: "#5b6378", // النص الثانوي (5.6:1)
    border: "#e3e7f0",

    primary: "#0151e3", // خلفية الأزرار الرئيسية (النص عليها أبيض)
    primaryForeground: "#ffffff",
    primaryInk: "#0151e3", // النص الأزرق: روابط، أيقونات نشطة
    primarySoft: "#ddecff", // خلفية العنصر المختار والشارات

    gold: "#d9932b", // أيقونات وخلفيات: المستوى، النجوم، التنبيه
    goldSoft: "#fbefd9",
    goldInk: "#8f5a0c", // النص الذهبي (5.1:1)

    success: "#1f9d63",
    successSoft: "#daf7e4",
    successInk: "#13744a", // «مفتوح الآن»، «منجز» (5.1:1)

    destructive: "#d0433a",
    heart: "#e4405e", // القلب المحفوظ
    navy: "#16245c", // بطاقة الجواز
    navyForeground: "#e8effc",

    overlay: "rgba(8,10,20,0.5)", // خلف النوافذ السفلية
    scrimEnd: "rgba(0,0,0,0.6)", // تدرّج فوق الصور
    tabBar: "rgba(255,255,255,0.92)",
  },
  dark: {
    background: "#10162a",
    foreground: "#eef1fa",
    card: "#18203a",
    cardForeground: "#eef1fa",
    muted: "#1d2644",
    mutedForeground: "#98a1ba",
    border: "#263052",

    primary: "#2c6be7", // أغمق من النص الأزرق عشان الأبيض فوقه يكون 4.8:1
    primaryForeground: "#ffffff",
    primaryInk: "#83b0ff", // النص الأزرق على الخلفية الداكنة (7:1+)
    primarySoft: "#162c55",

    gold: "#eab05a",
    goldSoft: "#3a2c14",
    goldInk: "#eab05a",

    success: "#3fbf85",
    successSoft: "#163524",
    successInk: "#3fbf85",

    destructive: "#f3625d",
    heart: "#fd6178",
    navy: "#22337a",
    navyForeground: "#e8effc",

    overlay: "rgba(0,0,0,0.6)",
    scrimEnd: "rgba(0,0,0,0.65)",
    tabBar: "rgba(24,32,58,0.92)",
  },
} as const;

/** نفس القيم في الوضعين */
export const fixed = {
  stamps: ["#e07b24", "#1f9d63", "#2a55d8", "#b2449a", "#2a9bb0"],
  category: {
    food: "#e07b24",
    cafe: "#8b5d37",
    events: "#b2449a",
    experiences: "#2a9bb0",
    hotels: "#2a55d8",
    landmarks: "#ab5637",
    nature: "#1f9d63",
    shopping: "#6b55df",
  },
  white: "#ffffff",
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof (typeof palette)["light"]]: string };

/**
 * الخط الوحيد: IBM Plex Sans Arabic
 * npx expo install @expo-google-fonts/ibm-plex-sans-arabic expo-font
 * ملاحظة: في Android لازم كل وزن يكون fontFamily مستقل (fontWeight ما يكفي).
 */
export const fonts = {
  regular: "IBMPlexSansArabic_400Regular",
  medium: "IBMPlexSansArabic_500Medium",
  semibold: "IBMPlexSansArabic_600SemiBold",
  bold: "IBMPlexSansArabic_700Bold",
} as const;

/** مقاس الخط بالـ pt. أقل نص 12، والشارات 11 بوزن semibold فقط. */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 40 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 32 }, // اسم المستخدم، عنوان المكان
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 26 },
  section: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 24 }, // عنوان قسم
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }, // النص الثانوي
  badge: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16 },
  stat: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, fontVariant: ["tabular-nums"] as const },
  button: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
} as const;

/** المسافات (pt) */
export const space = { xxs: 4, xs: 6, sm: 8, md: 12, lg: 16, gutter: 18, section: 20, xl: 24, xxl: 32 } as const;

/** الحواف */
export const radius = {
  sm: 8,
  md: 12, // أزرار
  lg: 14,
  card: 18, // بطاقات
  xl: 22,
  sheet: 28, // النوافذ السفلية من فوق
  pill: 999,
} as const;

/** أقل مساحة ضغط لأي عنصر تفاعلي (Apple HIG 44pt / Material 48dp) */
export const hitSlop = 44;

export const shadow = {
  light: {
    float: { shadowColor: "#141a2b", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  },
  dark: {
    float: { shadowColor: "#000000", shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  },
} as const;

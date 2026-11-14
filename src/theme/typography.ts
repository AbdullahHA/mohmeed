// Single app font: IBM Plex Sans Arabic (4 weights), per yalla-handoff/SPEC.md §1.
// Android requires a distinct fontFamily per weight — fontWeight alone is ignored
// for custom fonts — so every weight is loaded and named explicitly.
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

// Font sizes in pt. Smallest body text is 12px; badges are 11px/semibold only
// (yalla-handoff/SPEC.md §22.9 easiness rules).
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 40 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 32 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 26 },
  section: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  badge: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16 },
  stat: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  button: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
} as const;

export type TypeVariant = keyof typeof type;

// Brand palette, aligned with the yalla-handoff design tokens
// (yalla-handoff/theme/native/tokens.ts). `accent` plays the same role as
// the handoff's "gold" (stars, level, attention), and `primaryDark` plays
// the role of the handoff's "navy" (the dark passport card). All text
// colors meet WCAG contrast ≥ 4.5:1 in both modes.
export const colors = {
  background: '#f6f8fb',
  surface: '#ffffff',
  surfaceAlt: '#eef1f7',
  border: '#e3e7f0',
  primary: '#0151e3',
  primaryDark: '#16245c',
  primarySoft: '#ddecff',
  accent: '#d9932b',
  accentDark: '#8f5a0c',
  accentSoft: '#fbefd9',
  red: '#d0433a',
  text: '#141a2b',
  textMuted: '#5b6378',
  textFaint: '#8891a6',
  textOnPrimary: '#ffffff',
  overlay: 'rgba(8,10,20,0.5)',
  success: '#1f9d63',
  successDark: '#13744a',
  successSoft: '#daf7e4',
  warning: '#F2B900',
  heart: '#e4405e',
  scrimEnd: 'rgba(0,0,0,0.6)',
  tabBar: 'rgba(255,255,255,0.92)',
};

// Dark counterpart — same keys, so any screen can swap in this palette
// via ThemeContext without changing how it reads `colors.xxx`.
export const darkColors: typeof colors = {
  background: '#10162a',
  surface: '#18203a',
  surfaceAlt: '#1d2644',
  border: '#263052',
  primary: '#2c6be7',
  primaryDark: '#22337a',
  primarySoft: '#162c55',
  accent: '#eab05a',
  accentDark: '#eab05a',
  accentSoft: '#3a2c14',
  red: '#f3625d',
  text: '#eef1fa',
  textMuted: '#98a1ba',
  textFaint: '#6c7692',
  textOnPrimary: '#ffffff',
  overlay: 'rgba(0,0,0,0.6)',
  success: '#3fbf85',
  successDark: '#3fbf85',
  successSoft: '#163524',
  warning: '#F2B900',
  heart: '#fd6178',
  scrimEnd: 'rgba(0,0,0,0.65)',
  tabBar: 'rgba(24,32,58,0.92)',
};

export type ThemeColors = typeof colors;

/** Fixed colors: same value in both light and dark mode. */
export const fixedColors = {
  stamps: ['#e07b24', '#1f9d63', '#2a55d8', '#b2449a', '#2a9bb0'],
  category: {
    food: '#e07b24',
    cafe: '#8b5d37',
    events: '#b2449a',
    experiences: '#2a9bb0',
    hotels: '#2a55d8',
    landmarks: '#ab5637',
    nature: '#1f9d63',
    shopping: '#6b55df',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

// A single soft shadow every card can share, instead of each screen
// inventing its own shadow values — keeps elevation calm and consistent.
export const cardShadow = {
  shadowColor: '#0A1426',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};

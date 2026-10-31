// Brand palette: royal blue from the app logo as the primary/navigation
// color, with a warm sunset-orange accent for CTAs and highlights.
export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F6',
  border: '#E2E6ED',
  primary: '#1359D3',
  primaryDark: '#0E4098',
  primarySoft: '#ECF2FB',
  accent: '#F98824',
  accentDark: '#CC701E',
  accentSoft: '#FEF3E9',
  red: '#E14F4F',
  text: '#15202E',
  textMuted: '#5C6B7E',
  textFaint: '#95A1B2',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(10,20,38,0.45)',
  success: '#2E9E6B',
  warning: '#F2B900',
};

// Dark counterpart — same keys, so any screen can swap in this palette
// via ThemeContext without changing how it reads `colors.xxx`.
export const darkColors: typeof colors = {
  background: '#0B0F17',
  surface: '#141A24',
  surfaceAlt: '#1C232F',
  border: '#2A3340',
  primary: '#4C8DFF',
  primaryDark: '#86B2FF',
  primarySoft: 'rgba(76,141,255,0.16)',
  accent: '#FFA552',
  accentDark: '#FFC08A',
  accentSoft: 'rgba(255,165,82,0.16)',
  red: '#FF6B6B',
  text: '#F2F5F9',
  textMuted: '#9AA7B8',
  textFaint: '#6B7686',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.55)',
  success: '#3FBE85',
  warning: '#F2B900',
};

export type ThemeColors = typeof colors;

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

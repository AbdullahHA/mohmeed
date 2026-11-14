import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { type, type TypeVariant } from '../theme/typography';
import type { ThemeColors } from '../theme/colors';

type Tone = 'text' | 'muted' | 'faint' | 'primary' | 'accent' | 'success' | 'red' | 'onPrimary';

const toneKey: Record<Tone, keyof ThemeColors | null> = {
  text: 'text',
  muted: 'textMuted',
  faint: 'textFaint',
  primary: 'primary',
  accent: 'accentDark',
  success: 'successDark',
  red: 'red',
  onPrimary: null,
};

// Unified text component for the yalla-handoff type scale. Use this for any
// new screen/section instead of a bare <Text>, so font + color stay correct
// in both light and dark mode. Existing screens keep their own StyleSheet
// Text usage until they're migrated — see yalla-handoff/SPEC.md §1.
export default function AppText({
  variant = 'body',
  tone = 'text',
  style,
  ...rest
}: TextProps & { variant?: TypeVariant; tone?: Tone }) {
  const { colors } = useTheme();
  const key = toneKey[tone];
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2}
      style={[type[variant], { color: key ? colors[key] : colors.textOnPrimary }, style]}
      {...rest}
    />
  );
}

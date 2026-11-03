import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { fonts } from '../theme/typography';

// Drop-in replacement for RN's <Text>: every screen already imports `Text`
// from 'react-native' and sets `fontWeight` inline, but the app's custom
// font (IBM Plex Sans Arabic) is loaded as 4 separate per-weight font
// files — fontWeight alone does nothing for a custom font, especially on
// Android (see yalla-handoff/theme/native/tokens.ts's own note on this).
// This picks the matching font file from the style's fontWeight so every
// existing screen gets the real typeface without rewriting each one to
// use <AppText>.
function familyFor(weight: TextStyle['fontWeight'] | undefined): string {
  switch (String(weight)) {
    case '500':
      return fonts.medium;
    case '600':
      return fonts.semibold;
    case '700':
    case '800':
    case '900':
    case 'bold':
      return fonts.bold;
    default:
      return fonts.regular;
  }
}

export default function Text({ style, ...rest }: TextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  return <RNText {...rest} style={[{ fontFamily: familyFor(flat.fontWeight) }, style]} />;
}

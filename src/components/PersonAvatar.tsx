import React, { useMemo } from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle, type ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

type Props = {
  avatarUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
};

// A single, calm fallback for every personal avatar in the app: a real
// photo when there is one, otherwise a plain person glyph in the brand
// tint — no emoji faces, so avatars read the same everywhere instead of
// competing for attention.
export default function PersonAvatar({ avatarUrl, size = 44, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[dimension, style] as StyleProp<ImageStyle>} />;
  }
  return (
    <View style={[styles.fallback, dimension, style]}>
      <Ionicons name="person" size={size * 0.52} color={colors.primary} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

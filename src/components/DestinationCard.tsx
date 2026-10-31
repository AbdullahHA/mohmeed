import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import type { Destination } from '../data/destinations';

type Props = {
  destination: Destination;
  onPress?: () => void;
};

export default function DestinationCard({ destination, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <ImageBackground
        source={destination.image}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        <View style={styles.overlay} />
        {destination.trending ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>الأكثر بحثاً</Text>
          </View>
        ) : null}
        <View style={styles.textWrap}>
          <Text style={styles.name}>{destination.name}</Text>
          <Text style={styles.tagline} numberOfLines={1}>
            {destination.tagline}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 150;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 190,
    marginLeft: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageRadius: {
    borderRadius: radius.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    margin: spacing.sm,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  textWrap: {
    padding: spacing.sm,
  },
  name: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
});

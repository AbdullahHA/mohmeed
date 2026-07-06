import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import type { Service } from '../data/services';

const ICONS: Record<Service['icon'], keyof typeof Ionicons.glyphMap> = {
  map: 'map-outline',
  restaurant: 'restaurant-outline',
  plane: 'airplane-outline',
  car: 'car-outline',
  yacht: 'boat-outline',
  sport: 'football-outline',
};

type Props = {
  service: Service;
  onPress?: () => void;
};

export default function ServiceTile({ service, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={onPress}>
      {service.locked ? (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={11} color={colors.textFaint} />
        </View>
      ) : null}
      <View style={styles.iconWrap}>
        <Ionicons name={ICONS[service.icon]} size={22} color={colors.gold} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {service.name}
      </Text>
    </TouchableOpacity>
  );
}

export function MoreSoonTile() {
  return (
    <View style={[styles.tile, styles.moreSoon]}>
      <View style={styles.iconWrap}>
        <Ionicons name="add" size={22} color={colors.gold} />
      </View>
      <Text style={styles.label}>المزيد قريباً</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  moreSoon: {
    borderStyle: 'dashed',
  },
  lockBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

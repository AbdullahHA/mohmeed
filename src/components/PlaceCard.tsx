import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { Place } from '../data/places';

type Props = {
  place: Place;
  onPress?: () => void;
};

export default function PlaceCard({ place, onPress }: Props) {
  const priceLabel = '$'.repeat(place.priceLevel);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinate.latitude},${place.coordinate.longitude}`;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Image source={{ uri: place.image }} style={styles.image} />

      <View style={styles.body}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={colors.gold} />
          <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
        </View>

        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {place.description}
        </Text>

        <Text style={styles.price}>{priceLabel}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(mapsUrl)}
          >
            <Ionicons name="navigate-outline" size={14} color={colors.text} />
            <Text style={styles.actionText}>الاتجاهات</Text>
          </TouchableOpacity>
          {place.website ? (
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(place.website!)}
            >
              <Ionicons name="globe-outline" size={14} color={colors.text} />
              <Text style={styles.actionText}>الموقع</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 190,
  },
  body: {
    padding: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  rating: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'right',
    lineHeight: 19,
  },
  price: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
});

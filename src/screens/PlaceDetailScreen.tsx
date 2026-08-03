import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import PlaceMiniMap from '../components/PlaceMiniMap';
import { places } from '../data/places';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'PlaceDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PlaceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const place = places.find((p) => p.id === route.params.placeId);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المكان</Text>
      </SafeAreaView>
    );
  }

  const priceLabel = '$'.repeat(place.priceLevel);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinate.latitude},${place.coordinate.longitude}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: place.image }} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{place.category}</Text>
            </View>
          </View>

          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.price}>{priceLabel}</Text>
          <Text style={styles.description}>{place.description}</Text>

          <View style={styles.mapWrap}>
            <PlaceMiniMap coordinate={place.coordinate} />
          </View>
          <View style={styles.locationCard}>
            <Ionicons name="location-outline" size={18} color={colors.gold} />
            <Text style={styles.locationText}>
              {place.coordinate.latitude.toFixed(4)}, {place.coordinate.longitude.toFixed(4)}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(mapsUrl)}
            >
              <Ionicons name="navigate" size={16} color={colors.background} />
              <Text style={styles.actionPrimaryText}>الاتجاهات</Text>
            </TouchableOpacity>
            {place.website ? (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(place.website!)}
              >
                <Ionicons name="globe-outline" size={16} color={colors.text} />
                <Text style={styles.actionText}>الموقع</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  imageWrap: {
    width: '100%',
    height: 280,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.xl,
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rating: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  price: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  mapWrap: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  locationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionPrimary: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    flex: 1,
    justifyContent: 'center',
  },
  actionPrimaryText: {
    color: colors.background,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  actionText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
});

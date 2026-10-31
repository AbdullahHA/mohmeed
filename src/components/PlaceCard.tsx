import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { getMapsUrl } from '../utils/place';
import TripPickerModal from './TripPickerModal';
import type { RootStackParamList } from '../navigation/types';
import type { Trip } from '../types';
import type { Place } from '../data/places';

type Props = {
  place: Place;
  onPress?: () => void;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PlaceCard({ place, onPress }: Props) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, addItineraryItem, recommendedPlaceIds, toggleRecommended } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [pickerVisible, setPickerVisible] = useState(false);
  const mapsUrl = getMapsUrl(place.coordinate);
  const isRecommended = recommendedPlaceIds.includes(place.id);

  const handleAddToTrip = () => {
    requireAccount('trip', () => {
      if (trips.length === 0) {
        navigation.navigate('CreateTrip');
        return;
      }
      setPickerVisible(true);
    });
  };

  const handleSelectTrip = (trip: Trip) => {
    addItineraryItem(trip.id, { day: 'غير محدد', time: '—', title: place.name });
    setPickerVisible(false);
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image source={place.image} style={styles.image} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => requireAccount('recommend', () => toggleRecommended(place.id))}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isRecommended ? 'heart' : 'heart-outline'}
            size={18}
            color={isRecommended ? colors.accent : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{place.category}</Text>
          <View style={styles.ratingGroup}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {place.description}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleAddToTrip}>
            <Ionicons name="add-circle-outline" size={14} color={colors.text} />
            <Text style={styles.actionText}>أضف للرحلة</Text>
          </TouchableOpacity>
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

      <TripPickerModal
        visible={pickerVisible}
        title={`أضف "${place.name}" لجدول أي رحلة؟`}
        trips={trips}
        onSelect={handleSelectTrip}
        onClose={() => setPickerVisible(false)}
      />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  category: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  ratingGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rating: {
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 19,
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
    fontWeight: '600',
  },
});

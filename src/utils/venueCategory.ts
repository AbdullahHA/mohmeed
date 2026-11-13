import { Ionicons } from '@expo/vector-icons';
import type { VenueCategory } from '../types';

export const VENUE_CATEGORY_LABEL: Record<VenueCategory, string> = {
  restaurant: 'مطعم',
  cafe: 'مقهى',
  hotel: 'فندق',
  shopping: 'تسوق',
  attraction: 'معلم سياحي',
  other: 'مكان',
};

export const VENUE_CATEGORY_ICON: Record<VenueCategory, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  hotel: 'bed-outline',
  shopping: 'bag-outline',
  attraction: 'camera-outline',
  other: 'location-outline',
};

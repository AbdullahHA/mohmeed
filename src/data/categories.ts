export type TrendCategory = 'all' | 'restaurants' | 'cafes' | 'experiences' | 'hotels';

export const CATEGORIES: { key: TrendCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'الكل', icon: 'sparkles-outline' },
  { key: 'restaurants', label: 'مطاعم', icon: 'restaurant-outline' },
  { key: 'cafes', label: 'مقاهي', icon: 'cafe-outline' },
  { key: 'experiences', label: 'تجارب', icon: 'compass-outline' },
  { key: 'hotels', label: 'فنادق', icon: 'bed-outline' },
];

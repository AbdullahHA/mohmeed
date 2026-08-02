import type { TrendCategory } from './categories';

export type Place = {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  priceLevel: 1 | 2 | 3;
  category: 'هادئ الآن' | 'Hot Spot' | 'الافتراضي';
  city: string;
  trendCategory: TrendCategory;
  coordinate: { latitude: number; longitude: number };
  website?: string;
};

export const places: Place[] = [
  {
    id: 'kimpton-kafd',
    name: 'Kimpton KAFD Riyadh by IHG',
    description:
      'فندق كيمبتون كافد الرياض من آي إتش جي هو فندق فاخر يقع في الرياض، ويقدم تجربة إقامة مميزة للضيوف.',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
    rating: 4.9,
    priceLevel: 3,
    category: 'Hot Spot',
    city: 'riyadh',
    trendCategory: 'hotels',
    coordinate: { latitude: 24.7743, longitude: 46.6389 },
    website: 'https://www.ihg.com',
  },
  {
    id: 'boulevard-riyadh',
    name: 'بوليفارد رياض سيتي',
    description:
      'وجهة ترفيهية متكاملة تضم مطاعم عالمية وفعاليات موسمية وأجواء عائلية على مدار العام.',
    image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=900&q=80',
    rating: 4.6,
    priceLevel: 2,
    category: 'الافتراضي',
    city: 'riyadh',
    trendCategory: 'experiences',
    coordinate: { latitude: 24.7690, longitude: 46.6560 },
  },
  {
    id: 'edge-of-the-world',
    name: 'حافة العالم',
    description:
      'تشكيل صخري مذهل يطل على امتداد الصحراء، وجهة مثالية لمحبي المغامرة والتصوير عند الغروب.',
    image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=900&q=80',
    rating: 4.8,
    priceLevel: 1,
    category: 'هادئ الآن',
    city: 'riyadh',
    trendCategory: 'experiences',
    coordinate: { latitude: 24.9601, longitude: 45.9739 },
  },
  {
    id: 'diriyah-gate',
    name: 'بوابة الدرعية',
    description:
      'مشروع تراثي وثقافي ضخم يعيد إحياء موطن الدولة السعودية الأولى بأجواء أصيلة ومطاعم راقية.',
    image: 'https://images.unsplash.com/photo-1621887700004-b4e8a2f4f6a3?w=900&q=80',
    rating: 4.9,
    priceLevel: 2,
    category: 'Hot Spot',
    city: 'riyadh',
    trendCategory: 'restaurants',
    coordinate: { latitude: 24.7332, longitude: 46.5750 },
  },
  {
    id: 'najd-village',
    name: 'مطعم بيت نجد',
    description:
      'مطعم تراثي بأجواء نجدية أصيلة يقدم أطباقاً سعودية شعبية داخل بيوت طينية مرممة.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
    rating: 4.5,
    priceLevel: 2,
    category: 'الافتراضي',
    city: 'riyadh',
    trendCategory: 'restaurants',
    coordinate: { latitude: 24.6877, longitude: 46.7219 },
  },
  {
    id: 'roast-house-riyadh',
    name: 'روست هاوس',
    description: 'مقهى مختص هادئ في حي العليا، قهوة مختصة وحلويات فرنسية.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80',
    rating: 4.7,
    priceLevel: 2,
    category: 'هادئ الآن',
    city: 'riyadh',
    trendCategory: 'cafes',
    coordinate: { latitude: 24.6940, longitude: 46.6850 },
  },
  {
    id: 'red-sea-resort',
    name: 'منتجع البحر الأحمر',
    description:
      'جزر خاصة ومياه فيروزية ومنتجعات فاخرة تقدم تجربة استجمام استثنائية على ساحل البحر الأحمر.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=80',
    rating: 4.9,
    priceLevel: 3,
    category: 'هادئ الآن',
    city: 'jeddah',
    trendCategory: 'hotels',
    coordinate: { latitude: 25.5000, longitude: 36.5000 },
  },
  {
    id: 'jeddah-corniche',
    name: 'كورنيش جدة التاريخي',
    description:
      'ممشى بحري بأجواء البلد القديمة، مقاهي على الواجهة البحرية وغروب لا يفوّت.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&q=80',
    rating: 4.7,
    priceLevel: 1,
    category: 'هادئ الآن',
    city: 'jeddah',
    trendCategory: 'experiences',
    coordinate: { latitude: 21.4858, longitude: 39.1925 },
  },
  {
    id: 'byoot-jeddah',
    name: 'مطعم بيوت جدة القديمة',
    description: 'مأكولات حجازية أصيلة داخل بيت تاريخي مرمم في البلد.',
    image: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=900&q=80',
    rating: 4.6,
    priceLevel: 2,
    category: 'Hot Spot',
    city: 'jeddah',
    trendCategory: 'restaurants',
    coordinate: { latitude: 21.4830, longitude: 39.1870 },
  },
];

export function placesByCity(citySlug: string) {
  return places.filter((p) => p.city === citySlug);
}

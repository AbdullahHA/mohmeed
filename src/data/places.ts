import type { ImageSourcePropType } from 'react-native';

export type Place = {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  rating: number;
  priceLevel: 1 | 2 | 3;
  category: 'هادئ الآن' | 'Hot Spot' | 'الافتراضي';
  coordinate: { latitude: number; longitude: number };
  website?: string;
  destinationId: string;
};

export const places: Place[] = [
  {
    id: 'kimpton-kafd',
    name: 'Kimpton KAFD Riyadh by IHG',
    description:
      'فندق كيمبتون كافد الرياض من آي إتش جي هو فندق فاخر يقع في الرياض، ويقدم تجربة إقامة مميزة للضيوف.',
    image: require('../assets/images/kimpton-hotel.png'),
    rating: 4.9,
    priceLevel: 3,
    category: 'Hot Spot',
    coordinate: { latitude: 24.7743, longitude: 46.6389 },
    website: 'https://www.ihg.com',
    destinationId: 'riyadh',
  },
  {
    id: 'boulevard-riyadh',
    name: 'بوليفارد رياض سيتي',
    description:
      'وجهة ترفيهية متكاملة تضم مطاعم عالمية وفعاليات موسمية وأجواء عائلية على مدار العام.',
    image: require('../assets/images/riyadh.png'),
    rating: 4.6,
    priceLevel: 2,
    category: 'الافتراضي',
    coordinate: { latitude: 24.7690, longitude: 46.6560 },
    destinationId: 'riyadh',
  },
  {
    id: 'edge-of-the-world',
    name: 'حافة العالم',
    description:
      'تشكيل صخري مذهل يطل على امتداد الصحراء، وجهة مثالية لمحبي المغامرة والتصوير عند الغروب.',
    image: require('../assets/images/edge-of-the-world.png'),
    rating: 4.8,
    priceLevel: 1,
    category: 'هادئ الآن',
    coordinate: { latitude: 24.9601, longitude: 45.9739 },
    destinationId: 'riyadh',
  },
  {
    id: 'diriyah-gate',
    name: 'بوابة الدرعية',
    description:
      'مشروع تراثي وثقافي ضخم يعيد إحياء موطن الدولة السعودية الأولى بأجواء أصيلة ومطاعم راقية.',
    image: require('../assets/images/diriyah.png'),
    rating: 4.9,
    priceLevel: 2,
    category: 'Hot Spot',
    coordinate: { latitude: 24.7332, longitude: 46.5750 },
    destinationId: 'riyadh',
  },
  {
    id: 'red-sea-resort',
    name: 'منتجع البحر الأحمر',
    description:
      'جزر خاصة ومياه فيروزية ومنتجعات فاخرة تقدم تجربة استجمام استثنائية على ساحل البحر الأحمر.',
    image: require('../assets/images/redsea.png'),
    rating: 4.9,
    priceLevel: 3,
    category: 'هادئ الآن',
    coordinate: { latitude: 25.5000, longitude: 36.5000 },
    destinationId: 'redsea',
  },
];

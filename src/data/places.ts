export type Place = {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  priceLevel: 1 | 2 | 3;
  category: 'هادئ الآن' | 'Hot Spot' | 'الافتراضي';
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
    coordinate: { latitude: 24.7332, longitude: 46.5750 },
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
    coordinate: { latitude: 25.5000, longitude: 36.5000 },
  },
];

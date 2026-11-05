import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

export type PlaceType = 'food' | 'cafe' | 'events' | 'experiences' | 'shopping' | 'nature' | 'landmarks' | 'hotels';

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  food: 'مطاعم',
  cafe: 'كافيهات',
  events: 'فعاليات',
  experiences: 'تجارب',
  shopping: 'تسوّق',
  nature: 'طبيعة',
  landmarks: 'معالم',
  hotels: 'فنادق',
};

// Single source of truth for the per-type icon, shared by the Discover
// category grid/filter chips and the place-detail "النوع" fact card so
// they never drift apart.
export const PLACE_TYPE_ICONS: Record<PlaceType, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline',
  cafe: 'cafe-outline',
  events: 'calendar-outline',
  experiences: 'sparkles-outline',
  shopping: 'bag-outline',
  nature: 'leaf-outline',
  landmarks: 'flag-outline',
  hotels: 'bed-outline',
};

export type Place = {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  rating: number;
  priceLevel: 1 | 2 | 3;
  category: 'هادئ الآن' | 'Hot Spot' | 'الافتراضي';
  type: PlaceType;
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
    type: 'hotels',
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
    type: 'experiences',
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
    type: 'nature',
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
    type: 'landmarks',
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
    type: 'hotels',
    coordinate: { latitude: 25.5000, longitude: 36.5000 },
    destinationId: 'redsea',
  },
  {
    id: 'hegra-alula',
    name: 'الحِجر (مدائن صالح)',
    description:
      'أول موقع سعودي مسجل في قائمة التراث العالمي لليونسكو — مدينة أثرية نبطية منحوتة في الصخر الرملي بقلب العلا.',
    image: require('../assets/images/alula.png'),
    rating: 4.9,
    priceLevel: 2,
    category: 'الافتراضي',
    type: 'landmarks',
    coordinate: { latitude: 26.7917, longitude: 37.9544 },
    destinationId: 'alula',
  },
  {
    id: 'elephant-rock-alula',
    name: 'جبل الفيل',
    description:
      'تشكيل صخري طبيعي بشكل فيل يرتفع عن الأرض، من أشهر معالم العلا ووجهة مفضلة لمشاهدة الغروب.',
    image: require('../assets/images/alula.png'),
    rating: 4.8,
    priceLevel: 1,
    category: 'هادئ الآن',
    type: 'nature',
    coordinate: { latitude: 26.6403, longitude: 37.8702 },
    destinationId: 'alula',
  },
  {
    id: 'maraya-alula',
    name: 'مرايا',
    description:
      'أكبر مبنى مكسو بالمرايا في العالم، يقع في وادي أشار ويستضيف الحفلات والفعاليات الثقافية.',
    image: require('../assets/images/alula.png'),
    rating: 4.8,
    priceLevel: 2,
    category: 'Hot Spot',
    type: 'landmarks',
    coordinate: { latitude: 26.7191, longitude: 37.8661 },
    website: 'https://www.maraya.sa',
    destinationId: 'alula',
  },
  {
    id: 'alula-old-town',
    name: 'البلدة القديمة بالعلا',
    description:
      'حي تاريخي من الطوب اللبن بأزقة ضيقة ومحلات حرفية ومقاهٍ، شاهد على حياة العلا قبل قرن من الزمان.',
    image: require('../assets/images/alula.png'),
    rating: 4.7,
    priceLevel: 1,
    category: 'الافتراضي',
    type: 'landmarks',
    coordinate: { latitude: 26.6177, longitude: 37.9212 },
    destinationId: 'alula',
  },
  {
    id: 'habitas-alula',
    name: 'Habitas AlUla',
    description:
      'منتجع صديق للبيئة بين الصخور الرملية في وادي عشار، يجمع بين التصميم العصري والطبيعة الصحراوية.',
    image: require('../assets/images/alula.png'),
    rating: 4.8,
    priceLevel: 3,
    category: 'Hot Spot',
    type: 'hotels',
    coordinate: { latitude: 26.7322, longitude: 37.8494 },
    website: 'https://ourhabitas.com/alula',
    destinationId: 'alula',
  },
  {
    id: 'banyan-tree-alula',
    name: 'Banyan Tree AlUla',
    description:
      'منتجع فاخر محاط بالتشكيلات الصخرية في وادي عشار، يقدم إقامة راقية قريبة من أبرز معالم العلا.',
    image: require('../assets/images/alula.png'),
    rating: 4.9,
    priceLevel: 3,
    category: 'هادئ الآن',
    type: 'hotels',
    coordinate: { latitude: 26.7279, longitude: 37.8509 },
    website: 'https://www.banyantree.com/saudi-arabia/al-ula',
    destinationId: 'alula',
  },
  {
    id: 'somewhere-cafe-alula',
    name: 'Somewhere Café',
    description:
      'مقهى بأجواء دافئة في قلب البلدة القديمة، محطة مريحة للاستراحة بين جولات التجول والتصوير.',
    image: require('../assets/images/alula.png'),
    rating: 4.5,
    priceLevel: 2,
    category: 'الافتراضي',
    type: 'cafe',
    coordinate: { latitude: 26.6177, longitude: 37.9212 },
    destinationId: 'alula',
  },
  {
    id: 'hot-air-balloon-alula',
    name: 'رحلة بالمنطاد فوق العلا',
    description:
      'تحليق بالمنطاد عند الفجر فوق الصحراء والتشكيلات الصخرية، من أشهر الأنشطة السياحية في الوجهة.',
    image: require('../assets/images/alula.png'),
    rating: 4.9,
    priceLevel: 3,
    category: 'Hot Spot',
    type: 'experiences',
    coordinate: { latitude: 26.6300, longitude: 37.9000 },
    destinationId: 'alula',
  },
];

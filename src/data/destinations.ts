import type { ImageSourcePropType } from 'react-native';

export type Destination = {
  id: string;
  name: string;
  tagline: string;
  image: ImageSourcePropType;
  trending?: boolean;
  bestMonths: number[];
  whyVisit: string;
  topHotels: string[];
  topRestaurants: string[];
  interests: string[];
};

export const INTEREST_TAGS = ['مغامرة', 'شواطئ', 'ثقافة', 'عائلي', 'رومانسي', 'طبيعة'] as const;

export const destinations: Destination[] = [
  {
    id: 'alula',
    name: 'العلا',
    tagline: 'آثار عمرها آلاف السنين وسماء بلا حدود',
    image: require('../assets/images/alula.png'),
    trending: true,
    bestMonths: [10, 11, 12, 1, 2],
    whyVisit: 'أجواء معتدلة ومهرجان الشتاء ينشط الوجهة بالفعاليات والحرف.',
    topHotels: ['Habitas AlUla', 'Shaden Resort', 'Our Habitas AlUla'],
    topRestaurants: ['مطعم صحارى', 'Somewhere Cafe', 'مطعم الفرن'],
    interests: ['مغامرة', 'ثقافة'],
  },
  {
    id: 'redsea',
    name: 'البحر الأحمر',
    tagline: 'الوجهة التي يتحدث عنها الجميع',
    image: require('../assets/images/redsea.png'),
    bestMonths: [3, 4, 5, 10, 11],
    whyVisit: 'مياه فيروزية وشعاب مرجانية ومنتجعات جزرية بعيدة عن الزحام.',
    topHotels: ['Six Senses Southern Dunes', 'St. Regis Red Sea Resort'],
    topRestaurants: ['Turquoiz', 'Kaia'],
    interests: ['شواطئ', 'مغامرة'],
  },
  {
    id: 'marbella',
    name: 'ماربيا',
    tagline: 'أجواء شاطئية ورحلات بحرية',
    image: require('../assets/images/marbella.png'),
    bestMonths: [6, 7, 8],
    whyVisit: 'صيف أوروبي حيوي بين الشواطئ والمارينا والحياة الليلية.',
    topHotels: ['Puente Romano', 'Marbella Club Hotel'],
    topRestaurants: ['Nobu Marbella', 'La Sala by the Sea'],
    interests: ['شواطئ', 'رومانسي'],
  },
  {
    id: 'riyadh',
    name: 'الرياض',
    tagline: 'حيث يلتقي التراث بالحداثة',
    image: require('../assets/images/riyadh.png'),
    bestMonths: [11, 12, 1, 2, 3],
    whyVisit: 'شتاء لطيف يناسب التجول في بوليفارد رياض سيتي وحي الدرعية.',
    topHotels: ['Kimpton KAFD Riyadh by IHG', 'Ritz-Carlton Riyadh'],
    topRestaurants: ['مطعم بوابة الدرعية', 'Angelina Riyadh'],
    interests: ['ثقافة', 'عائلي'],
  },
  {
    id: 'jeddah',
    name: 'جدة',
    tagline: 'عروس البحر الأحمر',
    image: require('../assets/images/jeddah.png'),
    bestMonths: [7, 8, 9],
    whyVisit: 'كورنيش بحري وأمسيات صيفية وأجواء تاريخية في البلد.',
    topHotels: ['Rosewood Jeddah', 'InterContinental Jeddah'],
    topRestaurants: ['Byblos', 'Al Nakheel Seafood'],
    interests: ['شواطئ', 'عائلي'],
  },
  {
    id: 'abha',
    name: 'أبها',
    tagline: 'برودة الجبال وسحاب يلامس القمم',
    image: require('../assets/images/abha.png'),
    bestMonths: [6, 7, 8, 9],
    whyVisit: 'مصيف جبلي منعش هرباً من حرارة الصيف مع تلفريك السودة.',
    topHotels: ['Boudl Abha', 'Abha Palace Hotel'],
    topRestaurants: ['مطعم شذا أبها', 'Cafe Rosto'],
    interests: ['طبيعة', 'مغامرة'],
  },
];

export const heroDestination = {
  name: 'الدرعية',
  image: require('../assets/images/diriyah.png') as ImageSourcePropType,
};

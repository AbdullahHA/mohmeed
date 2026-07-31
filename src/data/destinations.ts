export type Destination = {
  id: string;
  name: string;
  tagline: string;
  image: string;
  trending?: boolean;
  bestMonths: number[];
  whyVisit: string;
  topHotels: string[];
  topRestaurants: string[];
};

export const destinations: Destination[] = [
  {
    id: 'alula',
    name: 'العلا',
    tagline: 'آثار عمرها آلاف السنين وسماء بلا حدود',
    image: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
    trending: true,
    bestMonths: [10, 11, 12, 1, 2],
    whyVisit: 'أجواء معتدلة ومهرجان الشتاء ينشط الوجهة بالفعاليات والحرف.',
    topHotels: ['Habitas AlUla', 'Shaden Resort', 'Our Habitas AlUla'],
    topRestaurants: ['مطعم صحارى', 'Somewhere Cafe', 'مطعم الفرن'],
  },
  {
    id: 'redsea',
    name: 'البحر الأحمر',
    tagline: 'الوجهة التي يتحدث عنها الجميع',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    bestMonths: [3, 4, 5, 10, 11],
    whyVisit: 'مياه فيروزية وشعاب مرجانية ومنتجعات جزرية بعيدة عن الزحام.',
    topHotels: ['Six Senses Southern Dunes', 'St. Regis Red Sea Resort'],
    topRestaurants: ['Turquoiz', 'Kaia'],
  },
  {
    id: 'marbella',
    name: 'ماربيا',
    tagline: 'أجواء شاطئية ورحلات بحرية',
    image: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
    bestMonths: [6, 7, 8],
    whyVisit: 'صيف أوروبي حيوي بين الشواطئ والمارينا والحياة الليلية.',
    topHotels: ['Puente Romano', 'Marbella Club Hotel'],
    topRestaurants: ['Nobu Marbella', 'La Sala by the Sea'],
  },
  {
    id: 'riyadh',
    name: 'الرياض',
    tagline: 'حيث يلتقي التراث بالحداثة',
    image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800&q=80',
    bestMonths: [11, 12, 1, 2, 3],
    whyVisit: 'شتاء لطيف يناسب التجول في بوليفارد رياض سيتي وحي الدرعية.',
    topHotels: ['Kimpton KAFD Riyadh by IHG', 'Ritz-Carlton Riyadh'],
    topRestaurants: ['مطعم بوابة الدرعية', 'Angelina Riyadh'],
  },
  {
    id: 'jeddah',
    name: 'جدة',
    tagline: 'عروس البحر الأحمر',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    bestMonths: [7, 8, 9],
    whyVisit: 'كورنيش بحري وأمسيات صيفية وأجواء تاريخية في البلد.',
    topHotels: ['Rosewood Jeddah', 'InterContinental Jeddah'],
    topRestaurants: ['Byblos', 'Al Nakheel Seafood'],
  },
  {
    id: 'abha',
    name: 'أبها',
    tagline: 'برودة الجبال وسحاب يلامس القمم',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80',
    bestMonths: [6, 7, 8, 9],
    whyVisit: 'مصيف جبلي منعش هرباً من حرارة الصيف مع تلفريك السودة.',
    topHotels: ['Boudl Abha', 'Abha Palace Hotel'],
    topRestaurants: ['مطعم شذا أبها', 'Cafe Rosto'],
  },
];

export const heroDestination = {
  name: 'الدرعية',
  image: 'https://images.unsplash.com/photo-1621887700004-b4e8a2f4f6a3?w=1200&q=80',
};

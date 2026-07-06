export type Destination = {
  id: string;
  name: string;
  tagline: string;
  image: string;
  trending?: boolean;
};

export const destinations: Destination[] = [
  {
    id: 'cannes',
    name: 'كان',
    tagline: 'لؤلؤة الريفيرا',
    image: 'https://images.unsplash.com/photo-1533929418994-9f3e4ae4d5f1?w=800&q=80',
  },
  {
    id: 'redsea',
    name: 'البحر الأحمر',
    tagline: 'الوجهة التي يتحدث عنها الجميع',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  {
    id: 'marbella',
    name: 'ماربيا',
    tagline: 'أجواء شاطئية ورحلات بحرية',
    image: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
    trending: true,
  },
  {
    id: 'riyadh',
    name: 'الرياض',
    tagline: 'حيث يلتقي التراث بالحداثة',
    image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800&q=80',
  },
  {
    id: 'jeddah',
    name: 'جدة',
    tagline: 'عروس البحر الأحمر',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  },
];

export const heroDestination = {
  name: 'الدرعية',
  image: 'https://images.unsplash.com/photo-1621887700004-b4e8a2f4f6a3?w=1200&q=80',
};

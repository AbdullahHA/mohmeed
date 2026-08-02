export type Destination = {
  id: string;
  name: string;
  country: string;
  tagline: string;
  months: string;
  image: number;
  trending?: boolean;
};

export const destinations: Destination[] = [
  {
    id: 'jeddah',
    name: 'جدة التاريخية',
    country: 'السعودية',
    tagline: 'تراث وبحر',
    months: 'نوفمبر – فبراير',
    image: require('../../assets/dest-jeddah.jpg'),
    trending: true,
  },
  {
    id: 'istanbul',
    name: 'إسطنبول',
    country: 'تركيا',
    tagline: 'مدن وأسواق',
    months: 'أبريل – يونيو',
    image: require('../../assets/dest-istanbul.jpg'),
  },
  {
    id: 'maldives',
    name: 'المالديف',
    country: 'المحيط الهندي',
    tagline: 'شهر عسل',
    months: 'يناير – مارس',
    image: require('../../assets/dest-maldives.jpg'),
  },
  {
    id: 'tbilisi',
    name: 'تبليسي',
    country: 'جورجيا',
    tagline: 'طبيعة وجبال',
    months: 'مايو – سبتمبر',
    image: require('../../assets/dest-tbilisi.jpg'),
  },
];

export const heroDestination = {
  name: 'العلا',
  image: require('../../assets/hero-alula.jpg'),
};

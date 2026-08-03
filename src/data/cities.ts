export type City = {
  slug: string;
  name: string;
  country: string;
  hasPlaces?: boolean;
};

export const CITIES: City[] = [
  { slug: 'riyadh', name: 'الرياض', country: 'السعودية', hasPlaces: true },
  { slug: 'jeddah', name: 'جدة', country: 'السعودية', hasPlaces: true },
  { slug: 'khobar', name: 'الخبر', country: 'السعودية' },
  { slug: 'alula', name: 'العلا', country: 'السعودية' },
  { slug: 'dubai', name: 'دبي', country: 'الإمارات' },
  { slug: 'doha', name: 'الدوحة', country: 'قطر' },
  { slug: 'istanbul', name: 'إسطنبول', country: 'تركيا' },
  { slug: 'london', name: 'لندن', country: 'بريطانيا' },
  { slug: 'tbilisi', name: 'تبليسي', country: 'جورجيا' },
  { slug: 'maldives', name: 'المالديف', country: 'المحيط الهندي' },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

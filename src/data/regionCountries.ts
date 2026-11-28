export type RegionCountry = {
  code: string;
  name: string;
  flag: string;
};

export const REGION_COUNTRIES: RegionCountry[] = [
  { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦' },
  { code: 'OM', name: 'عُمان', flag: '🇴🇲' },
];

export const DEFAULT_REGION_COUNTRY_CODE = 'SA';

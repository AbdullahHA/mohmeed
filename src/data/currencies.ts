export type Currency = {
  code: string;
  name: string;
  flag: string;
  symbol: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'SAR', name: 'ريال سعودي', flag: '🇸🇦', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي', flag: '🇦🇪', symbol: 'د.إ' },
  { code: 'QAR', name: 'ريال قطري', flag: '🇶🇦', symbol: 'ر.ق' },
  { code: 'KWD', name: 'دينار كويتي', flag: '🇰🇼', symbol: 'د.ك' },
  { code: 'BHD', name: 'دينار بحريني', flag: '🇧🇭', symbol: 'د.ب' },
  { code: 'USD', name: 'دولار أمريكي', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'يورو', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'جنيه إسترليني', flag: '🇬🇧', symbol: '£' },
  { code: 'EGP', name: 'جنيه مصري', flag: '🇪🇬', symbol: 'ج.م' },
  { code: 'INR', name: 'روبية هندية', flag: '🇮🇳', symbol: '₹' },
  { code: 'OMR', name: 'ريال عماني', flag: '🇴🇲', symbol: 'ر.ع' },
];

export const DEFAULT_CURRENCY_CODE = 'SAR';

import { COUNTRIES } from './countries';

// Flag emoji are two Unicode regional-indicator symbols, one per ISO
// 3166-1 alpha-2 letter — computed here rather than typed by hand so every
// entry is guaranteed correct instead of relying on 160+ hand-copied emoji.
export function flagFromCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65));
}

// ISO 3166-1 alpha-2 codes for every entry in COUNTRIES, keyed by the exact
// Arabic name used there so flags stay in sync with that list automatically.
// Israel is intentionally absent from COUNTRIES itself and must stay that way.
const COUNTRY_CODES: Record<string, string> = {
  'أذربيجان': 'AZ',
  'أرمينيا': 'AM',
  'أروغواي': 'UY',
  'أستراليا': 'AU',
  'أسبانيا': 'ES',
  'إستونيا': 'EE',
  'أفغانستان': 'AF',
  'ألبانيا': 'AL',
  'ألمانيا': 'DE',
  'الأرجنتين': 'AR',
  'الإكوادور': 'EC',
  'الإمارات العربية المتحدة': 'AE',
  'الأردن': 'JO',
  'البحرين': 'BH',
  'البرازيل': 'BR',
  'البرتغال': 'PT',
  'البوسنة والهرسك': 'BA',
  'التشيك': 'CZ',
  'الجبل الأسود': 'ME',
  'الجزائر': 'DZ',
  'الدنمارك': 'DK',
  'السعودية': 'SA',
  'السلفادور': 'SV',
  'السنغال': 'SN',
  'السودان': 'SD',
  'السويد': 'SE',
  'الصومال': 'SO',
  'الصين': 'CN',
  'العراق': 'IQ',
  'الفلبين': 'PH',
  'الكاميرون': 'CM',
  'الكونغو': 'CG',
  'الكويت': 'KW',
  'المغرب': 'MA',
  'المكسيك': 'MX',
  'المملكة المتحدة': 'GB',
  'النرويج': 'NO',
  'النمسا': 'AT',
  'الهند': 'IN',
  'الولايات المتحدة الأمريكية': 'US',
  'اليابان': 'JP',
  'اليمن': 'YE',
  'اليونان': 'GR',
  'إندونيسيا': 'ID',
  'إيران': 'IR',
  'أوزبكستان': 'UZ',
  'أوغندا': 'UG',
  'أوكرانيا': 'UA',
  'إيطاليا': 'IT',
  'باكستان': 'PK',
  'باراغواي': 'PY',
  'بلجيكا': 'BE',
  'بلغاريا': 'BG',
  'بنغلاديش': 'BD',
  'بنما': 'PA',
  'بوتان': 'BT',
  'بوتسوانا': 'BW',
  'بوركينا فاسو': 'BF',
  'بوروندي': 'BI',
  'بولندا': 'PL',
  'بوليفيا': 'BO',
  'بيرو': 'PE',
  'بيلاروسيا': 'BY',
  'تايلاند': 'TH',
  'تايوان': 'TW',
  'ترينيداد وتوباغو': 'TT',
  'تركمانستان': 'TM',
  'تركيا': 'TR',
  'تشاد': 'TD',
  'تشيلي': 'CL',
  'تنزانيا': 'TZ',
  'توغو': 'TG',
  'تونس': 'TN',
  'جامايكا': 'JM',
  'جرينلاند': 'GL',
  'جمهورية الدومينيكان': 'DO',
  'جنوب أفريقيا': 'ZA',
  'جنوب السودان': 'SS',
  'جورجيا': 'GE',
  'جيبوتي': 'DJ',
  'رواندا': 'RW',
  'رومانيا': 'RO',
  'روسيا': 'RU',
  'زامبيا': 'ZM',
  'زيمبابوي': 'ZW',
  'سانت لوسيا': 'LC',
  'سري لانكا': 'LK',
  'سلوفاكيا': 'SK',
  'سلوفينيا': 'SI',
  'سنغافورة': 'SG',
  'سوريا': 'SY',
  'سويسرا': 'CH',
  'سيراليون': 'SL',
  'سيشل': 'SC',
  'صربيا': 'RS',
  'عمان': 'OM',
  'غابون': 'GA',
  'غامبيا': 'GM',
  'غانا': 'GH',
  'غواتيمالا': 'GT',
  'غيانا': 'GY',
  'غينيا': 'GN',
  'غينيا الاستوائية': 'GQ',
  'غينيا بيساو': 'GW',
  'فانواتو': 'VU',
  'فرنسا': 'FR',
  'فلسطين': 'PS',
  'فنزويلا': 'VE',
  'فنلندا': 'FI',
  'فيتنام': 'VN',
  'فيجي': 'FJ',
  'قبرص': 'CY',
  'قطر': 'QA',
  'قيرغيزستان': 'KG',
  'كازاخستان': 'KZ',
  'كرواتيا': 'HR',
  'كمبوديا': 'KH',
  'كندا': 'CA',
  'كوبا': 'CU',
  'كوت ديفوار': 'CI',
  'كوريا الجنوبية': 'KR',
  'كوريا الشمالية': 'KP',
  'كوستاريكا': 'CR',
  'كولومبيا': 'CO',
  'كوسوفو': 'XK',
  'كينيا': 'KE',
  'لاتفيا': 'LV',
  'لاوس': 'LA',
  'لبنان': 'LB',
  'لوكسمبورغ': 'LU',
  'ليبيا': 'LY',
  'ليبيريا': 'LR',
  'ليتوانيا': 'LT',
  'ليختنشتاين': 'LI',
  'ليسوتو': 'LS',
  'مالطا': 'MT',
  'مالي': 'ML',
  'ماليزيا': 'MY',
  'مدغشقر': 'MG',
  'مصر': 'EG',
  'مقدونيا الشمالية': 'MK',
  'ملاوي': 'MW',
  'موريتانيا': 'MR',
  'موريشيوس': 'MU',
  'موزمبيق': 'MZ',
  'مولدوفا': 'MD',
  'موناكو': 'MC',
  'منغوليا': 'MN',
  'ميانمار': 'MM',
  'ناميبيا': 'NA',
  'نيبال': 'NP',
  'النيجر': 'NE',
  'نيجيريا': 'NG',
  'نيكاراغوا': 'NI',
  'نيوزيلندا': 'NZ',
  'هايتي': 'HT',
  'هندوراس': 'HN',
  'هولندا': 'NL',
  'هونغ كونغ': 'HK',
  'إيرلندا': 'IE',
  'آيسلندا': 'IS',
};

export type CountryOption = { name: string; code: string; flag: string };

export const COUNTRY_OPTIONS: CountryOption[] = COUNTRIES.map((name) => {
  const code = COUNTRY_CODES[name] ?? '';
  return { name, code, flag: code ? flagFromCode(code) : '🏳️' };
});

export const FLAG_BY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.name, c.flag])
);

// `region` is often "State، Country" (e.g. "تكساس، الولايات المتحدة") and
// sometimes shortens a country's name (no "الأمريكية" suffix) relative to
// our own list — so check the last comma segment against both directions
// of containment, not just an exact/full match.
export function flagForRegion(region: string): string | null {
  if (!region) return null;
  if (FLAG_BY_NAME[region]) return FLAG_BY_NAME[region];
  const lastSegment = region.split(/[،,]/).pop()?.trim() ?? region;
  const match = COUNTRY_OPTIONS.find(
    (c) => region.includes(c.name) || c.name.includes(lastSegment) || lastSegment.includes(c.name)
  );
  return match ? match.flag : null;
}

import type { Community } from '../types';

export const seedCommunities: Community[] = [
  {
    id: 'offroad',
    name: 'محبي الرحلات البرية',
    tagline: 'تجمع عشاق التخييم والصحراء والدفع الرباعي',
    emoji: '🏜️',
    color: '#CC701E',
    baseMemberCount: 1240,
    joined: false,
    messages: [
      { id: 'c1m1', fromName: 'خالد العتيبي', text: 'أي أحد جرب طريق النفود الشمالي هالشتاء؟', at: Date.now() - 1000 * 60 * 60 * 20 },
      { id: 'c1m2', fromName: 'منيرة الدوسري', text: 'جربناه قبل شهر، الطريق تمام بس خذ وقود زيادة', at: Date.now() - 1000 * 60 * 60 * 18 },
    ],
  },
  {
    id: 'diving',
    name: 'عشاق الغوص بالبحر الأحمر',
    tagline: 'شعاب مرجانية ونقاط غوص ومعدات',
    emoji: '🤿',
    color: '#1359D3',
    baseMemberCount: 860,
    joined: false,
    messages: [
      { id: 'c2m1', fromName: 'سلطان المالكي', text: 'أفضل نقطة غوص قريبة من جدة لمبتدئين؟', at: Date.now() - 1000 * 60 * 60 * 10 },
      { id: 'c2m2', fromName: 'هيا القحطاني', text: 'جزيرة أبو سدرة ممتازة للمبتدئين والمياه هادئة', at: Date.now() - 1000 * 60 * 60 * 9 },
    ],
  },
  {
    id: 'alula-travelers',
    name: 'مسافرين العلا',
    tagline: 'كل شي عن العلا: فنادق، مطاعم، وأنشطة',
    emoji: '🏔️',
    color: '#F98824',
    baseMemberCount: 2010,
    joined: false,
    messages: [
      { id: 'c3m1', fromName: 'عبدالعزيز الشهري', text: 'مهرجان الشتاء بدأ، الزحام كثير نهاية الأسبوع', at: Date.now() - 1000 * 60 * 60 * 30 },
      { id: 'c3m2', fromName: 'ريماس الحربي', text: 'احجزوا مطاعمكم بدري، صحارى يحجز قبل بأسبوع', at: Date.now() - 1000 * 60 * 60 * 26 },
    ],
  },
  {
    id: 'foodies',
    name: 'محبي المطاعم والمأكولات',
    tagline: 'اكتشافات مطاعم محلية وعالمية بكل مدينة',
    emoji: '🍽️',
    color: '#F98824',
    baseMemberCount: 3150,
    joined: false,
    messages: [
      { id: 'c4m1', fromName: 'نواف القرني', text: 'أي مطعم مأكولات بحرية تنصحون فيه بجدة؟', at: Date.now() - 1000 * 60 * 60 * 5 },
      { id: 'c4m2', fromName: 'لينا باوزير', text: 'النخيل ما يخيب، جرب السمك المشوي', at: Date.now() - 1000 * 60 * 60 * 4 },
    ],
  },
  {
    id: 'family-trips',
    name: 'رحالة العائلات',
    tagline: 'نصائح وخطط سفر تناسب الأطفال وكبار السن',
    emoji: '👨‍👩‍👧‍👦',
    color: '#2E9E6B',
    baseMemberCount: 1580,
    joined: false,
    messages: [
      { id: 'c5m1', fromName: 'أم فهد', text: 'وجهة مناسبة لعائلة فيها أطفال صغار بالشتاء؟', at: Date.now() - 1000 * 60 * 60 * 15 },
      { id: 'c5m2', fromName: 'أبو سلمان', text: 'الرياض ممتازة، بوليفارد فيه أنشطة للصغار والكبار', at: Date.now() - 1000 * 60 * 60 * 13 },
    ],
  },
];

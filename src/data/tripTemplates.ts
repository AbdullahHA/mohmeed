import type { TripTemplate } from '../types';

export const seedTripTemplates: TripTemplate[] = [
  {
    id: 'tpl-alula-weekend',
    title: 'نهاية أسبوع بالعلا: مغامرة وتراث',
    destinationId: 'alula',
    authorName: 'عبدالعزيز الشهري',
    isMine: false,
    days: 3,
    price: 0,
    items: [
      { id: 'i1', category: 'hotels', label: 'Shaden Resort – ليلتين' },
      { id: 'i2', category: 'activities', label: 'جولة حرة عويرض عند الشروق' },
      { id: 'i3', category: 'food', label: 'عشاء في مطعم صحارى' },
      { id: 'i4', category: 'activities', label: 'مسكن الصالح والمقابر النبطية' },
    ],
  },
  {
    id: 'tpl-redsea-dive',
    title: 'غوص وفخامة بالبحر الأحمر',
    destinationId: 'redsea',
    authorName: 'هيا القحطاني',
    isMine: false,
    days: 4,
    price: 450,
    items: [
      { id: 'i5', category: 'hotels', label: 'St. Regis Red Sea Resort – 3 ليالي' },
      { id: 'i6', category: 'activities', label: 'رحلتين غوص بمرافقة مدرب معتمد' },
      { id: 'i7', category: 'food', label: 'عشاء خاص في Turquoiz' },
      { id: 'i8', category: 'transport', label: 'تنقل بين الجزر بقارب خاص' },
    ],
  },
  {
    id: 'tpl-riyadh-family',
    title: 'عطلة عائلية بالرياض',
    destinationId: 'riyadh',
    authorName: 'أم فهد',
    isMine: false,
    days: 2,
    price: 0,
    items: [
      { id: 'i9', category: 'hotels', label: 'Kimpton KAFD Riyadh – ليلة' },
      { id: 'i10', category: 'activities', label: 'يوم كامل في بوليفارد رياض سيتي' },
      { id: 'i11', category: 'food', label: 'غداء عائلي بالقرب من بوابة الدرعية' },
    ],
  },
  {
    id: 'tpl-jeddah-food',
    title: 'جولة مأكولات بحرية بجدة',
    destinationId: 'jeddah',
    authorName: 'نواف القرني',
    isMine: false,
    days: 2,
    price: 180,
    items: [
      { id: 'i12', category: 'food', label: 'غداء في Al Nakheel Seafood' },
      { id: 'i13', category: 'activities', label: 'تمشية مسائية بالبلد التاريخية' },
      { id: 'i14', category: 'food', label: 'عشاء في Byblos' },
    ],
  },
];

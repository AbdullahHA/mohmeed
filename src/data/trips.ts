import type { Trip } from '../types';

export const seedTrips: Trip[] = [
  {
    id: 'trip-alula',
    title: 'رحلة العلا مع الشلة',
    destination: 'العلا',
    coverImage: require('../assets/images/alula.png'),
    startDate: '2026-11-12',
    endDate: '2026-11-16',
    memberIds: ['me', 'sara', 'faisal'],
    budgetTotal: 9000,
    budgetItems: [
      { id: 'b1', category: 'hotels', label: 'إقامة 4 ليالي', amount: 3600 },
      { id: 'b2', category: 'food', label: 'مطاعم ومقاهي', amount: 1500 },
      { id: 'b3', category: 'transport', label: 'سيارة مؤجرة', amount: 1200 },
      { id: 'b4', category: 'activities', label: 'جولة مهرجان الشتاء', amount: 800 },
    ],
    itinerary: [
      { id: 'i1', day: 'اليوم الأول', time: '16:00', title: 'وصول وتسجيل دخول الفندق' },
      { id: 'i2', day: 'اليوم الثاني', time: '06:00', title: 'شروق الشمس عند حرة عويرض' },
      { id: 'i3', day: 'اليوم الثاني', time: '19:00', title: 'عشاء في مطعم صحارى' },
    ],
    messages: [
      { id: 'm1', fromId: 'sara', text: 'ودي نضيف يوم في مسكن الصالح', at: Date.now() - 1000 * 60 * 60 * 5 },
      { id: 'm2', fromId: 'faisal', text: 'تمام، بحجز التذاكر اليوم', at: Date.now() - 1000 * 60 * 60 * 4 },
    ],
    shareCode: 'ALULA-8F2K',
  },
  {
    id: 'trip-jeddah',
    title: 'إجازة جدة الصيفية',
    destination: 'جدة',
    coverImage: require('../assets/images/jeddah.png'),
    startDate: '2026-08-05',
    endDate: '2026-08-08',
    memberIds: ['me', 'noura'],
    budgetTotal: 4200,
    budgetItems: [
      { id: 'b5', category: 'hotels', label: 'إقامة 3 ليالي', amount: 2100 },
      { id: 'b6', category: 'food', label: 'مأكولات بحرية', amount: 900 },
      { id: 'b7', category: 'activities', label: 'رحلة بحرية عند الكورنيش', amount: 600 },
    ],
    itinerary: [
      { id: 'i4', day: 'اليوم الأول', time: '20:00', title: 'تمشية في البلد التاريخية' },
    ],
    messages: [
      { id: 'm3', fromId: 'noura', text: 'أفضل وقت للكورنيش بعد المغرب', at: Date.now() - 1000 * 60 * 30 },
    ],
    shareCode: 'JEDDAH-3QZ9',
  },
];

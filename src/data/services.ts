export type Service = {
  id: string;
  name: string;
  icon: 'map' | 'restaurant' | 'plane' | 'car' | 'yacht' | 'sport';
  locked: boolean;
};

export const services: Service[] = [
  { id: 'concierge', name: 'خدمات العناية الشخصية', icon: 'map', locked: true },
  { id: 'dining', name: 'خدمات حجوزات المطاعم', icon: 'restaurant', locked: true },
  { id: 'meet-greet', name: 'الاستقبال والتوديع', icon: 'plane', locked: true },
  { id: 'transport', name: 'التنقل في الوجهة (سيارة بسائق)', icon: 'car', locked: true },
  { id: 'yacht', name: 'حجز اليخوت الفاخرة', icon: 'yacht', locked: true },
  { id: 'sports', name: 'حجز الأنشطة الرياضية', icon: 'sport', locked: true },
];

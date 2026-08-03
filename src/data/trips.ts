export type BudgetItem = { label: string; amount: number; pct: number };
export type ItineraryDay = { day: string; title: string };
export type Friend = { id: string; name: string; initial: string };

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  currency: string;
  friends: Friend[];
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetItem[];
};

export const trips: Trip[] = [
  {
    id: 'abha-shabab',
    title: 'رحلة أبها مع الشباب',
    destination: 'أبها، السعودية',
    startDate: '١٢ أغسطس',
    endDate: '١٦ أغسطس',
    budgetTotal: 3000,
    currency: 'ر.س',
    friends: [
      { id: '1', name: 'ناصر', initial: 'ن' },
      { id: '2', name: 'محمد', initial: 'م' },
      { id: '3', name: 'سلطان', initial: 'س' },
      { id: '4', name: 'عبدالله', initial: 'ع' },
    ],
    itinerary: [
      { day: 'اليوم ١', title: 'وصول + عشاء في مطعم الشرفة' },
      { day: 'اليوم ٢', title: 'السودة وتلفريك جبل ذرة' },
      { day: 'اليوم ٣', title: 'قرية رجال ألمع التراثية' },
      { day: 'اليوم ٤', title: 'تسوق وسفر' },
    ],
    budgetBreakdown: [
      { label: 'الفنادق', amount: 1650, pct: 55 },
      { label: 'المطاعم', amount: 600, pct: 20 },
      { label: 'التنقل', amount: 450, pct: 15 },
      { label: 'أنشطة', amount: 300, pct: 10 },
    ],
  },
  {
    id: 'istanbul-honeymoon',
    title: 'شهر عسل إسطنبول',
    destination: 'إسطنبول، تركيا',
    startDate: '٣ أبريل',
    endDate: '٩ أبريل',
    budgetTotal: 9000,
    currency: 'ر.س',
    friends: [
      { id: '1', name: 'أنا', initial: 'أ' },
      { id: '2', name: 'زوجتي', initial: 'ز' },
    ],
    itinerary: [
      { day: 'اليوم ١', title: 'وصول + جولة في تقسيم' },
      { day: 'اليوم ٢', title: 'آيا صوفيا والسلطان أحمد' },
      { day: 'اليوم ٣', title: 'رحلة بحرية في البوسفور' },
    ],
    budgetBreakdown: [
      { label: 'الفنادق', amount: 4500, pct: 50 },
      { label: 'المطاعم', amount: 1800, pct: 20 },
      { label: 'التنقل', amount: 1350, pct: 15 },
      { label: 'أنشطة وتسوق', amount: 1350, pct: 15 },
    ],
  },
];

export function tripById(id: string): Trip | undefined {
  return trips.find((t) => t.id === id);
}

export function addTrip(trip: Trip) {
  trips.unshift(trip);
}

import type { Ionicons } from '@expo/vector-icons';
import type { CheckInRecord } from '../types';

export type CheckInBadge = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  earned: boolean;
  progress: { current: number; target: number };
};

function longestDailyStreak(checkIns: CheckInRecord[]): number {
  const days = [...new Set(checkIns.map((c) => new Date(c.createdAt).toDateString()))]
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);
  let best = days.length > 0 ? 1 : 0;
  let current = best;
  for (let i = 1; i < days.length; i++) {
    const dayGap = Math.round((days[i] - days[i - 1]) / 86400000);
    current = dayGap === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

export function computeCheckInBadges(checkIns: CheckInRecord[]): CheckInBadge[] {
  const distinctVenues = new Set(checkIns.map((c) => c.venueId)).size;
  const venueCounts = new Map<string, number>();
  for (const c of checkIns) venueCounts.set(c.venueId, (venueCounts.get(c.venueId) ?? 0) + 1);
  const maxAtOneVenue = Math.max(0, ...venueCounts.values());
  const foodieCount = checkIns.filter((c) => c.category === 'restaurant' || c.category === 'cafe').length;
  const streak = longestDailyStreak(checkIns);

  return [
    {
      id: 'first-step',
      label: 'أول خطوة',
      description: 'سجّل أول وصول لك',
      icon: 'footsteps-outline',
      earned: checkIns.length >= 1,
      progress: { current: Math.min(checkIns.length, 1), target: 1 },
    },
    {
      id: 'explorer',
      label: 'المستكشف',
      description: 'سجّل وصولك في 5 أماكن مختلفة',
      icon: 'compass-outline',
      earned: distinctVenues >= 5,
      progress: { current: Math.min(distinctVenues, 5), target: 5 },
    },
    {
      id: 'regular',
      label: 'الزبون الدائم',
      description: 'سجّل وصولك 3 مرات لنفس المكان',
      icon: 'heart-outline',
      earned: maxAtOneVenue >= 3,
      progress: { current: Math.min(maxAtOneVenue, 3), target: 3 },
    },
    {
      id: 'foodie',
      label: 'متذوّق',
      description: 'سجّل وصولك في 5 مطاعم أو كافيهات',
      icon: 'restaurant-outline',
      earned: foodieCount >= 5,
      progress: { current: Math.min(foodieCount, 5), target: 5 },
    },
    {
      id: 'streak',
      label: 'سلسلة متتالية',
      description: '3 أيام متتالية فيها تسجيل وصول',
      icon: 'flame-outline',
      earned: streak >= 3,
      progress: { current: Math.min(streak, 3), target: 3 },
    },
  ];
}

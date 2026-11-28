import type { Ionicons } from '@expo/vector-icons';

export type PassportBadgeContext = {
  stampsCount: number;
  countriesVisited: number;
  countriesSet: Set<string>;
  worldPercent: number;
};

export type PassportBadge = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isUnlocked: (ctx: PassportBadgeContext) => boolean;
};

export const PASSPORT_BADGES: PassportBadge[] = [
  {
    id: 'first-stamp',
    label: 'أول ختم',
    description: 'سجّل أول مكان زرته',
    icon: 'flag-outline',
    isUnlocked: (ctx) => ctx.stampsCount >= 1,
  },
  {
    id: 'home-country',
    label: 'زرت وطنك',
    description: 'سجّل زيارة داخل السعودية',
    icon: 'home-outline',
    isUnlocked: (ctx) => ctx.countriesSet.has('السعودية'),
  },
  {
    id: 'explorer',
    label: 'مستكشف',
    description: '5 أختام سفر',
    icon: 'compass-outline',
    isUnlocked: (ctx) => ctx.stampsCount >= 5,
  },
  {
    id: 'multi-country',
    label: 'عابر الحدود',
    description: '3 دول مختلفة',
    icon: 'airplane-outline',
    isUnlocked: (ctx) => ctx.countriesVisited >= 3,
  },
  {
    id: 'traveler',
    label: 'رحّالة',
    description: '15 ختم سفر',
    icon: 'map-outline',
    isUnlocked: (ctx) => ctx.stampsCount >= 15,
  },
  {
    id: 'country-collector',
    label: 'جامع الدول',
    description: '10 دول مختلفة',
    icon: 'globe-outline',
    isUnlocked: (ctx) => ctx.countriesVisited >= 10,
  },
  {
    id: 'world-quarter',
    label: 'ربع العالم',
    description: '25% من دول العالم',
    icon: 'planet-outline',
    isUnlocked: (ctx) => ctx.worldPercent >= 25,
  },
  {
    id: 'legend',
    label: 'أسطورة السفر',
    description: '20 دولة مختلفة',
    icon: 'trophy-outline',
    isUnlocked: (ctx) => ctx.countriesVisited >= 20,
  },
];

// Every number here comes straight from data the user actually generated —
// no invented stats. XP and levels follow SPEC.md §18 exactly: a trip is
// worth +100, a new country +150, a post (مدونة) +80, a rating +20 — summed
// from real counts, never a fabricated total.

export type TravelerLevel = {
  tier: number;
  label: string;
};

export type TravelerXpInputs = {
  tripsCount: number;
  countriesCount: number;
  postsCount: number;
  reviewsCount: number;
};

export function computeXp({ tripsCount, countriesCount, postsCount, reviewsCount }: TravelerXpInputs): number {
  return tripsCount * 100 + countriesCount * 150 + postsCount * 80 + reviewsCount * 20;
}

const LEVEL_THRESHOLDS: { min: number; label: string }[] = [
  { min: 0, label: 'مبتدئ' },
  { min: 500, label: 'مستكشف' },
  { min: 1500, label: 'مستكشف ذهبي' },
  { min: 2500, label: 'رحّالة' },
  { min: 3000, label: 'سفير' },
];

export function computeTravelerLevel(xp: number): TravelerLevel {
  let tier = 0;
  let label = LEVEL_THRESHOLDS[0].label;
  LEVEL_THRESHOLDS.forEach((entry, index) => {
    if (xp >= entry.min) {
      tier = index;
      label = entry.label;
    }
  });
  return { tier, label };
}

export function nextLevelThreshold(xp: number): { remaining: number; label: string } | null {
  const next = LEVEL_THRESHOLDS.find((entry) => entry.min > xp);
  if (!next) return null;
  return { remaining: next.min - xp, label: next.label };
}

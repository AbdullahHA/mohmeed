// Every number here comes straight from data the user actually generated —
// no invented percentages or arbitrary XP totals. "Level" is just a label
// for how many distinct places (catalog + manual stamps) someone has logged.

export type TravelerLevel = {
  tier: number;
  label: string;
};

const LEVEL_THRESHOLDS: { min: number; label: string }[] = [
  { min: 0, label: 'مسافر جديد' },
  { min: 3, label: 'مستكشف' },
  { min: 6, label: 'مستكشف نشيط' },
  { min: 10, label: 'مستكشف ذهبي' },
  { min: 16, label: 'رحالة' },
  { min: 25, label: 'رحالة عالمي' },
];

export function computeTravelerLevel(stampCount: number): TravelerLevel {
  let tier = 0;
  let label = LEVEL_THRESHOLDS[0].label;
  LEVEL_THRESHOLDS.forEach((entry, index) => {
    if (stampCount >= entry.min) {
      tier = index;
      label = entry.label;
    }
  });
  return { tier, label };
}

export function nextLevelThreshold(stampCount: number): { remaining: number; label: string } | null {
  const next = LEVEL_THRESHOLDS.find((entry) => entry.min > stampCount);
  if (!next) return null;
  return { remaining: next.min - stampCount, label: next.label };
}

import type { CheckInRecord } from '../types';

export type LeaderboardEntry = {
  userId: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  avatarUrl?: string | null;
  count: number;
  distinctVenues: number;
};

/**
 * Points are simply "check-ins this week" — honest and legible, unlike
 * Swarm's opaque scoring. Private check-ins still count toward the
 * owner's own score (they're real activity), they just never reveal the
 * venue to anyone else — loadWeeklyCheckIns already only returns rows the
 * caller is allowed to see at all.
 */
export function computeLeaderboard(checkIns: CheckInRecord[], meId: string, meName: string): LeaderboardEntry[] {
  const byUser = new Map<string, { entry: LeaderboardEntry; venues: Set<string> }>();

  for (const c of checkIns) {
    const userId = c.user?.id ?? meId;
    const name = c.user?.name ?? meName;
    const existing = byUser.get(userId);
    if (existing) {
      existing.entry.count += 1;
      existing.venues.add(c.venueId);
    } else {
      byUser.set(userId, {
        entry: {
          userId,
          name,
          emoji: c.user?.emoji,
          color: c.user?.color,
          avatarUrl: c.user?.avatarUrl,
          count: 1,
          distinctVenues: 1,
        },
        venues: new Set([c.venueId]),
      });
    }
  }

  if (!byUser.has(meId)) {
    byUser.set(meId, { entry: { userId: meId, name: meName, count: 0, distinctVenues: 0 }, venues: new Set() });
  }

  return [...byUser.values()]
    .map(({ entry, venues }) => ({ ...entry, distinctVenues: venues.size }))
    .sort((a, b) => b.count - a.count || b.distinctVenues - a.distinctVenues);
}

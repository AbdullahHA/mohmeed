// §22.16 location sharing is intentionally ephemeral: positions travel only
// over a live Supabase Realtime broadcast channel and are never written to
// the database, so no location history is ever kept. The only thing that
// touches storage is a single direct_message announcing the share (who,
// until when, which channel) — never a coordinate.
const SHARE_PREFIX = '__LOCATION_SHARE__';

export function buildShareChannelName(userIdA: string, userIdB: string): string {
  const [a, b] = [userIdA, userIdB].sort();
  return `loc-share-${a}-${b}-${Date.now()}`;
}

export function encodeLocationShareMessage(channel: string, expiresAtMs: number): string {
  return `${SHARE_PREFIX}:${channel}:${expiresAtMs}`;
}

export function parseLocationShareMessage(text: string): { channel: string; expiresAtMs: number } | null {
  if (!text.startsWith(SHARE_PREFIX + ':')) return null;
  const parts = text.split(':');
  if (parts.length < 3) return null;
  const expiresAtMs = Number(parts[parts.length - 1]);
  const channel = parts.slice(1, -1).join(':');
  if (!channel || Number.isNaN(expiresAtMs)) return null;
  return { channel, expiresAtMs };
}

export const LOCATION_SHARE_DURATIONS = [
  { label: 'ساعة', ms: 60 * 60 * 1000 },
  { label: 'اليوم', ms: 24 * 60 * 60 * 1000 },
] as const;

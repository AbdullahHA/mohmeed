// Mirrors locationShare.ts's structured-message pattern: a place share is
// just a direct_message whose text encodes a real places.id, so the
// recipient's chat bubble can render it as a card and offer "add to
// schedule" — no separate table, no duplicated place data.
const SHARE_PREFIX = '__PLACE_SHARE__';

export function encodePlaceShareMessage(placeId: string): string {
  return `${SHARE_PREFIX}:${placeId}`;
}

export function parsePlaceShareMessage(text: string): { placeId: string } | null {
  if (!text.startsWith(SHARE_PREFIX + ':')) return null;
  const placeId = text.slice(SHARE_PREFIX.length + 1);
  if (!placeId) return null;
  return { placeId };
}

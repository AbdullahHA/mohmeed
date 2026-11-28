import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

// Mirrors placeShare.ts's structured-message pattern: trip_messages stays
// text-only, and a specially-prefixed string tells the chat bubble
// renderer to decode it into a card instead of plain text.
const IMAGE_PREFIX = '__IMAGE__';
const POLL_PREFIX = '__POLL__';

export function encodeImageMessage(path: string): string {
  return `${IMAGE_PREFIX}:${path}`;
}

export function parseImageMessage(text: string): { path: string } | null {
  if (!text.startsWith(IMAGE_PREFIX + ':')) return null;
  const path = text.slice(IMAGE_PREFIX.length + 1);
  return path ? { path } : null;
}

export function encodePollMessage(pollId: string): string {
  return `${POLL_PREFIX}:${pollId}`;
}

export function parsePollMessage(text: string): { pollId: string } | null {
  if (!text.startsWith(POLL_PREFIX + ':')) return null;
  const pollId = text.slice(POLL_PREFIX.length + 1);
  return pollId ? { pollId } : null;
}

/**
 * Opens the device photo library and uploads the chosen image to the
 * trip's private folder in the `trip-chat` storage bucket. Returns the
 * storage path (not a URL — the bucket is private, so a signed URL has
 * to be requested separately) or null if cancelled/denied/failed.
 */
export async function pickAndUploadChatImage(tripId: string, userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${tripId}/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('trip-chat')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
  if (error) throw error;

  return path;
}

/** Signed URLs expire, so every chat screen resolves fresh ones on load. */
export async function signChatImagePaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const unique = Array.from(new Set(paths));
  const results = await Promise.all(
    unique.map(async (path) => {
      const { data } = await supabase.storage.from('trip-chat').createSignedUrl(path, 60 * 60 * 24);
      return [path, data?.signedUrl ?? null] as const;
    })
  );
  const map: Record<string, string> = {};
  results.forEach(([path, url]) => {
    if (url) map[path] = url;
  });
  return map;
}

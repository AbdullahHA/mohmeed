import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import type { TripDocumentVisibility } from '../types';

/**
 * Opens the photo library, uploads the chosen image to the trip-documents
 * bucket under a path that encodes visibility (shared docs are readable by
 * any trip member, private docs only by their owner — enforced by storage
 * RLS, not just app logic), and returns a signed URL (the bucket is
 * private, so there is no public URL).
 */
export async function pickAndUploadTripDocumentImage(
  tripId: string,
  ownerId: string,
  visibility: TripDocumentVisibility
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path =
    visibility === 'private'
      ? `${tripId}/private/${ownerId}/${Date.now()}.${ext}`
      : `${tripId}/shared/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('trip-documents')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
  if (error) throw error;

  return path;
}

export async function getTripDocumentSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('trip-documents').createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

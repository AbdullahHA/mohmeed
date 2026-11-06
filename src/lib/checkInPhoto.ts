import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/**
 * Opens the device photo library, uploads the chosen image to the user's
 * own folder in the `check-in-photos` storage bucket, and returns its
 * public URL. Returns null if the user cancelled, denied permission, or
 * the upload failed. Mirrors lib/travelPosts.ts's upload helper.
 */
export async function pickAndUploadCheckInPhoto(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('check-in-photos')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
  if (error) throw error;

  const { data } = supabase.storage.from('check-in-photos').getPublicUrl(path);
  return data.publicUrl;
}

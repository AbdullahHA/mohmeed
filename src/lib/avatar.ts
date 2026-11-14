import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/**
 * Opens the device photo library, uploads the chosen image to the user's
 * own folder in the `avatars` storage bucket (overwriting any previous
 * photo), and returns its public URL. Returns null if the user cancelled,
 * denied permission, or the upload failed.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Bust any cached copy of the previous photo at this same path.
  return `${data.publicUrl}?v=${Date.now()}`;
}

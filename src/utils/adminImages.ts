import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

/**
 * Opens the device image picker, uploads the chosen image to the
 * `images` storage bucket, and returns its public URL. Returns null if
 * the user cancelled or picking/uploading failed.
 */
export async function pickAndUploadImage(folder: string, fileId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${folder}/${fileId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

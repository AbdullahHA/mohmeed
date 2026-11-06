import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus | 'web'> {
  if (Platform.OS === 'web') return 'web';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// Requests OS notification permission (if not already decided) and, on
// success, registers this device's Expo push token against the signed-in
// profile so the admin "send notification" tools actually have somewhere
// to deliver to — the piece that was missing: push_tokens stayed empty
// because nothing ever called getExpoPushTokenAsync.
export async function registerForPushNotifications(
  profileId: string
): Promise<{ granted: boolean; token?: string }> {
  if (Platform.OS === 'web') return { granted: false };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  if (status !== 'granted') return { granted: false };

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return { granted: true };

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = data;
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ profile_id: profileId, expo_push_token: token }, { onConflict: 'expo_push_token' });
    if (error) return { granted: true };
    return { granted: true, token };
  } catch {
    // Push tokens aren't available in every environment (simulators,
    // Expo Go without a dev build, etc.) — permission was still granted.
    return { granted: true };
  }
}

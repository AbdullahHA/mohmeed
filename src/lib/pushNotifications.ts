import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Registers this device for push notifications and links its Expo push
// token to the signed-in user, so an admin broadcast (or a future
// event-triggered push) can actually reach it. No-ops for guests and on
// platforms/simulators without push capability.
export async function registerPushToken(userId: string) {
  try {
    if (!Constants.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await supabase
      .from('push_tokens')
      .upsert({ profile_id: userId, expo_push_token: data }, { onConflict: 'expo_push_token' });
  } catch {
    // Permission denied, simulator, or network hiccup — not fatal, just skip.
  }
}

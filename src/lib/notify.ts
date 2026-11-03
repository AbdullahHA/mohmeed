/** التذكيرات المحلية (22.12). على الويب ما فيه إشعارات محلية، فتتجاهل بهدوء. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Trip } from '../data/types';
import { addDays, fromISO } from './format';

let configured = false;
function configure() {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true }),
  });
}

export async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  configure();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function at(date: Date, title: string, body: string, id: string) {
  if (Platform.OS === 'web' || date.getTime() < Date.now()) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/** قبل الرحلة بـ 7 أيام ويوم: التجهيز، وقبلها بيوم: حمّل بدون نت */
export async function scheduleTripReminders(trip: Trip) {
  try {
    if (!trip.startDate || !(await ensurePermission())) return;
    const start = fromISO(trip.startDate);
    const week = addDays(start, -7);
    week.setHours(19, 0, 0, 0);
    const dayBefore = addDays(start, -1);
    dayBefore.setHours(20, 0, 0, 0);
    await at(week, trip.title, 'باقي أسبوع على رحلتك. شوف وش ناقص في التجهيز.', `${trip.id}-week`);
    await at(dayBefore, 'رحلتك بكرة ✈︎', 'افتح الرحلة عشان تنحفظ على جوالك وتشتغل بدون نت.', `${trip.id}-day`);
  } catch {
    /* الإشعارات اختيارية */
  }
}

export async function scheduleLeaveNow(id: string, when: Date, place: string) {
  try {
    if (!(await ensurePermission())) return;
    await at(when, 'اطلع الحين', `عشان توصل ${place} على الموعد`, `leave-${id}`);
  } catch {
    /* اختياري */
  }
}

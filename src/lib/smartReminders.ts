import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getPrayerTimesForDay, PRAYER_LABELS } from './prayerTimes';
import type { Coordinate } from './geo';
import type { Trip, TripDocument } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type ReminderType = 'offline' | 'checklist' | 'flightCheckin' | 'prayer' | 'quickRate';

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  offline: 'حمّل رحلتك بدون نت (قبلها بيوم)',
  checklist: 'ناقصك مهام تجهيز (قبل 7 أيام ويوم)',
  flightCheckin: 'تسجيل دخول الطيران (قبل الإقلاع بـ24 ساعة)',
  prayer: 'تذكير الصلاة القادمة',
  quickRate: 'قيّم تجربتك بعد الوصول',
};

const SETTINGS_KEY = 'yalla-nsafer:reminder-settings';
const SCHEDULED_KEY_PREFIX = 'yalla-nsafer:reminder-ids:';
const MAX_PER_DAY = 6;

const DEFAULT_SETTINGS: Record<ReminderType, boolean> = {
  offline: true,
  checklist: true,
  flightCheckin: true,
  prayer: false,
  quickRate: true,
};

export async function getReminderSettings(): Promise<Record<ReminderType, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setReminderEnabled(type: ReminderType, enabled: boolean): Promise<void> {
  const current = await getReminderSettings();
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, [type]: enabled }));
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

type Candidate = { type: ReminderType; at: Date; title: string; body: string };

const PRIORITY: Record<ReminderType, number> = {
  offline: 0,
  checklist: 1,
  flightCheckin: 2,
  quickRate: 3,
  prayer: 4,
};

export async function cancelTripReminders(tripId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY_PREFIX + tripId);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    }
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(SCHEDULED_KEY_PREFIX + tripId).catch(() => {});
}

export async function scheduleTripReminders(
  trip: Trip,
  flightDocuments: Pick<TripDocument, 'startsAt'>[],
  coordinate: Coordinate | null
): Promise<void> {
  await cancelTripReminders(trip.id);
  if (Platform.OS === 'web') return;

  const granted = await requestPermission();
  if (!granted) return;

  const settings = await getReminderSettings();
  const now = Date.now();
  const hasRealDates = /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(trip.endDate);
  const candidates: Candidate[] = [];

  if (hasRealDates) {
    const start = new Date(`${trip.startDate}T09:00:00`);
    const end = new Date(`${trip.endDate}T20:00:00`);

    if (settings.offline) {
      candidates.push({
        type: 'offline',
        at: new Date(start.getTime() - 24 * 3600 * 1000),
        title: 'حمّل رحلتك بدون نت',
        body: `رحلتك إلى ${trip.destination} تبدأ بكرة — افتح جدولها الحين عشان يتحفظ على جهازك.`,
      });
    }

    const incomplete = trip.checklist.filter((c) => !c.done).length;
    if (settings.checklist && incomplete > 0) {
      [7, 1].forEach((daysBefore) => {
        candidates.push({
          type: 'checklist',
          at: new Date(start.getTime() - daysBefore * 24 * 3600 * 1000),
          title: 'ناقصك تجهيزات',
          body: `باقي ${incomplete} مهمة في قائمة تجهيز رحلة ${trip.destination}.`,
        });
      });
    }

    if (settings.quickRate) {
      candidates.push({
        type: 'quickRate',
        at: new Date(start.getTime() + 2 * 3600 * 1000),
        title: `كيف كانت ${trip.destination}؟`,
        body: 'قيّم تجربتك بأقل من 5 ثواني.',
      });
    }

    if (settings.prayer && coordinate) {
      for (let d = new Date(start); d.getTime() <= end.getTime(); d = new Date(d.getTime() + 24 * 3600 * 1000)) {
        const times = getPrayerTimesForDay(coordinate, d);
        (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach((name) => {
          candidates.push({
            type: 'prayer',
            at: new Date(times[name].getTime() - 10 * 60 * 1000),
            title: `اقترب وقت ${PRAYER_LABELS[name]}`,
            body: 'باقي 10 دقائق على الأذان.',
          });
        });
      }
    }
  }

  if (settings.flightCheckin) {
    flightDocuments.forEach((doc) => {
      if (!doc.startsAt) return;
      const departure = new Date(doc.startsAt);
      if (Number.isNaN(departure.getTime())) return;
      candidates.push({
        type: 'flightCheckin',
        at: new Date(departure.getTime() - 24 * 3600 * 1000),
        title: 'سجّل دخول رحلتك',
        body: 'رحلة طيرانك تقلع بعد 24 ساعة — ما تنسى تسجيل الدخول.',
      });
    });
  }

  const future = candidates.filter((c) => c.at.getTime() > now);

  const byDay = new Map<string, Candidate[]>();
  future.forEach((c) => {
    const key = c.at.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(c);
  });
  const final: Candidate[] = [];
  byDay.forEach((list) => {
    list.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
    final.push(...list.slice(0, MAX_PER_DAY));
  });

  const ids: string[] = [];
  for (const c of final) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: c.title, body: c.body, data: { tripId: trip.id, type: c.type } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: c.at },
    });
    ids.push(id);
  }
  if (ids.length > 0) {
    await AsyncStorage.setItem(SCHEDULED_KEY_PREFIX + trip.id, JSON.stringify(ids));
  }
}

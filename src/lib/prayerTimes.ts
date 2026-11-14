import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from 'adhan';
import type { Coordinate } from './geo';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

const SAUDI_BOUNDS = { minLat: 16, maxLat: 32.5, minLng: 34.5, maxLng: 56 };

function isInSaudiArabia(coord: Coordinate): boolean {
  return (
    coord.latitude >= SAUDI_BOUNDS.minLat &&
    coord.latitude <= SAUDI_BOUNDS.maxLat &&
    coord.longitude >= SAUDI_BOUNDS.minLng &&
    coord.longitude <= SAUDI_BOUNDS.maxLng
  );
}

export function getPrayerTimesForDay(coord: Coordinate, date: Date): Record<PrayerName, Date> {
  const coordinates = new Coordinates(coord.latitude, coord.longitude);
  const params = isInSaudiArabia(coord) ? CalculationMethod.UmmAlQura() : CalculationMethod.MuslimWorldLeague();
  const times = new PrayerTimes(coordinates, date, params);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function getNextPrayer(coord: Coordinate, now: Date): { name: PrayerName; at: Date } {
  const today = getPrayerTimesForDay(coord, now);
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const name of order) {
    if (today[name].getTime() > now.getTime()) return { name, at: today[name] };
  }
  const tomorrow = getPrayerTimesForDay(coord, new Date(now.getTime() + 86400000));
  return { name: 'fajr', at: tomorrow.fajr };
}

export function getQiblaBearing(coord: Coordinate): number {
  return Qibla(new Coordinates(coord.latitude, coord.longitude));
}

// `timeZone` should be the IANA name of wherever these times are FOR (a
// destination's own timezone), not the device's. Omit it only when the
// times already belong to wherever the device physically is (live GPS) —
// the OS keeps the device clock in sync with real location, so the
// device's own timezone is correct there.
export function formatTime(date: Date, timeZone?: string): string {
  return date.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone });
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `بعد ${hours} س ${minutes} د`;
  return `بعد ${minutes} د`;
}

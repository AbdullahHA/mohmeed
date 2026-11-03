/** أوقات الصلاة والقبلة (22.8). أم القرى داخل المملكة، ورابطة العالم الإسلامي برّاها. */
import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from 'adhan';

export const PRAYER_NAME = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' } as const;
type Key = keyof typeof PRAYER_NAME;

export function prayerTimes(lat: number, lng: number, date = new Date(), inSaudi = true) {
  const params = inSaudi ? CalculationMethod.UmmAlQura() : CalculationMethod.MuslimWorldLeague();
  const pt = new PrayerTimes(new Coordinates(lat, lng), date, params);
  return pt;
}

export function nextPrayer(lat: number, lng: number, now = new Date(), inSaudi = true): { key: Key; name: string; at: Date } {
  const pt = prayerTimes(lat, lng, now, inSaudi);
  const order: Key[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const k of order) {
    const at = pt[k];
    if (at > now) return { key: k, name: PRAYER_NAME[k], at };
  }
  const tomorrow = new Date(now.getTime() + 864e5);
  const t2 = prayerTimes(lat, lng, tomorrow, inSaudi);
  return { key: 'fajr', name: PRAYER_NAME.fajr, at: t2.fajr };
}

export function sunset(lat: number, lng: number, date = new Date()) {
  return prayerTimes(lat, lng, date).sunset;
}

/** اتجاه القبلة بالدرجات من الشمال، ووصف تقريبي */
export function qibla(lat: number, lng: number) {
  const deg = Math.round(Qibla(new Coordinates(lat, lng)));
  const dirs = ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'];
  return { deg, text: dirs[Math.round(deg / 45) % 8] };
}

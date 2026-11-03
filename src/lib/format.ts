/** تنسيق التواريخ والأرقام بالعربي (أرقام لاتينية، بدون الاعتماد على Intl في الجوال) */

export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const MONTHS_SHORT = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
export const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const DAYS_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function todayISO(now = new Date()) {
  return toISO(now);
}
export function daysBetween(a: string, b: string) {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 864e5);
}
export function rangeDays(start: string, end: string): string[] {
  const out: string[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n && i < 60; i++) out.push(toISO(addDays(fromISO(start), i)));
  return out;
}

export function fmtDay(s: string) {
  const d = fromISO(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function fmtDayFull(s: string) {
  const d = fromISO(s);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function weekday(s: string) {
  return DAYS[fromISO(s).getDay()];
}
export function fmtRange(a?: string | null, b?: string | null) {
  if (!a) return 'بدون تاريخ';
  if (!b || a === b) return fmtDay(a);
  const da = fromISO(a), db = fromISO(b);
  if (da.getMonth() === db.getMonth()) return `${da.getDate()} – ${db.getDate()} ${MONTHS[db.getMonth()]}`;
  return `${fmtDay(a)} – ${fmtDay(b)}`;
}
export function fmtTime(t?: string | null) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  h = h % 24;
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${pm ? 'م' : 'ص'}`;
}
export function fmtClock(d: Date) {
  return fmtTime(`${d.getHours()}:${d.getMinutes()}`);
}

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.max(0, (now - ts) / 1000);
  if (s < 60) return 'الحين';
  if (s < 3600) return `قبل ${Math.round(s / 60)} دقيقة`;
  if (s < 86400) {
    const h = Math.round(s / 3600);
    return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : `قبل ${h} ساعات`;
  }
  const d = Math.round(s / 86400);
  if (d === 1) return 'أمس';
  if (d < 7) return DAYS[new Date(ts).getDay()];
  return fmtDay(toISO(new Date(ts)));
}
export function chatTime(ts: number, now = Date.now()) {
  const d = new Date(ts);
  if (toISO(d) === toISO(new Date(now))) return fmtClock(d);
  return timeAgo(ts, now);
}

export function num(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function sar(n: number) {
  return `${num(n)} ﷼`;
}
export function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}K`;
  return String(n);
}

export function daysWord(n: number) {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومين';
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوم`;
}
export function inDays(n: number) {
  if (n === 0) return 'اليوم';
  if (n === 1) return 'بكرة';
  return `بعد ${daysWord(n)}`;
}

/** التاريخ الهجري (أم القرى) لو الجهاز يدعمه، وإلا يرجع فاضي */
export function hijri(s: string): string {
  try {
    const f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
    return f.format(fromISO(s));
  } catch {
    return '';
  }
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'صباح الخير';
  return 'مساء الخير';
}

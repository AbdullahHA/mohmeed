/** قواعد العمل (SPEC القسم 18 و22). كلها دوال نقية سهلة الاختبار. */
import type { City, Expense, ID, Place, Slot, Trip, TripItem, TripMember, User, Follow, DateVote, Need } from '../data/types';
import { daysBetween, fmtTime, rangeDays, todayISO } from './format';

/* ---------- الرحلة ---------- */
export type TripStatus = 'draft' | 'upcoming' | 'ongoing' | 'past';
export function tripStatus(t: Trip, today = todayISO()): TripStatus {
  if (!t.startDate || !t.endDate) return 'draft';
  if (today < t.startDate) return 'upcoming';
  if (today > t.endDate) return 'past';
  return 'ongoing';
}
export function tripDays(t: Trip): string[] {
  return t.startDate && t.endDate ? rangeDays(t.startDate, t.endDate) : [];
}
export function tripLength(t: Trip) {
  return t.startDate && t.endDate ? daysBetween(t.startDate, t.endDate) + 1 : t.flexDays ?? 0;
}
export function countdown(t: Trip, today = todayISO()) {
  return t.startDate ? daysBetween(today, t.startDate) : null;
}

export const SLOT_ORDER: Slot[] = ['breakfast', 'morning', 'lunch', 'afternoon', 'dinner', 'evening'];
export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'الفطور',
  morning: 'الصباح',
  lunch: 'الغداء',
  afternoon: 'العصر',
  dinner: 'العشاء',
  evening: 'المساء',
};
export const SLOT_TIME: Record<Slot, string> = {
  breakfast: '08:30',
  morning: '10:00',
  lunch: '13:30',
  afternoon: '16:30',
  dinner: '20:30',
  evening: '21:30',
};
export const FOOD_SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner'];
export const OTHER_SLOTS: Slot[] = ['morning', 'afternoon', 'evening'];
export function slotsFor(p?: Place | null): Slot[] {
  return p && (p.category === 'food' || p.category === 'cafe') ? FOOD_SLOTS : OTHER_SLOTS;
}

export function sortItems(items: TripItem[]) {
  return [...items].sort((a, b) => (a.time ?? SLOT_TIME[a.slot ?? 'morning']).localeCompare(b.time ?? SLOT_TIME[b.slot ?? 'morning']) || a.order - b.order);
}

/* ---------- الأوقات ---------- */
const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
/** هل المكان مفتوح في وقت معيّن؟ (يدعم الإقفال بعد منتصف الليل مثل 25:00) */
export function isOpenAt(p: Place, time: string) {
  const o = mins(p.open), c = mins(p.close), t = mins(time);
  if (c >= 24 * 60) return t >= o || t + 24 * 60 < c;
  if (c < o) return t >= o || t < c;
  return t >= o && t < c;
}
export function openState(p: Place, now = new Date()) {
  const t = `${now.getHours()}:${now.getMinutes()}`;
  const open = isOpenAt(p, t);
  return { open, until: open ? p.close : p.open };
}

/* ---------- المسافات والمشاوير ---------- */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
/** تقدير وقت المشوار بالسيارة: المسافة × 1.3 (طرق) ÷ 40 كم/س + 5 دقائق */
export function driveMinutes(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.round((km(a, b) * 1.3 * 60) / 40 + 5);
}
export function fmtKm(k: number) {
  return k < 1 ? `${Math.round(k * 1000)} م` : `${k.toFixed(k < 10 ? 1 : 0)} كم`;
}
export function fmtMinutes(m: number) {
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}:${String(r).padStart(2, '0')} س` : `${h} س`;
}

/* ---------- كشف التعارض (22.5) ---------- */
export type Conflict = { kind: 'closed' | 'longhop' | 'packed' | 'norest'; itemId?: ID; text: string; fix: string };
export function dayConflicts(items: TripItem[], places: Map<ID, Place>, needs: Need[] = []): Conflict[] {
  const out: Conflict[] = [];
  const sorted = sortItems(items);
  sorted.forEach((it, i) => {
    const p = it.placeId ? places.get(it.placeId) : undefined;
    const time = it.time ?? (it.slot ? SLOT_TIME[it.slot] : null);
    if (p && time && !isOpenAt(p, time)) out.push({ kind: 'closed', itemId: it.id, text: `${p.name} تقفل ${fmtTime(p.close)} وموعدك ${fmtTime(time)}`, fix: 'قدّمه لوقت مفتوح' });
    const next = sorted[i + 1];
    const q = next?.placeId ? places.get(next.placeId) : undefined;
    if (p && q && driveMinutes(p, q) > 60) out.push({ kind: 'longhop', itemId: next.id, text: `المشوار من ${p.name} إلى ${q.name} أكثر من ساعة`, fix: 'بدّل الترتيب' });
  });
  const total = sorted.reduce((s, it) => s + (it.durationMin ?? (it.placeId ? places.get(it.placeId)?.durationMin ?? 60 : 60)), 0);
  if (sorted.length > 6 || total > 600) out.push({ kind: 'packed', text: 'اليوم مزحوم (أكثر من 6 أماكن أو 10 ساعات)', fix: 'انقل شي لبكرة' });
  if ((needs.includes('kids_under_5') || needs.includes('elderly')) && sorted.length >= 4) {
    const after = sorted.filter((x) => (x.time ?? '') >= '13:00' && (x.time ?? '') <= '16:00');
    if (after.length >= 2) out.push({ kind: 'norest', text: 'ما فيه وقت راحة بعد الظهر', fix: 'أضف استراحة' });
  }
  return out;
}

/* ---------- الميزانية والتسوية (15.4) ---------- */
export function spent(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amountSar, 0);
}
export function byCategory(expenses: Expense[]) {
  const m: Record<string, number> = {};
  for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + e.amountSar;
  return m;
}
export function balances(expenses: Expense[], memberIds: ID[]) {
  const bal: Record<ID, number> = Object.fromEntries(memberIds.map((m) => [m, 0]));
  for (const e of expenses) {
    const split = e.splitBetween.length ? e.splitBetween : memberIds;
    const share = e.amountSar / split.length;
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + e.amountSar;
    for (const u of split) bal[u] = (bal[u] ?? 0) - share;
  }
  return bal;
}
export function myShare(expenses: Expense[], me: ID, memberIds: ID[]) {
  return expenses.reduce((s, e) => {
    const split = e.splitBetween.length ? e.splitBetween : memberIds;
    return split.includes(me) ? s + e.amountSar / split.length : s;
  }, 0);
}
/** أقل عدد تحويلات: الأكثر مديونية يدفع للأكثر دائنية */
export function settle(expenses: Expense[], memberIds: ID[]) {
  const bal = balances(expenses, memberIds);
  const debt = Object.entries(bal).filter(([, v]) => v < -0.5).map(([k, v]) => [k, -v] as [ID, number]).sort((a, b) => b[1] - a[1]);
  const cred = Object.entries(bal).filter(([, v]) => v > 0.5).map(([k, v]) => [k, v] as [ID, number]).sort((a, b) => b[1] - a[1]);
  const out: { from: ID; to: ID; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const x = Math.min(debt[i][1], cred[j][1]);
    out.push({ from: debt[i][0], to: cred[j][0], amount: Math.round(x) });
    debt[i][1] -= x;
    cred[j][1] -= x;
    if (debt[i][1] < 0.5) i++;
    if (cred[j][1] < 0.5) j++;
  }
  return out;
}

/* ---------- متى نسافر؟ (22.7) ---------- */
export function bestDates(votes: DateVote[], length: number) {
  const count: Record<string, number> = {};
  for (const v of votes) count[v.date] = (count[v.date] ?? 0) + 1;
  const dates = Object.keys(count).sort();
  if (!dates.length) return null;
  let best: { start: string; end: string; min: number; len: number } | null = null;
  for (let i = 0; i < dates.length; i++) {
    let j = i, mn = count[dates[i]];
    while (j + 1 < dates.length && daysBetween(dates[j], dates[j + 1]) === 1) {
      j++;
      mn = Math.min(mn, count[dates[j]]);
      const len = j - i + 1;
      if (len >= Math.max(1, length) && (!best || mn > best.min || (mn === best.min && len > best.len))) best = { start: dates[i], end: dates[j], min: mn, len };
    }
    if (length <= 1 && (!best || count[dates[i]] > best.min)) best = { start: dates[i], end: dates[i], min: count[dates[i]], len: 1 };
  }
  return best;
}

/* ---------- اجتماعي ---------- */
export function follows(fs: Follow[], a: ID, b: ID) {
  return fs.some((f) => !f.deleted && f.followerId === a && f.followingId === b);
}
export function mutual(fs: Follow[], a: ID, b: ID) {
  return follows(fs, a, b) && follows(fs, b, a);
}
export function overlap(a: Trip, b: Trip) {
  return !!(a.startDate && a.endDate && b.startDate && b.endDate && a.cityId === b.cityId && a.startDate <= b.endDate && b.startDate <= a.endDate);
}

/* ---------- الجواز والمستوى (القرار 8) ---------- */
export const LEVELS = [
  { name: 'مبتدئ', xp: 0 },
  { name: 'مستكشف', xp: 500 },
  { name: 'مستكشف ذهبي', xp: 1500 },
  { name: 'رحّالة', xp: 2500 },
  { name: 'سفير', xp: 3000 },
];
export function xpFor(stats: { trips: number; countries: number; posts: number; reviews: number }) {
  return stats.trips * 100 + stats.countries * 150 + stats.posts * 80 + stats.reviews * 20;
}
export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const next = LEVELS[i + 1];
  return { level: LEVELS[i], index: i, next, progress: next ? (xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp) : 1 };
}
export function worldPercent(countries: number) {
  return Math.max(1, Math.round((countries / 195) * 100));
}

/* ---------- الاقتراحات ---------- */
const INTEREST_CAT: Record<string, Place['category'][]> = {
  طبيعة: ['nature'],
  أكل: ['food', 'cafe'],
  تاريخ: ['landmarks'],
  تسوّق: ['shopping'],
  مغامرات: ['experiences', 'nature'],
  فعاليات: ['events'],
  بحر: ['nature', 'experiences'],
};
export function recommend(places: Place[], user: User, cities: City[], upcomingCityId?: ID | null) {
  const out: { place: Place; reason: string; score: number }[] = [];
  for (const p of places) {
    let score = p.rating, reason = '';
    if (upcomingCityId && p.cityId === upcomingCityId) {
      score += 2;
      reason = 'قريب من رحلتك';
    }
    for (const i of user.interests) {
      if (INTEREST_CAT[i]?.includes(p.category)) {
        score += 1;
        if (!reason) reason = i === 'أكل' ? 'لأنك تحب الأكل' : `لأنك تحب ${i === 'تاريخ' ? 'التاريخ' : i === 'طبيعة' ? 'الطبيعة' : i}`;
      }
    }
    if (!reason) reason = p.trending ? 'رائج هالأسبوع' : `من ${cities.find((c) => c.id === p.cityId)?.name ?? ''}`;
    out.push({ place: p, reason, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function priceLabel(p: Place) {
  if (p.avgMin && p.avgMax) return `${p.avgMin} – ${p.avgMax} ﷼`;
  if (p.ticketFrom) return `التذاكر من ${p.ticketFrom} ﷼`;
  if (p.priceLevel === 1) return 'مجاني أو رمزي';
  return '$'.repeat(p.priceLevel);
}

export function membersOf(members: TripMember[], tripId: ID) {
  return members.filter((m) => m.tripId === tripId && !m.deleted);
}

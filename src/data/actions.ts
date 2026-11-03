/** كل العمليات اللي تغيّر البيانات. الشاشات تستدعي هذي الدوال بس، ولا تكتب في المخزن مباشرة. */
import * as Haptics from 'expo-haptics';

import { addDays, fromISO, toISO, todayISO } from '../lib/format';
import { suggestPacking } from '../lib/guide';
import { inviteCode, uid } from '../lib/id';
import { SLOT_TIME, bestDates, membersOf, tripStatus } from '../lib/logic';
import { scheduleTripReminders } from '../lib/notify';
import { rpc } from '../lib/sync';
import { FX } from './seed';
import { getState, meId, useStore } from './store';
import { toast } from './ui';
import type {
  ChecklistItem,
  Expense,
  ExpenseCategory,
  GuidePlan,
  ID,
  Need,
  Slot,
  Trip,
  TravelerType,
  TripDoc,
  User,
} from './types';

const S = () => getState();
const db = () => S().db;
const live = <T extends { deleted?: boolean }>(l: T[]) => l.filter((x) => !x.deleted);
const now = () => Date.now();
const tap = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

/* ================= الجلسة ================= */
export function signInDemo() {
  S().setSession({ userId: 'u_me', guest: false });
}
export function continueAsGuest() {
  S().setSession({ userId: null, guest: true, onboarded: true });
}
export function completeOnboarding(p: { interests: string[]; travelerType?: TravelerType; city?: string }) {
  const me = meId();
  const u = db().users.find((x) => x.id === me);
  if (u) S().patch('users', me, { interests: p.interests.length ? p.interests : u.interests, travelerType: p.travelerType ?? u.travelerType, city: p.city || u.city });
  S().setSession({ onboarded: true });
}
export function signOut() {
  S().signOut();
}
export function updateProfile(p: Partial<User>) {
  S().patch('users', meId(), p);
  toast('انحفظ ملفك');
}

/* ================= الرحلات ================= */
const DEFAULT_TASKS: [ChecklistItem['group'], string][] = [
  ['bookings', 'حجز الطيران أو المواصلات'],
  ['bookings', 'حجز السكن'],
  ['docs', 'الهوية أو الجواز'],
];

export function createTrip(input: {
  title?: string;
  cityId: ID;
  startDate?: string | null;
  endDate?: string | null;
  flexMonth?: number | null;
  flexDays?: number | null;
  datesMode: Trip['datesMode'];
  travelerType: TravelerType;
  needs: Need[];
  autoPlan?: GuidePlan | null;
}) {
  const me = meId();
  const city = db().cities.find((c) => c.id === input.cityId)!;
  const id = uid('tr');
  const trip: Trip = {
    id,
    title: input.title?.trim() || `رحلة ${city.name}`,
    cityId: input.cityId,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    flexMonth: input.flexMonth ?? null,
    flexDays: input.flexDays ?? null,
    datesMode: input.datesMode,
    travelerType: input.travelerType,
    needs: input.needs,
    ownerId: me,
    visibility: 'private',
    scene: city.scene,
    plannedBudget: Math.round(city.budgetPerDay * Math.max(1, input.flexDays ?? 3) * (input.travelerType === 'solo' ? 1 : 2)),
    inviteCode: inviteCode(),
    published: false,
    createdAt: now(),
    updatedAt: now(),
  };
  S().put('trips', trip);
  S().put('members', { id: uid('m'), tripId: id, userId: me, role: 'organizer', updatedAt: now() });
  S().put('chats', { id: uid('ch'), type: 'trip', tripId: id, memberIds: [me], updatedAt: now() });
  const month = input.startDate ? fromISO(input.startDate).getMonth() : input.flexMonth ?? new Date().getMonth();
  const tasks = [...DEFAULT_TASKS];
  const country = db().countries.find((c) => c.code === city.countryCode);
  if (country && country.code !== 'SA') {
    if (!country.visaSA.startsWith('بدون')) tasks.push(['docs', `${country.visaSA} قبل 14 يوم`]);
    if (country.passportMonths) tasks.push(['docs', `تأكد إن الجواز صالح ${country.passportMonths} شهور`]);
  }
  for (const s of suggestPacking(city, month).slice(0, 4)) tasks.push(['bag', s]);
  tasks.forEach(([group, title]) => S().put('checklist', { id: uid('ck'), tripId: id, group, title, assigneeId: null, done: false, updatedAt: now() }));
  if (input.autoPlan && input.startDate) applyPlan(id, input.autoPlan, input.startDate);
  if (input.startDate) void scheduleTripReminders(trip);
  return id;
}

export function applyPlan(tripId: ID, plan: GuidePlan, start: string) {
  const me = meId();
  plan.days.forEach((d, i) => {
    const day = toISO(addDays(fromISO(start), i));
    d.placeIds.forEach((pid, j) => {
      const p = db().places.find((x) => x.id === pid);
      const food = p && (p.category === 'food' || p.category === 'cafe');
      const slot: Slot = food ? (j === 0 ? 'breakfast' : 'lunch') : j === 0 ? 'morning' : 'afternoon';
      S().put('items', { id: uid('i'), tripId, placeId: pid, day, slot, time: SLOT_TIME[slot], addedBy: me, via: 'guide', order: j, updatedAt: now() });
    });
  });
}

export function updateTrip(id: ID, p: Partial<Trip>) {
  S().patch('trips', id, p);
}

export function deleteTrip(id: ID) {
  S().remove('trips', id);
  toast('انحذفت الرحلة', { label: 'تراجع', onPress: () => S().restore('trips', id) });
}

export function leaveTrip(id: ID) {
  const m = db().members.find((x) => x.tripId === id && x.userId === meId());
  if (m) S().remove('members', m.id);
  toast('طلعت من الرحلة');
}

export function setRole(memberId: ID, role: 'organizer' | 'member' | 'viewer') {
  S().patch('members', memberId, { role });
}

function tripChat(tripId: ID) {
  return db().chats.find((c) => c.tripId === tripId && !c.deleted);
}
function systemMessage(chatId: ID, body: string) {
  S().put('messages', { id: uid('ms'), chatId, senderId: 'system', kind: 'system', body, createdAt: now(), updatedAt: now() });
}

export function addToTrip(tripId: ID, placeId: ID, day: string | null, slot: Slot | null, notify: boolean) {
  const me = meId();
  const order = db().items.filter((i) => i.tripId === tripId && i.day === day).length;
  const id = uid('i');
  S().put('items', { id, tripId, placeId, day, slot, time: slot ? SLOT_TIME[slot] : null, addedBy: me, order, updatedAt: now() });
  tap();
  const trip = db().trips.find((t) => t.id === tripId);
  const place = db().places.find((p) => p.id === placeId);
  const chat = tripChat(tripId);
  if (notify && chat && place) systemMessage(chat.id, `${db().users.find((u) => u.id === me)?.name} أضاف ${place.name} للجدول`);
  toast(`انضاف لـ${trip?.title ?? 'رحلتك'}`, { label: 'تراجع', onPress: () => S().remove('items', id) });
  return id;
}

export function addNote(tripId: ID, title: string, day: string | null, slot: Slot | null) {
  S().put('items', { id: uid('i'), tripId, title, day, slot, time: slot ? SLOT_TIME[slot] : null, addedBy: meId(), order: 99, updatedAt: now() });
}

export function moveItem(id: ID, day: string | null, slot?: Slot | null, time?: string | null) {
  S().patch('items', id, { day, ...(slot !== undefined ? { slot } : {}), ...(time !== undefined ? { time } : {}) });
}

export function removeItem(id: ID) {
  S().remove('items', id);
  toast('انحذف من الجدول', { label: 'تراجع', onPress: () => S().restore('items', id) });
}

export function saveOffline(tripId: ID) {
  S().patch('trips', tripId, { offlineSavedAt: now() });
  toast('الرحلة محفوظة على جوالك وتشتغل بدون نت');
}

export function publishTrip(tripId: ID, published: boolean) {
  S().patch('trips', tripId, { published, visibility: published ? 'followers' : 'private' });
  toast(published ? 'انشر الجدول للمتابعين' : 'صار الجدول خاص');
}

export function copyTrip(srcId: ID) {
  const src = db().trips.find((t) => t.id === srcId);
  if (!src) return null;
  const id = createTrip({ cityId: src.cityId, title: `${src.title} (نسختي)`, datesMode: 'flexible', flexDays: src.startDate && src.endDate ? undefined : 3, travelerType: src.travelerType, needs: [] });
  const items = live(db().items).filter((i) => i.tripId === srcId);
  items.forEach((i) => S().put('items', { ...i, id: uid('i'), tripId: id, day: null, addedBy: meId() }));
  toast('انسخت الخطة لرحلاتك');
  return id;
}

export function joinByCode(code: string) {
  const trip = live(db().trips).find((t) => t.inviteCode.toUpperCase() === code.trim().toUpperCase());
  if (!trip) return null;
  void rpc('join_trip', { code });
  const me = meId();
  if (!db().members.some((m) => m.tripId === trip.id && m.userId === me && !m.deleted)) {
    S().put('members', { id: uid('m'), tripId: trip.id, userId: me, role: 'member', updatedAt: now() });
    const chat = tripChat(trip.id);
    if (chat) {
      S().patch('chats', chat.id, { memberIds: [...new Set([...chat.memberIds, me])] });
      systemMessage(chat.id, `${db().users.find((u) => u.id === me)?.name} انضم للرحلة`);
    }
  }
  return trip.id;
}

/* ================= متى نسافر؟ ================= */
export function toggleDateVote(tripId: ID, date: string) {
  const me = meId();
  const v = db().dateVotes.find((x) => x.tripId === tripId && x.userId === me && x.date === date && !x.deleted);
  if (v) S().remove('dateVotes', v.id);
  else S().put('dateVotes', { id: uid('dv'), tripId, userId: me, date, updatedAt: now() });
  tap();
}
export function finalizeDates(tripId: ID) {
  const trip = db().trips.find((t) => t.id === tripId)!;
  const best = bestDates(live(db().dateVotes).filter((v) => v.tripId === tripId), trip.flexDays ?? 2);
  if (!best) return;
  S().patch('trips', tripId, { startDate: best.start, endDate: best.end, datesMode: 'fixed' });
  const chat = tripChat(tripId);
  if (chat) systemMessage(chat.id, 'انعتمدت التواريخ ✅');
  void scheduleTripReminders({ ...trip, startDate: best.start, endDate: best.end });
  toast('انعتمدت التواريخ وتبلّغت الشلة');
}

/* ================= الميزانية ================= */
export function addExpense(input: { tripId: ID; amount: number; currency: string; category: ExpenseCategory; note: string; paidBy?: ID; splitBetween?: ID[]; fromChat?: boolean }) {
  const rate = FX[input.currency] ?? 1;
  const members = membersOf(db().members, input.tripId).map((m) => m.userId);
  const e: Expense = {
    id: uid('e'),
    tripId: input.tripId,
    paidBy: input.paidBy ?? meId(),
    amount: input.amount,
    currency: input.currency,
    fxRate: rate,
    amountSar: Math.round(input.amount * rate),
    category: input.category,
    splitBetween: input.splitBetween?.length ? input.splitBetween : members,
    note: input.note,
    fromChat: input.fromChat,
    createdAt: now(),
    updatedAt: now(),
  };
  S().put('expenses', e);
  if (input.fromChat) {
    const chat = tripChat(input.tripId);
    if (chat) S().put('messages', { id: uid('ms'), chatId: chat.id, senderId: meId(), kind: 'expense', expenseId: e.id, createdAt: now(), updatedAt: now() });
  }
  toast('انسجّل المصروف', { label: 'تراجع', onPress: () => S().remove('expenses', e.id) });
  return e.id;
}
export function removeExpense(id: ID) {
  S().remove('expenses', id);
  toast('انحذف المصروف', { label: 'تراجع', onPress: () => S().restore('expenses', id) });
}
export function remindSettle(tripId: ID, text: string) {
  const chat = tripChat(tripId);
  if (chat) S().put('messages', { id: uid('ms'), chatId: chat.id, senderId: meId(), kind: 'text', body: text, createdAt: now(), updatedAt: now() });
  toast('انرسل التذكير في محادثة الشلة');
}

/* ================= التجهيز ================= */
export function toggleTask(id: ID) {
  const t = db().checklist.find((x) => x.id === id);
  if (t) S().patch('checklist', id, { done: !t.done });
  tap();
}
export function addTask(tripId: ID, group: ChecklistItem['group'], title: string) {
  if (!title.trim()) return;
  S().put('checklist', { id: uid('ck'), tripId, group, title: title.trim(), assigneeId: null, done: false, updatedAt: now() });
}
export function assignTask(id: ID, userId: ID | null) {
  S().patch('checklist', id, { assigneeId: userId });
}
export function removeTask(id: ID) {
  S().remove('checklist', id);
  toast('انحذفت المهمة', { label: 'تراجع', onPress: () => S().restore('checklist', id) });
}

/* ================= المستندات ================= */
export function addDoc(d: Omit<TripDoc, 'id' | 'updatedAt' | 'ownerId'>) {
  const id = uid('d');
  S().put('docs', { ...d, id, ownerId: meId(), updatedAt: now() });
  // الطيران والسكن ينضافون للجدول تلقائياً
  if ((d.kind === 'flight' || d.kind === 'stay') && d.startsAt) {
    const [day, time] = d.startsAt.split('T');
    S().put('items', { id: uid('i'), tripId: d.tripId, title: d.kind === 'flight' ? `✈︎ ${d.title}` : `🛏 ${d.title}`, day, slot: null, time: time ?? null, addedBy: meId(), via: 'doc', order: -1, updatedAt: now() });
  }
  toast('انضاف المستند');
  return id;
}
export function removeDoc(id: ID) {
  S().remove('docs', id);
  toast('انحذف المستند', { label: 'تراجع', onPress: () => S().restore('docs', id) });
}

/* ================= المحادثات ================= */
export function markRead(chatId: ID) {
  const me = meId();
  const r = db().reads.find((x) => x.chatId === chatId && x.userId === me);
  if (r) S().patch('reads', r.id, { lastReadAt: now() });
  else S().put('reads', { id: uid('rd'), chatId, userId: me, lastReadAt: now(), updatedAt: now() });
}
export function sendText(chatId: ID, body: string) {
  if (!body.trim()) return;
  S().put('messages', { id: uid('ms'), chatId, senderId: meId(), kind: 'text', body: body.trim(), createdAt: now(), updatedAt: now() });
  markRead(chatId);
}
export function sharePlace(chatId: ID, placeId: ID) {
  S().put('messages', { id: uid('ms'), chatId, senderId: meId(), kind: 'place', placeId, createdAt: now(), updatedAt: now() });
  toast('انرسل المكان');
}
export function sendGuide(chatId: ID, senderId: ID, body: string, plan?: GuidePlan | null) {
  S().put('messages', { id: uid('ms'), chatId, senderId, kind: plan ? 'plan' : 'text', body, plan: plan ?? null, createdAt: now(), updatedAt: now() });
}
export function createPoll(chatId: ID, question: string, options: { label: string; placeId?: ID | null }[], target?: { tripId: ID; day: string; slot: Slot } | null) {
  const pollId = uid('pl');
  S().put('polls', { id: pollId, chatId, question, options: options.map((o) => ({ id: uid('o'), ...o })), votes: {}, closed: false, target: target ?? null, createdBy: meId(), updatedAt: now() });
  S().put('messages', { id: uid('ms'), chatId, senderId: meId(), kind: 'poll', pollId, createdAt: now(), updatedAt: now() });
}
export function vote(pollId: ID, optionId: ID) {
  const p = db().polls.find((x) => x.id === pollId);
  if (!p || p.closed) return;
  const votes = { ...p.votes, [meId()]: optionId };
  S().patch('polls', pollId, { votes });
  tap();
  const chat = db().chats.find((c) => c.id === p.chatId);
  if (chat && chat.memberIds.every((m) => votes[m])) closePoll(pollId);
}
export function closePoll(pollId: ID) {
  const p = db().polls.find((x) => x.id === pollId);
  if (!p || p.closed) return;
  S().patch('polls', pollId, { closed: true });
  const tally: Record<ID, number> = {};
  Object.values(p.votes).forEach((o) => (tally[o] = (tally[o] ?? 0) + 1));
  const win = p.options.slice().sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))[0];
  if (win && p.target && win.placeId) {
    S().put('items', { id: uid('i'), tripId: p.target.tripId, placeId: win.placeId, day: p.target.day, slot: p.target.slot, time: SLOT_TIME[p.target.slot], addedBy: p.createdBy, via: 'poll', order: 9, updatedAt: now() });
    systemMessage(p.chatId, `فاز «${win.label}» وانضاف للجدول`);
  }
}
export function toggleMute(chatId: ID) {
  const c = db().chats.find((x) => x.id === chatId);
  if (!c) return;
  const me = meId();
  const muted = c.muted ?? [];
  S().patch('chats', chatId, { muted: muted.includes(me) ? muted.filter((x) => x !== me) : [...muted, me] });
}
export function openDirect(userId: ID) {
  const me = meId();
  const ex = live(db().chats).find((c) => c.type === 'direct' && c.memberIds.includes(me) && c.memberIds.includes(userId));
  if (ex) return ex.id;
  const id = uid('ch');
  S().put('chats', { id, type: 'direct', memberIds: [me, userId], updatedAt: now() });
  return id;
}

/* ================= اجتماعي ================= */
export function toggleFollow(userId: ID) {
  const me = meId();
  const f = db().follows.find((x) => x.followerId === me && x.followingId === userId && !x.deleted);
  if (f) S().remove('follows', f.id);
  else S().put('follows', { id: uid('f'), followerId: me, followingId: userId, updatedAt: now() });
  tap();
}
export function toggleSave(placeId: ID) {
  const me = meId();
  const s = db().saved.find((x) => x.userId === me && x.placeId === placeId && !x.deleted);
  if (s) {
    S().remove('saved', s.id);
    toast('انشال من المحفوظات');
  } else {
    S().put('saved', { id: uid('sv'), userId: me, placeId, updatedAt: now() });
    toast('انحفظ في محفوظاتي');
  }
  tap();
}
export function toggleWish(cityId: ID) {
  const me = meId();
  const w = db().wishes.find((x) => x.userId === me && x.cityId === cityId && !x.deleted);
  if (w) S().remove('wishes', w.id);
  else {
    S().put('wishes', { id: uid('w'), userId: me, cityId, updatedAt: now() });
    toast('انضافت لأمنياتي');
  }
}
export function createPost(p: { body: string; photos: string[]; photoUris?: string[]; placeId?: ID | null; tripId?: ID | null; type?: 'post' | 'recap' }) {
  const body = p.body.slice(0, 500);
  S().put('posts', { id: uid('po'), userId: meId(), photos: p.photos as never, photoUris: p.photoUris, body, placeId: p.placeId ?? null, tripId: p.tripId ?? null, type: p.type ?? 'post', likes: [], comments: 0, createdAt: now(), updatedAt: now() });
  toast('انتشر منشورك');
}
export function toggleLike(postId: ID) {
  const p = db().posts.find((x) => x.id === postId);
  if (!p) return;
  const me = meId();
  void rpc('toggle_like', { post: postId });
  S().patch('posts', postId, { likes: p.likes.includes(me) ? p.likes.filter((x) => x !== me) : [...p.likes, me] });
  tap();
}
export function quickReview(placeId: ID, rating: number, tags: string[], text: string) {
  S().put('reviews', { id: uid('rv'), userId: meId(), placeId, rating, tags, text, createdAt: now(), updatedAt: now() });
  toast('شكراً! تقييمك يساعد المسافرين');
}

/* ================= الوصول والأختام ================= */
export function checkin(placeId: ID) {
  const me = meId();
  const p = db().places.find((x) => x.id === placeId);
  if (!p) return { newStamp: false };
  S().put('checkins', { id: uid('ci'), userId: me, placeId, cityId: p.cityId, createdAt: now(), updatedAt: now() });
  const has = db().stamps.some((s) => s.userId === me && s.cityId === p.cityId && !s.deleted);
  if (!has) S().put('stamps', { id: uid('st'), userId: me, cityId: p.cityId, date: todayISO(), updatedAt: now() });
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  return { newStamp: !has };
}
export function addStamp(cityId: ID, date: string) {
  S().put('stamps', { id: uid('st'), userId: meId(), cityId, date, manual: true, updatedAt: now() });
  toast('انضاف الختم لجوازك');
}

/* ================= المجتمعات ================= */
export function requestCommunity(name: string, description: string, icon: string, color: string) {
  const me = meId();
  S().put('communities', { id: uid('cm'), name, description, icon, color, status: 'pending', requestedBy: me, memberIds: [me], moderatorIds: [me], updatedAt: now() });
  toast('انرسل طلبك، وبنبلغك بعد المراجعة');
}
export function joinCommunity(id: ID) {
  const c = db().communities.find((x) => x.id === id);
  if (!c) return null;
  const me = meId();
  void rpc('join_community', { cid: id });
  S().patch('communities', id, { memberIds: [...new Set([...c.memberIds, me])] });
  let chat = live(db().chats).find((x) => x.communityId === id);
  if (!chat) {
    const cid = uid('ch');
    S().put('chats', { id: cid, type: 'community', communityId: id, memberIds: [...c.memberIds, me], updatedAt: now() });
    return cid;
  }
  S().patch('chats', chat.id, { memberIds: [...new Set([...chat.memberIds, me])] });
  toast(`انضميت لـ${c.name}`);
  return chat.id;
}
export function report(input: { communityId?: ID | null; messageId?: ID | null; userId?: ID | null; reason: string }) {
  S().put('reports', { id: uid('rp'), reporterId: meId(), status: 'open', createdAt: now(), ...input, updatedAt: now() });
  toast('وصلنا البلاغ، وبنراجعه');
}

/* ================= الإشعارات والمشاركة ================= */
export function markAllNotifsRead() {
  db().notifications.filter((n) => n.userId === meId() && !n.read).forEach((n) => S().patch('notifications', n.id, { read: true }));
}
export function startShare(withUserId: ID, hours: number) {
  S().put('shares', { id: uid('sh'), userId: meId(), withUserId, expiresAt: now() + hours * 36e5, active: true, updatedAt: now() });
  toast('بدأت مشاركة موقعك');
}
export function stopShares() {
  db().shares.filter((s) => s.userId === meId() && s.active).forEach((s) => S().patch('shares', s.id, { active: false }));
  toast('وقفت مشاركة الموقع');
}

export function statusOf(tripId: ID, today?: string) {
  const t = db().trips.find((x) => x.id === tripId);
  return t ? tripStatus(t, today) : 'draft';
}

export const store = useStore;

/**
 * قراءة البيانات. كل hook يختار المجموعة الخام (مرجع ثابت) ويشتق منها بـ useMemo،
 * عشان zustand ما يعيد الرسم بلا داعي.
 */
import { useMemo } from 'react';

import { addDays, fromISO, toISO, todayISO } from '../lib/format';
import { membersOf, tripStatus } from '../lib/logic';
import { ME } from './seed';
import { useStore } from './store';
import type { Collection, Db, ID } from './types';

export function useCol<C extends Collection>(c: C): Db[C] {
  const list = useStore((s) => s.db[c]);
  return useMemo(() => (list as Db[C][number][]).filter((x) => !x.deleted) as Db[C], [list]);
}
export function useMap<C extends Collection>(c: C) {
  const list = useCol(c);
  return useMemo(() => new Map((list as Db[C][number][]).map((x) => [x.id, x])), [list]) as Map<ID, Db[C][number]>;
}

export function useMeId(): ID {
  return useStore((s) => s.session.userId ?? ME);
}
export function useMe() {
  const id = useMeId();
  const users = useCol('users');
  return useMemo(() => users.find((u) => u.id === id) ?? users[0], [users, id]);
}
export function useUser(id?: ID | null) {
  const users = useMap('users');
  return id ? users.get(id) : undefined;
}
export function usePlace(id?: ID | null) {
  const m = useMap('places');
  return id ? m.get(id) : undefined;
}
export function useCity(id?: ID | null) {
  const m = useMap('cities');
  return id ? m.get(id) : undefined;
}
export function useTrip(id?: ID | null) {
  const m = useMap('trips');
  return id ? m.get(id) : undefined;
}

/** «اليوم» — في وضع العرض ممكن نعتبره اليوم الثاني من رحلة العلا لمعاينة وضع اليوم */
export function useToday(): string {
  const demo = useStore((s) => s.settings.demoToday);
  const trips = useStore((s) => s.db.trips);
  return useMemo(() => {
    if (demo) {
      const t = trips.find((x) => x.id === 'tr_ula');
      if (t?.startDate) return toISO(addDays(fromISO(t.startDate), 1));
    }
    return todayISO();
  }, [demo, trips]);
}
export function useNow(): Date {
  const today = useToday();
  return useMemo(() => {
    const n = new Date();
    if (today === todayISO()) return n;
    const d = fromISO(today);
    d.setHours(15, 55, 0, 0);
    return d;
  }, [today]);
}

export function useMyTrips() {
  const me = useMeId();
  const trips = useCol('trips');
  const members = useCol('members');
  const today = useToday();
  return useMemo(() => {
    const mine = new Set(members.filter((m) => m.userId === me).map((m) => m.tripId));
    return trips
      .filter((t) => mine.has(t.id))
      .map((t) => ({ trip: t, status: tripStatus(t, today) }))
      .sort((a, b) => (a.trip.startDate ?? '9999').localeCompare(b.trip.startDate ?? '9999'));
  }, [trips, members, me, today]);
}

export function useTripMembers(tripId?: ID) {
  const members = useCol('members');
  const users = useMap('users');
  return useMemo(
    () =>
      tripId
        ? membersOf(members, tripId)
            .map((m) => ({ ...m, user: users.get(m.userId)! }))
            .filter((m) => m.user)
        : [],
    [members, users, tripId],
  );
}

export function useMyRole(tripId?: ID) {
  const me = useMeId();
  const ms = useTripMembers(tripId);
  return ms.find((m) => m.userId === me)?.role;
}

export function useUnread(chatId: ID) {
  const me = useMeId();
  const messages = useCol('messages');
  const reads = useCol('reads');
  return useMemo(() => {
    const last = reads.find((r) => r.chatId === chatId && r.userId === me)?.lastReadAt ?? 0;
    return messages.filter((m) => m.chatId === chatId && m.senderId !== me && m.createdAt > last).length;
  }, [messages, reads, chatId, me]);
}

export function useUnreadTotal() {
  const me = useMeId();
  const chats = useCol('chats');
  const messages = useCol('messages');
  const reads = useCol('reads');
  return useMemo(() => {
    let n = 0;
    for (const c of chats.filter((c) => c.memberIds.includes(me))) {
      const last = reads.find((r) => r.chatId === c.id && r.userId === me)?.lastReadAt ?? 0;
      n += messages.filter((m) => m.chatId === c.id && m.senderId !== me && m.createdAt > last).length;
    }
    return n;
  }, [chats, messages, reads, me]);
}

export function useStats(userId: ID) {
  const stamps = useCol('stamps');
  const cities = useMap('cities');
  const members = useCol('members');
  const trips = useCol('trips');
  const posts = useCol('posts');
  const reviews = useCol('reviews');
  const follows = useCol('follows');
  return useMemo(() => {
    const mine = stamps.filter((s) => s.userId === userId);
    const countries = new Set(mine.map((s) => cities.get(s.cityId)?.countryCode).filter(Boolean));
    const tripIds = new Set(members.filter((m) => m.userId === userId).map((m) => m.tripId));
    return {
      stamps: mine.sort((a, b) => b.date.localeCompare(a.date)),
      countries: countries.size,
      cities: new Set(mine.map((s) => s.cityId)).size,
      trips: trips.filter((t) => tripIds.has(t.id)).length,
      posts: posts.filter((p) => p.userId === userId).length,
      reviews: reviews.filter((r) => r.userId === userId).length,
      followers: follows.filter((f) => f.followingId === userId).length,
      following: follows.filter((f) => f.followerId === userId).length,
    };
  }, [stamps, cities, members, trips, posts, reviews, follows, userId]);
}

export function useFlag(key: 'sponsored_places' | 'affiliate_booking' | 'premium') {
  const flags = useCol('flags');
  return flags.find((f) => f.key === key)?.enabled ?? false;
}

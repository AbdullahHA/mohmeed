/**
 * المخزن المحلي (offline-first). كل البيانات تنحفظ على الجوال وتشتغل بدون إنترنت،
 * ولما يكون Supabase مربوط، lib/sync.ts يرفع التعديلات ويسحب الجديد.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildSeed, ME } from './seed';
import type { Collection, Db, ID } from './types';

export type NotifPrefs = Record<'invite' | 'poll' | 'reminder' | 'message' | 'social' | 'prayer' | 'leave', boolean>;

export interface Settings {
  notif: NotifPrefs;
  hijri: boolean;
  /** فراغ خفيف في الجدول وقت الصلاة لو اليوم مزحوم */
  prayerGaps: boolean;
  /** لمعاينة «وضع اليوم» في وضع العرض: يعتبر اليوم هو اليوم الثاني من رحلة العلا */
  demoToday: boolean;
}

export interface Session {
  userId: ID | null;
  guest: boolean;
  onboarded: boolean;
  mode: 'demo' | 'cloud';
}

type Dirty = Partial<Record<Collection, ID[]>>;

interface State {
  db: Db;
  session: Session;
  settings: Settings;
  dirty: Dirty;
  lastSync: number;
  seedVersion: number;
  put: <C extends Collection>(c: C, rec: Db[C][number]) => void;
  putMany: <C extends Collection>(c: C, recs: Db[C][number][]) => void;
  patch: <C extends Collection>(c: C, id: ID, partial: Partial<Db[C][number]>) => void;
  remove: (c: Collection, id: ID) => void;
  restore: (c: Collection, id: ID) => void;
  setSession: (s: Partial<Session>) => void;
  setSettings: (s: Partial<Settings>) => void;
  /** يستبدل سجلات من السيرفر بدون ما يعلّمها dirty */
  merge: <C extends Collection>(c: C, recs: Db[C][number][]) => void;
  clearDirty: (c: Collection, ids: ID[]) => void;
  resetDemo: () => void;
  signOut: () => void;
}

const SEED_VERSION = 3;

const defaultSettings: Settings = {
  notif: { invite: true, poll: true, reminder: true, message: true, social: true, prayer: false, leave: true },
  hijri: false,
  prayerGaps: true,
  demoToday: false,
};

function markDirty(d: Dirty, c: Collection, id: ID): Dirty {
  const list = d[c] ?? [];
  return list.includes(id) ? d : { ...d, [c]: [...list, id] };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      db: buildSeed(),
      session: { userId: null, guest: false, onboarded: false, mode: 'demo' },
      settings: defaultSettings,
      dirty: {},
      lastSync: 0,
      seedVersion: SEED_VERSION,

      put: (c, rec) =>
        set((s) => {
          const r = { ...(rec as object), updatedAt: Date.now() } as Db[typeof c][number];
          const list = s.db[c] as Db[typeof c][number][];
          const idx = list.findIndex((x) => x.id === r.id);
          const next = idx >= 0 ? list.map((x, i) => (i === idx ? r : x)) : [...list, r];
          return { db: { ...s.db, [c]: next }, dirty: markDirty(s.dirty, c, r.id) };
        }),
      putMany: (c, recs) => recs.forEach((r) => get().put(c, r)),
      patch: (c, id, partial) =>
        set((s) => {
          const list = s.db[c] as Db[typeof c][number][];
          const next = list.map((x) => (x.id === id ? ({ ...x, ...partial, updatedAt: Date.now() } as typeof x) : x));
          return { db: { ...s.db, [c]: next }, dirty: markDirty(s.dirty, c, id) };
        }),
      remove: (c, id) => get().patch(c, id, { deleted: true } as never),
      restore: (c, id) => get().patch(c, id, { deleted: false } as never),
      setSession: (p) => set((s) => ({ session: { ...s.session, ...p } })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      merge: (c, recs) =>
        set((s) => {
          const map = new Map((s.db[c] as Db[typeof c][number][]).map((x) => [x.id, x]));
          for (const r of recs) {
            const cur = map.get(r.id);
            if (!cur || cur.updatedAt <= r.updatedAt) map.set(r.id, r);
          }
          return { db: { ...s.db, [c]: [...map.values()] } };
        }),
      clearDirty: (c, ids) => set((s) => ({ dirty: { ...s.dirty, [c]: (s.dirty[c] ?? []).filter((x) => !ids.includes(x)) } })),
      resetDemo: () => set({ db: buildSeed(), dirty: {}, seedVersion: SEED_VERSION }),
      signOut: () => set((s) => ({ session: { ...s.session, userId: null, guest: false } })),
    }),
    {
      name: 'yalla-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ db: s.db, session: s.session, settings: s.settings, dirty: s.dirty, lastSync: s.lastSync, seedVersion: s.seedVersion }),
      onRehydrateStorage: () => (state) => {
        // بيانات العرض تتجدّد مع كل نسخة جديدة من الـ seed عشان التواريخ تبقى منطقية
        if (state && state.session.mode === 'demo' && state.seedVersion !== SEED_VERSION) state.resetDemo();
        if (state) state.setSettings({ ...defaultSettings, ...state.settings, notif: { ...defaultSettings.notif, ...state.settings.notif } });
      },
    },
  ),
);

export const getState = () => useStore.getState();
export const meId = () => useStore.getState().session.userId ?? ME;

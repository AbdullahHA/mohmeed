/**
 * المزامنة مع Supabase (offline-first):
 * - كل تعديل محلي يتعلّم "dirty" وينرفع (upsert) لما يكون فيه نت.
 * - نسحب أي سجل updated_at أحدث من آخر مزامنة، والأحدث يفوز (last-write-wins).
 * - الرسائل الجديدة توصل مباشرة عبر Realtime.
 * صلاحيات القراءة والكتابة كلها في RLS (supabase/migrations).
 */
import { AppState } from 'react-native';

import { useStore } from '../data/store';
import type { Collection } from '../data/types';
import { supabase } from './supabase';

/** المجموعات اللي تتزامن، واسم الجدول في Supabase */
export const TABLES: Partial<Record<Collection, string>> = {
  users: 'profiles',
  follows: 'follows',
  cities: 'cities',
  places: 'places',
  trips: 'trips',
  members: 'trip_members',
  items: 'trip_items',
  expenses: 'trip_expenses',
  checklist: 'trip_checklist',
  docs: 'trip_documents',
  dateVotes: 'trip_date_votes',
  chats: 'chats',
  messages: 'messages',
  polls: 'polls',
  reads: 'chat_reads',
  posts: 'posts',
  reviews: 'place_reviews',
  communities: 'communities',
  reports: 'reports',
  notifications: 'notifications',
  stories: 'seasonal_stories',
  checkins: 'checkins',
  stamps: 'stamps',
  countries: 'country_info',
  saved: 'saved_places',
  wishes: 'wishes',
  shares: 'location_shares',
  flags: 'app_flags',
};
/** جداول يكتب فيها المحتوى من لوحة التحكم بس */
const READ_ONLY = new Set<Collection>(['cities', 'places', 'stories', 'countries', 'flags']);

const snake = (s: string) => s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toRow = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [snake(k), v]));
const fromRow = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [camel(k), v]));

let running = false;
export async function syncNow() {
  if (!supabase || running) return;
  const { session } = useStore.getState();
  if (session.mode !== 'cloud' || !session.userId) return;
  running = true;
  try {
    const st = useStore.getState();
    // 1) رفع التعديلات
    for (const [c, ids] of Object.entries(st.dirty) as [Collection, string[]][]) {
      const table = TABLES[c];
      if (!table || !ids?.length || READ_ONLY.has(c)) continue;
      const rows = (st.db[c] as { id: string }[]).filter((r) => ids.includes(r.id)).map((r) => toRow(r as never));
      const { error } = await supabase.from(table).upsert(rows);
      if (!error) st.clearDirty(c, ids);
      else {
        // صف صف: اللي ينجح أو ترفضه الصلاحيات (42501) ما نعيد محاولته
        for (const row of rows) {
          const r = await supabase.from(table).upsert(row);
          if (!r.error || r.error.code === '42501') st.clearDirty(c, [row.id as string]);
        }
      }
    }
    // 2) سحب الجديد
    const since = st.lastSync;
    const started = Date.now();
    for (const [c, table] of Object.entries(TABLES) as [Collection, string][]) {
      const { data, error } = await supabase.from(table).select('*').gt('updated_at', since).limit(1000);
      if (!error && data?.length) st.merge(c, data.map((r) => fromRow(r)) as never);
    }
    useStore.setState({ lastSync: started });
  } finally {
    running = false;
  }
}

/** ملف المستخدم بعد أول دخول سحابي */
export async function ensureProfile() {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  const st = useStore.getState();
  if (!st.db.users.some((u) => u.id === user.id)) {
    const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'مسافر';
    st.put('users', {
      id: user.id,
      name,
      handle: (user.email?.split('@')[0] ?? 'user') + Math.floor(Math.random() * 100),
      color: '#3b6cf0',
      bio: '',
      city: '',
      languages: ['عربي'],
      travelSince: new Date().getFullYear(),
      verified: false,
      coverScene: 'desert',
      interests: [],
      cuisines: [],
      dietary: [],
      privacyTrips: 'private',
      showHere: false,
      updatedAt: Date.now(),
    });
  }
}

/** يشغّل المزامنة كل 30 ثانية ولما يرجع التطبيق للواجهة، ويستقبل الرسائل لحظياً */
export function startSync() {
  if (!supabase) return () => {};
  void ensureProfile().then(syncNow);
  const t = setInterval(syncNow, 30000);
  const sub = AppState.addEventListener('change', (s) => s === 'active' && void syncNow());
  const ch = supabase
    .channel('messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => useStore.getState().merge('messages', [fromRow(p.new as Record<string, unknown>)] as never))
    .subscribe();
  return () => {
    clearInterval(t);
    sub.remove();
    void supabase?.removeChannel(ch);
  };
}

/** عمليات تمر عبر دوال السيرفر لأن الصلاحيات ما تسمح بالكتابة المباشرة */
export async function rpc(name: 'join_trip' | 'toggle_like' | 'join_community', args: Record<string, string>) {
  if (!supabase || useStore.getState().session.mode !== 'cloud') return;
  try {
    await supabase.rpc(name, args);
  } catch {
    /* تتزامن لاحقاً */
  }
}

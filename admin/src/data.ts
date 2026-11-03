/**
 * طبقة البيانات للوحة التحكم.
 * مع Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY): تقرأ وتكتب في القاعدة الحقيقية، والصلاحيات من RLS (is_admin).
 * بدونه: وضع عرض على بيانات التطبيق التجريبية، محفوظة في المتصفح.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { buildSeed } from '../../src/data/seed';
import type { Db } from '../../src/data/types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isDemo = !supabase;

export type Table = 'places' | 'cities' | 'seasonal_stories' | 'country_info' | 'communities' | 'reports' | 'profiles' | 'app_flags' | 'trips' | 'posts';
const LOCAL: Record<Table, keyof Db> = {
  places: 'places',
  cities: 'cities',
  seasonal_stories: 'stories',
  country_info: 'countries',
  communities: 'communities',
  reports: 'reports',
  profiles: 'users',
  app_flags: 'flags',
  trips: 'trips',
  posts: 'posts',
};

const snake = (s: string) => s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
export type Row = Record<string, unknown> & { id: string };
const toRow = (o: Row) => Object.fromEntries(Object.entries(o).map(([k, v]) => [snake(k), v]));
const fromRow = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [camel(k), v])) as Row;

const STORE = 'yalla-admin-demo';
function demoDb(): Db {
  try {
    const s = localStorage.getItem(STORE);
    if (s) return JSON.parse(s);
  } catch {
    /* */
  }
  const db = buildSeed();
  db.reports = [
    { id: 'rp1', reporterId: 'u_khalid', communityId: 'cm_land', messageId: 'ms9', userId: 'u_munira', reason: 'إزعاج أو إعلانات', status: 'open', createdAt: Date.now() - 36e5, updatedAt: Date.now() },
  ];
  return db;
}
function saveDemo(db: Db) {
  localStorage.setItem(STORE, JSON.stringify(db));
}

export async function list(t: Table): Promise<Row[]> {
  if (supabase) {
    const { data, error } = await supabase.from(t).select('*').eq('deleted', false).order('updated_at', { ascending: false }).limit(500);
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return (demoDb()[LOCAL[t]] as unknown as Row[]).filter((r) => !r.deleted);
}

export async function save(t: Table, r: Row) {
  const rec = { ...r, updatedAt: Date.now() };
  if (supabase) {
    const { error } = await supabase.from(t).upsert(toRow(rec));
    if (error) throw error;
    return;
  }
  const db = demoDb();
  const l = db[LOCAL[t]] as unknown as Row[];
  const i = l.findIndex((x) => x.id === r.id);
  if (i >= 0) l[i] = rec;
  else l.push(rec);
  saveDemo(db);
}

export async function remove(t: Table, id: string) {
  const rows = await list(t);
  const r = rows.find((x) => x.id === id);
  if (r) await save(t, { ...r, deleted: true });
}

export async function reviewCommunity(id: string, approve: boolean, reason?: string) {
  if (supabase) {
    const { error } = await supabase.rpc('review_community', { cid: id, approve, reason: reason ?? null });
    if (error) throw error;
    return;
  }
  const rows = await list('communities');
  const r = rows.find((x) => x.id === id)!;
  await save('communities', { ...r, status: approve ? 'approved' : 'rejected', rejectReason: reason ?? null });
}

export async function stats() {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_stats');
    if (error) throw error;
    return data as Record<string, number>;
  }
  const db = demoDb();
  return {
    users: db.users.length,
    trips: db.trips.filter((t) => !t.deleted).length,
    posts: db.posts.length,
    messages: db.messages.length,
    pending_communities: db.communities.filter((c) => c.status === 'pending').length,
    open_reports: db.reports.filter((r) => r.status === 'open').length,
    active_week: new Set(db.messages.filter((m) => Date.now() - m.createdAt < 7 * 864e5).map((m) => m.senderId)).size,
  };
}

export async function importGoogle(query: string, cityId: string) {
  if (!supabase) throw new Error('الاستيراد من Google يحتاج Supabase ومفتاح Google Places');
  const { data, error } = await supabase.functions.invoke('places-search', { body: { query, cityId } });
  if (error) throw error;
  return data as { imported: number };
}

export function resetDemo() {
  localStorage.removeItem(STORE);
}

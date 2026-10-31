import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env'
  );
}

// Nested/cross-site iframes (e.g. an embedded preview) can have persistent
// storage (localStorage/IndexedDB) blocked by the browser (Safari ITP and
// similar). AsyncStorage would then throw on every call, which otherwise
// breaks the whole auth client (sign up/in never resolve). Fall back to an
// in-memory store per call so auth still works for that session, just
// without surviving a reload.
const memoryStore = new Map<string, string>();
let persistentStorageBroken = false;

const resilientStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!persistentStorageBroken) {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        persistentStorageBroken = true;
      }
    }
    return memoryStore.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
    if (!persistentStorageBroken) {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        persistentStorageBroken = true;
      }
    }
  },
  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
    if (!persistentStorageBroken) {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        persistentStorageBroken = true;
      }
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: resilientStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

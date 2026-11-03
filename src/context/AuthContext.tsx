import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

// Lets the web auth tab/window close itself and hand control back to the app
// once Google redirects back with a session — a no-op on native.
WebBrowser.maybeCompleteAuthSession();

export type Profile = {
  id: string;
  name: string;
  username: string;
  emoji: string;
  color: string;
  isAdmin: boolean;
  interests: string[];
  email: string | null;
  avatarUrl: string | null;
  phone: string | null;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  birthDate: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  maritalStatus: string | null;
  bio: string | null;
};

export type ProfileUpdateFields = {
  name?: string;
  username?: string;
  emoji?: string;
  color?: string;
  avatar_url?: string | null;
  phone?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  country_of_residence?: string | null;
  marital_status?: string | null;
  bio?: string | null;
};

const GUEST_MODE_KEY = 'yalla-nsafer:guest-mode';
const profileCacheKey = (userId: string) => `yalla-nsafer:profile-cache:${userId}`;

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  guestMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateInterests: (interests: string[]) => Promise<AuthResult>;
  updateProfile: (fields: ProfileUpdateFields) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
};

export type AuthResult = { error: string | null; errorKind?: 'network' | 'auth' };

const AuthContext = createContext<AuthState | undefined>(undefined);

function mapProfileRow(row: any, email: string | null): Profile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    emoji: row.emoji,
    color: row.color,
    isAdmin: row.is_admin,
    interests: row.interests ?? [],
    email,
    avatarUrl: row.avatar_url ?? null,
    phone: row.phone ?? null,
    title: row.title ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    gender: row.gender ?? null,
    birthDate: row.birth_date ?? null,
    nationality: row.nationality ?? null,
    countryOfResidence: row.country_of_residence ?? null,
    maritalStatus: row.marital_status ?? null,
    bio: row.bio ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  const loadProfile = async (userId: string, email: string | null) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      if (data) {
        const mapped = mapProfileRow(data, email);
        setProfile(mapped);
        AsyncStorage.setItem(profileCacheKey(userId), JSON.stringify(mapped)).catch(() => {});
      }
    } catch {
      // Network/Supabase unavailable — fall back to the last cached profile so
      // the session doesn't vanish and the rest of the app (trips cache included)
      // stays reachable without internet (SPEC §22.2).
      try {
        const raw = await AsyncStorage.getItem(profileCacheKey(userId));
        if (raw) setProfile(JSON.parse(raw));
      } catch {
        // corrupt cache — leave profile as-is
      }
    }
  };

  useEffect(() => {
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(GUEST_MODE_KEY)]).then(
      ([{ data }, storedGuestMode]) => {
        setSession(data.session);
        if (data.session) loadProfile(data.session.user.id, data.session.user.email ?? null);
        else if (storedGuestMode === '1') setGuestMode(true);
        setLoading(false);
      }
    );

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setGuestMode(false);
        AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
        loadProfile(newSession.user.id, newSession.user.email ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn: AuthState['signIn'] = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null, errorKind: 'auth' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const signInWithGoogle: AuthState['signInWithGoogle'] = async () => {
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (error) return { error: error.message, errorKind: 'auth' };
      if (Platform.OS === 'web') {
        // supabase-js already navigated the browser to Google; this resolves
        // only after the user comes back, so there's nothing left to do here.
        return { error: null };
      }
      if (!data?.url) return { error: 'تعذّر بدء تسجيل الدخول', errorKind: 'auth' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return { error: null }; // user backed out — not an error to surface
        }
        return { error: 'تعذّر تسجيل الدخول بجوجل، حاول مرة ثانية', errorKind: 'auth' };
      }

      const callbackUrl = new URL(result.url.replace('#', '?'));
      const code = callbackUrl.searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        return { error: exchangeError?.message ?? null, errorKind: 'auth' };
      }
      const accessToken = callbackUrl.searchParams.get('access_token');
      const refreshToken = callbackUrl.searchParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return { error: setError?.message ?? null, errorKind: 'auth' };
      }
      return { error: 'تعذّر إكمال تسجيل الدخول بجوجل', errorKind: 'auth' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const signUp: AuthState['signUp'] = async (email, password, name, username) => {
    try {
      const { data: isAvailable, error: lookupError } = await supabase.rpc('username_available', {
        check_username: username,
      });
      if (lookupError) return { error: lookupError.message, errorKind: 'network' };
      if (isAvailable === false) return { error: 'username taken', errorKind: 'auth' };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, username } },
      });
      return { error: error?.message ?? null, errorKind: 'auth' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGuestMode(false);
    AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
  };

  const deleteAccount: AuthState['deleteAccount'] = async () => {
    if (!session) return { error: 'no session', errorKind: 'auth' };
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) return { error: error.message ?? 'network error', errorKind: 'network' };
      if (data?.error) return { error: data.error, errorKind: 'auth' };
      await supabase.auth.signOut();
      setGuestMode(false);
      AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id, session.user.email ?? null);
  };

  const updateInterests: AuthState['updateInterests'] = async (interests) => {
    if (!session) return { error: 'no session', errorKind: 'auth' };
    try {
      const { error } = await supabase.from('profiles').update({ interests }).eq('id', session.user.id);
      if (!error) await loadProfile(session.user.id, session.user.email ?? null);
      return { error: error?.message ?? null, errorKind: 'network' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const updateProfile: AuthState['updateProfile'] = async (fields) => {
    if (!session) return { error: 'no session', errorKind: 'auth' };
    try {
      if (fields.username) {
        const { data: isAvailable, error: lookupError } = await supabase.rpc('username_available', {
          check_username: fields.username,
        });
        if (lookupError) return { error: lookupError.message, errorKind: 'network' };
        if (isAvailable === false && fields.username !== profile?.username) {
          return { error: 'username taken', errorKind: 'auth' };
        }
      }
      const { error } = await supabase.from('profiles').update(fields).eq('id', session.user.id);
      if (!error) await loadProfile(session.user.id, session.user.email ?? null);
      return { error: error?.message ?? null, errorKind: 'network' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const continueAsGuest = () => {
    setGuestMode(true);
    AsyncStorage.setItem(GUEST_MODE_KEY, '1').catch(() => {});
  };

  const exitGuestMode = () => {
    setGuestMode(false);
    AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
  };

  const requestPasswordReset: AuthState['requestPasswordReset'] = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error?.message ?? null, errorKind: 'auth' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  const confirmPasswordReset: AuthState['confirmPasswordReset'] = async (email, code, newPassword) => {
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });
      if (verifyError) return { error: verifyError.message, errorKind: 'auth' };
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      return { error: updateError?.message ?? null, errorKind: 'auth' };
    } catch (e: any) {
      return { error: e?.message ?? 'network error', errorKind: 'network' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        guestMode,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateInterests,
        updateProfile,
        deleteAccount,
        continueAsGuest,
        exitGuestMode,
        requestPasswordReset,
        confirmPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

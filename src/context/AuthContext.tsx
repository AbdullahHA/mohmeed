import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  name: string;
  username: string;
  emoji: string;
  color: string;
  isAdmin: boolean;
  interests: string[];
};

const GUEST_MODE_KEY = 'yalla-nsafer:guest-mode';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  guestMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateInterests: (interests: string[]) => Promise<AuthResult>;
  updateProfile: (fields: { name?: string; username?: string; emoji?: string; color?: string }) => Promise<AuthResult>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
};

export type AuthResult = { error: string | null; errorKind?: 'network' | 'auth' };

const AuthContext = createContext<AuthState | undefined>(undefined);

function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    emoji: row.emoji,
    color: row.color,
    isAdmin: row.is_admin,
    interests: row.interests ?? [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) setProfile(mapProfileRow(data));
  };

  useEffect(() => {
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(GUEST_MODE_KEY)]).then(
      ([{ data }, storedGuestMode]) => {
        setSession(data.session);
        if (data.session) loadProfile(data.session.user.id);
        else if (storedGuestMode === '1') setGuestMode(true);
        setLoading(false);
      }
    );

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setGuestMode(false);
        AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
        loadProfile(newSession.user.id);
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

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  const updateInterests: AuthState['updateInterests'] = async (interests) => {
    if (!session) return { error: 'no session', errorKind: 'auth' };
    try {
      const { error } = await supabase.from('profiles').update({ interests }).eq('id', session.user.id);
      if (!error) await loadProfile(session.user.id);
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
      if (!error) await loadProfile(session.user.id);
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
        signOut,
        refreshProfile,
        updateInterests,
        updateProfile,
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

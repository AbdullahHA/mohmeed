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
};

const GUEST_MODE_KEY = 'yalla-nsafer:guest-mode';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  guestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    username: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    emoji: row.emoji,
    color: row.color,
    isAdmin: row.is_admin,
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
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'network error' };
    }
  };

  const signUp: AuthState['signUp'] = async (email, password, name, username) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, username } },
      });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'network error' };
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

  const continueAsGuest = () => {
    setGuestMode(true);
    AsyncStorage.setItem(GUEST_MODE_KEY, '1').catch(() => {});
  };

  const exitGuestMode = () => {
    setGuestMode(false);
    AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
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
        continueAsGuest,
        exitGuestMode,
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

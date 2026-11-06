import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  buildShareChannelName,
  encodeLocationShareMessage,
  LOCATION_SHARE_DURATIONS,
} from '../lib/locationShare';
import type { RootStackParamList } from '../navigation/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Route = RouteProp<RootStackParamList, 'LocationShare'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LocationShareScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends } = useAppState();
  const { profile } = useAuth();
  const friend = friends.find((f) => f.id === route.params.friendId);

  const [status, setStatus] = useState<'idle' | 'requesting' | 'denied' | 'sharing' | 'error'>('idle');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      if (Date.now() >= expiresAt) handleStop();
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const handleStart = async (durationMs: number) => {
    if (!profile || !friend) return;
    setStatus('requesting');
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }
    try {
      const channelName = buildShareChannelName(profile.id, friend.id);
      const channel = supabase.channel(channelName);
      channelRef.current = channel;
      await new Promise<void>((resolve) => channel.subscribe((s) => s === 'SUBSCRIBED' && resolve()));

      const until = Date.now() + durationMs;
      await supabase.from('direct_messages').insert({
        sender_id: profile.id,
        recipient_id: friend.id,
        text: encodeLocationShareMessage(channelName, until),
      });

      const broadcastPosition = (latitude: number, longitude: number) => {
        lastPositionRef.current = { latitude, longitude };
        channel.send({ type: 'broadcast', event: 'position', payload: { latitude, longitude, at: Date.now() } });
        setLastSentAt(Date.now());
      };

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 20 },
        (position) => broadcastPosition(position.coords.latitude, position.coords.longitude)
      );

      // Resend the last known position on a fixed cadence too, so a viewer
      // who opens the tracker after the sharer has stopped moving still
      // gets a fresh update instead of waiting forever for a distance-based
      // callback that may never fire again.
      resendTimerRef.current = setInterval(() => {
        if (lastPositionRef.current) broadcastPosition(lastPositionRef.current.latitude, lastPositionRef.current.longitude);
      }, 10000);

      setExpiresAt(until);
      setStatus('sharing');
    } catch {
      setStatus('error');
    }
  };

  const handleStop = () => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
    lastPositionRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setStatus('idle');
    setExpiresAt(null);
    setLastSentAt(null);
  };

  if (!friend) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>تعذّر العثور على هذا الصديق</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مشاركة الموقع</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Ionicons name="location" size={40} color={colors.primary} />
        <Text style={styles.title}>شارك موقعك الحين مع {friend.name}</Text>
        <Text style={styles.subtitle}>ما يُحفظ أي سجل لمواقعك — يوقف تلقائيًا بعد المدة اللي تحددها</Text>

        {status === 'sharing' && expiresAt ? (
          <View style={styles.activeBar}>
            <Ionicons name="radio-outline" size={16} color={colors.success} />
            <Text style={styles.activeText}>
              تشارك موقعك مع {friend.name} — ينتهي {new Date(expiresAt).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <TouchableOpacity style={styles.stopButton} activeOpacity={0.85} onPress={handleStop}>
              <Text style={styles.stopButtonText}>إيقاف</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.durationsRow}>
            {LOCATION_SHARE_DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.label}
                style={styles.durationButton}
                activeOpacity={0.85}
                disabled={status === 'requesting'}
                onPress={() => handleStart(d.ms)}
              >
                <Text style={styles.durationButtonText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {status === 'denied' ? <Text style={styles.errorText}>لازم تسمح بالوصول لموقعك عشان تشارك</Text> : null}
        {status === 'error' ? <Text style={styles.errorText}>صار خطأ، حاول مرة ثانية</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { flex: 1, alignItems: 'center', padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.sm },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 12.5, textAlign: 'center', marginBottom: spacing.lg },
  durationsRow: { flexDirection: 'row-reverse', gap: spacing.md },
  durationButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  durationButtonText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  activeBar: {
    width: '100%',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeText: { color: colors.successDark, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  stopButton: { backgroundColor: colors.red, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  stopButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.red, fontSize: 12.5, textAlign: 'center' },
});

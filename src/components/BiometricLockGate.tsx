import React, { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { authenticateWithBiometrics, getBiometricLockEnabled, isBiometricAvailable } from '../lib/biometric';

export default function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [lockEnabled, setLockEnabled] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const appStateRef = useRef(RNAppState.currentState);

  const checkLockPreference = async () => {
    const [enabled, available] = await Promise.all([getBiometricLockEnabled(), isBiometricAvailable()]);
    setLockEnabled(enabled && available);
  };

  useEffect(() => {
    checkLockPreference();
    const subscription = RNAppState.addEventListener('change', (nextState) => {
      if (appStateRef.current?.match(/active/) && nextState === 'background' && lockEnabled) {
        setUnlocked(false);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockEnabled]);

  const tryUnlock = async () => {
    setAuthenticating(true);
    const success = await authenticateWithBiometrics();
    setAuthenticating(false);
    if (success) setUnlocked(true);
  };

  useEffect(() => {
    if (lockEnabled && !unlocked) tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockEnabled]);

  if (lockEnabled === null) return null;
  if (!lockEnabled || unlocked) return <>{children}</>;

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Ionicons name="lock-closed" size={28} color={colors.primary} style={styles.lockIcon} />
      <Text style={styles.title}>يلا نسافر مقفّل</Text>
      <Text style={styles.subtitle}>افتحه ببصمة الوجه أو بصمة الإصبع</Text>
      <TouchableOpacity style={styles.unlockButton} activeOpacity={0.85} onPress={tryUnlock} disabled={authenticating}>
        <Ionicons name="finger-print" size={18} color={colors.textOnPrimary} />
        <Text style={styles.unlockText}>{authenticating ? 'جاري التحقق...' : 'فتح'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoBadge: { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  logo: { width: '100%', height: '100%' },
  lockIcon: { marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.xl },
  unlockButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  unlockText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
});

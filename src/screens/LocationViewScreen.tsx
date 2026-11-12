import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { supabase } from '../lib/supabase';
import { getMapsUrl } from '../utils/place';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'LocationView'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LocationViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends } = useAppState();
  const { channel, friendId, expiresAtMs } = route.params;
  const friend = friends.find((f) => f.id === friendId);

  const [position, setPosition] = useState<{ latitude: number; longitude: number; at: number } | null>(null);
  const [expired, setExpired] = useState(Date.now() >= expiresAtMs);

  useEffect(() => {
    const ch = supabase
      .channel(channel)
      .on('broadcast', { event: 'position' }, (payload) => {
        setPosition(payload.payload as any);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channel]);

  useEffect(() => {
    const timer = setInterval(() => setExpired(Date.now() >= expiresAtMs), 5000);
    return () => clearInterval(timer);
  }, [expiresAtMs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>موقع {friend?.name ?? ''}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        {expired ? (
          <>
            <Ionicons name="time-outline" size={40} color={colors.textFaint} />
            <Text style={styles.title}>انتهت مدة المشاركة</Text>
          </>
        ) : !position ? (
          <>
            <Ionicons name="location-outline" size={40} color={colors.primary} />
            <Text style={styles.title}>بانتظار موقع {friend?.name ?? 'صديقك'}...</Text>
          </>
        ) : (
          <>
            <Ionicons name="location" size={40} color={colors.success} />
            <Text style={styles.title}>{friend?.name} هنا الحين</Text>
            <Text style={styles.subtitle}>
              آخر تحديث: {new Date(position.at).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <TouchableOpacity
              style={styles.openMapsButton}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(getMapsUrl(position))}
            >
              <Ionicons name="navigate-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.openMapsText}>افتح في الخرائط</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.body, textAlign: 'center' },
  openMapsButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  openMapsText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

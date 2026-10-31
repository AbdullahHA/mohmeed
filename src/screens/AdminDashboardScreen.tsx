import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, loading, signOut } = useAuth();
  const { destinations, places, refresh } = useContent();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="lock-closed-outline" size={32} color={colors.textFaint} />
        <Text style={styles.notice}>هذا الحساب ما عنده صلاحية وصول للوحة التحكم.</Text>
        <TouchableOpacity style={styles.smallButton} activeOpacity={0.85} onPress={() => signOut()}>
          <Text style={styles.smallButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
        <TouchableOpacity onPress={() => signOut()} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color={colors.red} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminNotifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationTitle}>إرسال إشعار للمستخدمين</Text>
            <Text style={styles.notificationSubtitle}>اكتب عنوان ونص ويتسجل في السجل</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.textFaint} />
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>الوجهات ({destinations.length})</Text>
          <TouchableOpacity onPress={() => refresh()} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {destinations.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminEditDestination', { destinationId: d.id })}
          >
            <Image source={d.image} style={styles.thumb} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{d.name}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {d.tagline}
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>الأماكن ({places.length})</Text>
        </View>
        {places.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminEditPlace', { placeId: p.id })}
          >
            <Image source={p.image} style={styles.thumb} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {p.description}
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  notice: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  smallButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  smallButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  notificationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notificationTextWrap: { flex: 1 },
  notificationTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  notificationSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
});

import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  updated_at: string;
};

const STATUS_LABEL: Record<Ticket['status'], string> = { open: 'مفتوحة', in_progress: 'قيد المتابعة', closed: 'مغلقة' };

export default function SupportScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!session?.user.id) {
      setTickets([]);
      return;
    }
    const { data } = await supabase
      .from('support_tickets')
      .select('id,subject,status,updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    setTickets(data ?? []);
  };

  useEffect(() => {
    load();
  }, [session?.user.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدعم</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewSupportTicket')} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tickets === null ? (
          <Text style={styles.emptyText}>جاري التحميل...</Text>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textFaint} />
            <Text style={styles.emptyText}>ما عندك تذاكر دعم. تواجه مشكلة أو عندك اقتراح؟</Text>
            <TouchableOpacity style={styles.newBtn} activeOpacity={0.85} onPress={() => navigation.navigate('NewSupportTicket')}>
              <Text style={styles.newBtnText}>تواصل مع الدعم</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SupportTicket', { ticketId: t.id })}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{t.subject}</Text>
                <Text style={styles.rowSubtitle}>{STATUS_LABEL[t.status]} · {new Date(t.updated_at).toLocaleDateString('ar-SA')}</Text>
              </View>
              <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  newBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 11 },
  newBtnText: { color: colors.textOnPrimary, fontSize: 13.5, fontWeight: '700' },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
});

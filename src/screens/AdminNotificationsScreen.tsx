import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type LogEntry = {
  id: string;
  title: string;
  body: string;
  recipient_count: number;
  sent_at: string;
};

export default function AdminNotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const loadData = async () => {
    const [{ count }, { data: logRows }] = await Promise.all([
      supabase.from('push_tokens').select('id', { count: 'exact', head: true }),
      supabase
        .from('notifications_log')
        .select('id,title,body,recipient_count,sent_at')
        .order('sent_at', { ascending: false })
        .limit(10),
    ]);
    setTokenCount(count ?? 0);
    setLog(logRows ?? []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSubmit || !profile) return;
    setSending(true);
    const { error } = await supabase.from('notifications_log').insert({
      sent_by: profile.id,
      title: title.trim(),
      body: body.trim(),
      recipient_count: tokenCount ?? 0,
    });
    setSending(false);
    if (error) {
      Alert.alert('فشل الإرسال', error.message);
      return;
    }
    setTitle('');
    setBody('');
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إرسال إشعار</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noticeText}>
            هذا يسجل الإشعار فعلياً في قاعدة البيانات. التوصيل الفعلي لإشعارات الجوال (Push)
            يحتاج إعداد إضافي لاحقاً (تسجيل أجهزة المستخدمين + دالة إرسال). حالياً عدد الأجهزة
            المسجلة: <Text style={styles.noticeCount}>{tokenCount ?? '...'}</Text>
          </Text>
        </View>

        <Text style={styles.label}>العنوان</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: عرض جديد في العلا"
          placeholderTextColor={colors.textFaint}
          value={title}
          onChangeText={setTitle}
          textAlign="right"
        />

        <Text style={styles.label}>نص الإشعار</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="اكتب محتوى الإشعار هنا..."
          placeholderTextColor={colors.textFaint}
          value={body}
          onChangeText={setBody}
          multiline
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleSend}
        >
          {sending ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.submitText}>تسجيل الإشعار</Text>
          )}
        </TouchableOpacity>

        {log.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>آخر الإشعارات</Text>
            {log.map((item) => (
              <View key={item.id} style={styles.logRow}>
                <Text style={styles.logTitle}>{item.title}</Text>
                <Text style={styles.logBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.logMeta}>
                  {new Date(item.sent_at).toLocaleString('ar-SA')} · {item.recipient_count} جهاز
                </Text>
              </View>
            ))}
          </>
        ) : null}
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  noticeBox: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { flex: 1, color: colors.text, fontSize: 12, textAlign: 'right', lineHeight: 18 },
  noticeCount: { fontWeight: '800', color: colors.primary },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: spacing.xl, marginBottom: spacing.sm },
  logRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  logTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  logBody: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  logMeta: { color: colors.textFaint, fontSize: 10, textAlign: 'right', marginTop: spacing.xs },
});

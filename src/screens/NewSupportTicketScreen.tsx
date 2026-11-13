import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TicketType = 'bug' | 'account' | 'content' | 'suggestion' | 'other';

const TYPES: { value: TicketType; label: string }[] = [
  { value: 'bug', label: 'خلل تقني' },
  { value: 'account', label: 'حساب' },
  { value: 'content', label: 'محتوى' },
  { value: 'suggestion', label: 'اقتراح' },
  { value: 'other', label: 'غير ذلك' },
];

export default function NewSupportTicketScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session } = useAuth();
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<TicketType>('other');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!session?.user.id || !subject.trim() || !message.trim()) return;
    setSaving(true);
    setError(null);
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: session.user.id,
        subject: subject.trim(),
        type,
        app_version: Constants.expoConfig?.version ?? null,
        device: Platform.OS,
      })
      .select('id')
      .single();
    if (ticketError || !ticket) {
      setSaving(false);
      setError(ticketError?.message ?? 'تعذّر إرسال التذكرة');
      return;
    }
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({ ticket_id: ticket.id, author_id: session.user.id, from_admin: false, text: message.trim() });
    setSaving(false);
    if (messageError) {
      setError(messageError.message);
      return;
    }
    navigation.replace('SupportTicket', { ticketId: ticket.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تذكرة جديدة</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Text style={styles.label}>النوع</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setType(t.value)}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>العنوان</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="وصف قصير للمشكلة أو الاقتراح"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />

        <Text style={styles.label}>التفاصيل</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="اشرح لنا وش صار بالتفصيل..."
          placeholderTextColor={colors.textFaint}
          multiline
          numberOfLines={6}
          style={[styles.input, styles.textarea]}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, (!subject.trim() || !message.trim() || saving) && styles.submitBtnDisabled]}
          activeOpacity={0.85}
          disabled={!subject.trim() || !message.trim() || saving}
          onPress={submit}
        >
          <Text style={styles.submitBtnText}>{saving ? 'جاري الإرسال...' : 'إرسال'}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { color: colors.textMuted, fontSize: fontSize.base, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.md, textAlign: 'right' },
  typeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { color: colors.textMuted, fontSize: fontSize.body, fontWeight: '700' },
  typeChipTextActive: { color: colors.textOnPrimary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: fontSize.bodyLg,
    color: colors.text,
    textAlign: 'right',
  },
  textarea: { height: 130, textAlignVertical: 'top', paddingTop: 11 },
  error: { color: colors.red, fontSize: fontSize.body, marginTop: spacing.sm, textAlign: 'right' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.textOnPrimary, fontSize: fontSize.bodyLg, fontWeight: '700' },
});

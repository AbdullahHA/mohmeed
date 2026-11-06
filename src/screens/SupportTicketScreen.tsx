import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SupportTicket'>;

type Ticket = { id: string; subject: string; status: 'open' | 'in_progress' | 'closed'; satisfaction: number | null };
type Message = { id: string; from_admin: boolean; text: string; created_at: string };

const STATUS_LABEL: Record<Ticket['status'], string> = { open: 'مفتوحة', in_progress: 'قيد المتابعة', closed: 'مغلقة' };

export default function SupportTicketScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  const load = async () => {
    const { data: t } = await supabase
      .from('support_tickets')
      .select('id,subject,status,satisfaction')
      .eq('id', route.params.ticketId)
      .single();
    setTicket(t ?? null);
    const { data: m } = await supabase
      .from('support_messages')
      .select('id,from_admin,text,created_at')
      .eq('ticket_id', route.params.ticketId)
      .order('created_at', { ascending: true });
    setMessages(m ?? []);
  };

  useEffect(() => {
    load();
  }, [route.params.ticketId]);

  const sendReply = async () => {
    if (!session?.user.id || !reply.trim()) return;
    setSending(true);
    await supabase
      .from('support_messages')
      .insert({ ticket_id: route.params.ticketId, author_id: session.user.id, from_admin: false, text: reply.trim() });
    setReply('');
    setSending(false);
    load();
  };

  const submitRating = async (value: number) => {
    setRating(value);
    await supabase.from('support_tickets').update({ satisfaction: value }).eq('id', route.params.ticketId);
  };

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>جاري التحميل...</Text>
      </SafeAreaView>
    );
  }

  const showRating = ticket.status === 'closed' && ticket.satisfaction == null && rating == null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
        <View style={{ width: 20 }} />
      </View>
      <Text style={styles.statusLine}>{STATUS_LABEL[ticket.status]}</Text>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubble, m.from_admin ? styles.bubbleAdmin : styles.bubbleUser]}>
              <Text style={[styles.bubbleText, m.from_admin && { color: colors.text }]}>{m.text}</Text>
              <Text style={[styles.bubbleTime, m.from_admin && { color: colors.textMuted }]}>
                {new Date(m.created_at).toLocaleString('ar-SA')}
              </Text>
            </View>
          ))}

          {showRating ? (
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>قيّم تجربتك مع الدعم</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => submitRating(n)} hitSlop={6}>
                    <Ionicons name="star" size={26} color={colors.accentDark} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          {ticket.status === 'closed' && (ticket.satisfaction != null || rating != null) ? (
            <Text style={styles.thanksText}>شكرًا لتقييمك!</Text>
          ) : null}
        </ScrollView>

        {ticket.status !== 'closed' ? (
          <View style={styles.replyRow}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="اكتب ردّك..."
              placeholderTextColor={colors.textFaint}
              style={styles.replyInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!reply.trim() || sending) && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={!reply.trim() || sending}
              onPress={sendReply}
            >
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  statusLine: { color: colors.textMuted, fontSize: 11.5, textAlign: 'center', paddingVertical: spacing.sm },
  body: { padding: spacing.lg, gap: spacing.sm },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, padding: 10 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleAdmin: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt },
  bubbleText: { color: colors.textOnPrimary, fontSize: 13.5, textAlign: 'right' },
  bubbleTime: { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  ratingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  ratingTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
  ratingStars: { flexDirection: 'row-reverse', gap: spacing.sm },
  thanksText: { color: colors.textMuted, fontSize: 12.5, textAlign: 'center', marginTop: spacing.md },
  replyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.text,
    textAlign: 'right',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

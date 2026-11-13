import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import PersonAvatar from './PersonAvatar';

type Comment = {
  id: string;
  text: string;
  createdAt: number;
  user?: { id: string; name: string; avatarUrl?: string | null };
};

function mapRow(row: any): Comment {
  return {
    id: row.id,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
    user: row.user ? { id: row.user.id, name: row.user.name, avatarUrl: row.user.avatar_url ?? null } : undefined,
  };
}

function timeAgo(ts: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ${diffHr === 1 ? 'ساعة' : 'ساعات'}`;
  const diffDay = Math.round(diffHr / 24);
  return `قبل ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`;
}

type Props = {
  visible: boolean;
  checkInId: string | null;
  meId: string;
  onClose: () => void;
};

export default function CheckInCommentsSheet({ visible, checkInId, meId, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible || !checkInId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from('check_in_comments')
      .select('id,text,created_at,user:profiles!check_in_comments_user_id_fkey(id,name,avatar_url)')
      .eq('check_in_id', checkInId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setComments((data ?? []).map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`check-in-comments-${checkInId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_in_comments', filter: `check_in_id=eq.${checkInId}` },
        (payload) => {
          const newId = (payload.new as any).id;
          supabase
            .from('check_in_comments')
            .select('id,text,created_at,user:profiles!check_in_comments_user_id_fkey(id,name,avatar_url)')
            .eq('id', newId)
            .single()
            .then(({ data }) => {
              if (!data) return;
              setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, mapRow(data)]));
            });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [visible, checkInId]);

  const send = async () => {
    const text = input.trim();
    if (!text || !checkInId || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from('check_in_comments')
      .insert({ check_in_id: checkInId, user_id: meId, text })
      .select('id,text,created_at,user:profiles!check_in_comments_user_id_fkey(id,name,avatar_url)')
      .single();
    setSending(false);
    if (!error && data) {
      setInput('');
      setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, mapRow(data)]));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>التعليقات</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : comments.length === 0 ? (
            <Text style={styles.empty}>ولا تعليق بعد — كن أول وحد يعلّق</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <PersonAvatar avatarUrl={item.user?.avatarUrl} size={32} />
                  <View style={styles.commentTextWrap}>
                    <Text style={styles.commentName}>{item.user?.name ?? 'مستخدم'}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending} activeOpacity={0.8}>
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="اكتب تعليق..."
              placeholderTextColor={colors.textFaint}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              textAlign="right"
            />
          </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    maxHeight: '75%',
  },
  title: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right', marginBottom: spacing.md },
  empty: { color: colors.textFaint, fontSize: fontSize.body, textAlign: 'center', paddingVertical: spacing.xl },
  list: { maxHeight: 320, marginBottom: spacing.md },
  commentRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  commentTextWrap: { flex: 1 },
  commentName: { color: colors.text, fontSize: fontSize.body, fontWeight: '700', textAlign: 'right' },
  commentText: { color: colors.text, fontSize: fontSize.bodyLg, textAlign: 'right', marginTop: 2, lineHeight: 19 },
  commentTime: { color: colors.textFaint, fontSize: fontSize.small, textAlign: 'right', marginTop: 2 },
  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PersonAvatar from '../components/PersonAvatar';
import { parseLocationShareMessage } from '../lib/locationShare';
import type { DirectMessage } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'FriendChat'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function mapRow(row: any): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    text: row.text,
    at: new Date(row.created_at).getTime(),
  };
}

export default function FriendChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends } = useAppState();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const meId = profile?.id;
  const friendId = route.params.friendId;
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const friend = friends.find((f) => f.id === friendId);

  useEffect(() => {
    if (!meId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${meId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${meId})`
        )
        .order('created_at', { ascending: true });
      if (!cancelled) {
        setMessages((data ?? []).map(mapRow));
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`dm-${meId}-${friendId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${meId}` },
        (payload) => {
          const row = mapRow(payload.new);
          if (row.senderId !== friendId) return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [meId, friendId]);

  const send = async () => {
    const text = input.trim();
    if (!text || !meId || sending) return;
    setInput('');
    setSending(true);
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: meId, recipient_id: friendId, text })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setMessages((prev) => [...prev, mapRow(data)]);
    }
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
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{friend.name}</Text>
          <Text style={styles.headerSubtitle}>@{friend.username}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('LocationShare', { friendId })}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <Ionicons name="location-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <PersonAvatar avatarUrl={friend.avatarUrl} size={36} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <FlatList
            ref={listRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>ابدأ المحادثة مع {friend.name}</Text>
            }
            renderItem={({ item }) => {
              const share = parseLocationShareMessage(item.text);
              if (share) {
                const expired = Date.now() >= share.expiresAtMs;
                return (
                  <TouchableOpacity
                    style={[styles.shareBubble, item.senderId === meId ? styles.bubbleMe : styles.bubbleOther]}
                    activeOpacity={0.85}
                    disabled={expired}
                    onPress={() =>
                      navigation.navigate('LocationView', {
                        channel: share.channel,
                        friendId,
                        expiresAtMs: share.expiresAtMs,
                      })
                    }
                  >
                    <Ionicons name="location" size={16} color={item.senderId === meId ? colors.textOnPrimary : colors.primary} />
                    <Text style={[styles.bubbleText, item.senderId === meId && styles.bubbleTextMe]}>
                      {expired ? 'انتهت مشاركة الموقع' : item.senderId === meId ? 'تشارك موقعك' : 'شارك موقعه معك — اضغط للتتبع'}
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <View style={[styles.bubble, item.senderId === meId ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, item.senderId === meId && styles.bubbleTextMe]}>{item.text}</Text>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8} disabled={sending}>
            <Ionicons name="send" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.textFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  loading: { marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTextWrap: { flex: 1, marginHorizontal: spacing.md, alignItems: 'flex-end' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  shareBubble: {
    maxWidth: '80%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-end' },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-start' },
  bubbleText: { color: colors.text, fontSize: 14, textAlign: 'right', lineHeight: 20 },
  bubbleTextMe: { color: colors.textOnPrimary },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
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

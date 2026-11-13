import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { supabase } from '../lib/supabase';
import ReportSheet from '../components/ReportSheet';
import type { CommunityMessage } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CommunityChat'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function mapRow(row: any, names: Record<string, string>): CommunityMessage {
  return {
    id: row.id,
    communityId: row.community_id,
    fromId: row.from_id,
    fromName: names[row.from_id] ?? 'عضو',
    text: row.text,
    at: new Date(row.at).getTime(),
  };
}

export default function CommunityChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { communities, joinCommunity, leaveCommunity, reportCommunityMessage, reportCommunityMember } = useAppState();
  const { profile } = useAuth();
  const meId = profile?.id;
  const { requireAccount } = useRequireAccount();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ kind: 'message' | 'member'; id: string; label: string } | null>(null);
  const namesRef = useRef<Record<string, string>>({});

  const community = communities.find((c) => c.id === route.params.communityId);

  useEffect(() => {
    if (!community) return;
    let cancelled = false;

    (async () => {
      const { data: memberRows } = await supabase
        .from('community_members')
        .select('profile_id, profiles(id,name)')
        .eq('community_id', community.id);
      if (cancelled) return;
      const names: Record<string, string> = {};
      const memberList: { id: string; name: string }[] = [];
      (memberRows ?? []).forEach((m: any) => {
        const name = m.profiles?.name ?? 'عضو';
        names[m.profile_id] = name;
        memberList.push({ id: m.profile_id, name });
      });
      namesRef.current = names;
      setMemberNames(names);
      setMembers(memberList);

      const { data: msgRows } = await supabase
        .from('community_messages')
        .select('*')
        .eq('community_id', community.id)
        .order('at', { ascending: true });
      if (cancelled) return;
      setMessages((msgRows ?? []).map((r: any) => mapRow(r, names)));
    })();

    const channel = supabase
      .channel(`community-chat-${community.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `community_id=eq.${community.id}` },
        (payload) => {
          const row = mapRow(payload.new, namesRef.current);
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [community?.id]);

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المجتمع</Text>
      </SafeAreaView>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || !meId || sending) return;
    setInput('');
    setSending(true);
    const { data, error } = await supabase
      .from('community_messages')
      .insert({ community_id: community.id, from_id: meId, text })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, mapRow(data, namesRef.current)]));
    }
  };

  const submitReport = async (reason: string) => {
    if (!reportTarget) return;
    if (reportTarget.kind === 'message') {
      await reportCommunityMessage(community.id, reportTarget.id, reason);
    } else {
      await reportCommunityMember(community.id, reportTarget.id, reason);
    }
    setReportTarget(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: community.color }]}>
          <Text style={styles.headerEmoji}>{community.emoji}</Text>
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{community.name}</Text>
          <Text style={styles.headerSubtitle}>{community.memberCount.toLocaleString()} عضو</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuOpen(true)} activeOpacity={0.8} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.taglineRow}>
        <Text style={styles.tagline}>{community.tagline}</Text>
        <TouchableOpacity
          style={[styles.joinButton, community.joined && styles.joinedButton]}
          activeOpacity={0.85}
          onPress={() =>
            community.joined ? leaveCommunity(community.id) : requireAccount('chat', () => joinCommunity(community.id))
          }
        >
          <Text style={[styles.joinButtonText, community.joined && styles.joinedButtonText]}>
            {community.joined ? (community.myRole === 'moderator' ? 'مشرف ✓' : 'عضو ✓') : 'انضم'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>كن أول من يبدأ النقاش بهذا المجتمع</Text>}
          renderItem={({ item }) => {
            const isMe = item.fromId === meId;
            return (
              <Pressable
                style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                onLongPress={() =>
                  requireAccount('chat', () =>
                    setReportTarget({ kind: 'message', id: item.id, label: `بلاغ عن رسالة ${item.fromName}` })
                  )
                }
              >
                {!isMe ? <Text style={styles.senderName}>{item.fromName}</Text> : null}
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
              </Pressable>
            );
          }}
        />

        {community.joined ? (
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8} disabled={sending}>
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="شارك سؤالك أو تجربتك..."
              placeholderTextColor={colors.textFaint}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              textAlign="right"
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinToPostBar}
            activeOpacity={0.85}
            onPress={() => requireAccount('chat', () => joinCommunity(community.id))}
          >
            <Text style={styles.joinToPostText}>انضم للمجتمع عشان تقدر تشارك</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>إبلاغ عن عضو</Text>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>ما فيه أعضاء بعد</Text>
            ) : (
              members
                .filter((m) => m.id !== meId)
                .map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.memberRow}
                    onPress={() => {
                      setMenuOpen(false);
                      requireAccount('chat', () =>
                        setReportTarget({ kind: 'member', id: m.id, label: `بلاغ عن ${m.name}` })
                      );
                    }}
                  >
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Ionicons name="flag-outline" size={16} color={colors.red} />
                  </TouchableOpacity>
                ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ReportSheet
        visible={!!reportTarget}
        title={reportTarget?.label ?? ''}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerTextWrap: { flex: 1, marginHorizontal: spacing.sm, alignItems: 'flex-end' },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  headerSubtitle: { color: colors.textMuted, fontSize: fontSize.small, marginTop: 2 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: fontSize.subtitle },
  taglineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagline: { color: colors.textMuted, fontSize: fontSize.base, flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  joinedButton: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinButtonText: { color: colors.textOnPrimary, fontSize: fontSize.base, fontWeight: '700' },
  joinedButtonText: { color: colors.primaryDark },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  senderName: { color: colors.primary, fontSize: fontSize.small, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  bubbleText: { color: colors.text, fontSize: fontSize.bodyLg, textAlign: 'right', lineHeight: 20 },
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
  joinToPostBar: {
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  joinToPostText: { color: colors.primaryDark, fontSize: fontSize.body, fontWeight: '700' },
  menuBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    maxHeight: '60%',
  },
  menuTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'center', marginBottom: spacing.lg },
  memberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: { color: colors.text, fontSize: fontSize.body, fontWeight: '600' },
});

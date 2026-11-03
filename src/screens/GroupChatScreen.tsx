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
import type { TripMessage } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'GroupChat'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function mapRow(row: any): TripMessage {
  return {
    id: row.id,
    tripId: row.trip_id,
    fromId: row.from_id,
    text: row.text,
    at: new Date(row.at).getTime(),
  };
}

export default function GroupChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips } = useAppState();
  const { profile } = useAuth();
  const meId = profile?.id;
  const tripId = route.params.tripId;

  const trip = trips.find((t) => t.id === tripId);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<TripMessage>>(null);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: msgRows }, { data: memberRows }] = await Promise.all([
        supabase.from('trip_messages').select('*').eq('trip_id', tripId).order('at', { ascending: true }),
        supabase.from('profiles').select('id,name').in('id', trip.memberIds),
      ]);
      if (cancelled) return;
      setMessages((msgRows ?? []).map(mapRow));
      const names: Record<string, string> = {};
      (memberRows ?? []).forEach((r: any) => {
        names[r.id] = r.name;
      });
      setMemberNames(names);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const row = mapRow(payload.new);
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tripId, trip?.memberIds.join(',')]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المحادثة</Text>
      </SafeAreaView>
    );
  }

  const senderName = (fromId: string) => (fromId === meId ? 'أنت' : memberNames[fromId] ?? 'عضو');

  const send = async () => {
    const text = input.trim();
    if (!text || !meId || sending) return;
    setInput('');
    setSending(true);
    const { data, error } = await supabase
      .from('trip_messages')
      .insert({ trip_id: tripId, from_id: meId, text })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, mapRow(data)]));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{trip.title}</Text>
          <Text style={styles.headerSubtitle}>{trip.memberIds.length} أعضاء</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })} activeOpacity={0.8}>
          <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.emptyText}>ابدأ الحديث عن خطة رحلتكم مع {trip.destination}</Text>
            }
            renderItem={({ item }) => {
              const mine = item.fromId === meId;
              return (
                <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleOther]}>
                  {!mine ? <Text style={styles.senderName}>{senderName(item.fromId)}</Text> : null}
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMe]}>{item.text}</Text>
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
            placeholder="اكتب اقتراحك للمجموعة..."
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-end' },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-start' },
  senderName: { color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
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

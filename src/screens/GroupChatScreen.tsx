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
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import { supabase } from '../lib/supabase';
import LogExpenseSheet from '../components/LogExpenseSheet';
import CreatePollSheet from '../components/CreatePollSheet';
import PollMessageCard from '../components/PollMessageCard';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory, type ItinerarySlot, type TripMessage } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatIsoDate } from '../components/DayPicker';
import {
  encodeImageMessage,
  encodePollMessage,
  parseImageMessage,
  parsePollMessage,
  pickAndUploadChatImage,
  signChatImagePaths,
} from '../lib/tripChatMedia';

type Route = RouteProp<RootStackParamList, 'GroupChat'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function daysUntil(isoDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / 86400000);
}

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
  const { trips, addBudgetItem } = useAppState();
  const { profile } = useAuth();
  const { currency } = useRegion();
  const meId = profile?.id;
  const tripId = route.params.tripId;

  const trip = trips.find((t) => t.id === tripId);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [pollSheetVisible, setPollSheetVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const paths = messages
      .map((m) => parseImageMessage(m.text)?.path)
      .filter((p): p is string => !!p && !imageUrls[p]);
    if (paths.length === 0) return;
    let cancelled = false;
    signChatImagePaths(paths).then((map) => {
      if (!cancelled) setImageUrls((prev) => ({ ...prev, ...map }));
    });
    return () => {
      cancelled = true;
    };
  }, [messages]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المحادثة</Text>
      </SafeAreaView>
    );
  }

  const senderName = (fromId: string) => (fromId === meId ? 'أنت' : memberNames[fromId] ?? 'عضو');

  const otherMemberNames = trip.memberIds
    .filter((id) => id !== meId)
    .map((id) => memberNames[id])
    .filter((name): name is string => !!name)
    .slice(0, 2);
  const countdown = daysUntil(trip.startDate);
  const headerSubtitle = [
    ['أنت', ...otherMemberNames].join('، '),
    countdown !== null ? (countdown > 0 ? `بعد ${countdown} ${countdown === 1 ? 'يوم' : 'أيام'}` : countdown === 0 ? 'تبدأ اليوم' : null) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const SLOT_ORDER: ItinerarySlot[] = ['breakfast', 'morning', 'lunch', 'afternoon', 'dinner', 'evening'];
  const todayIso = formatIsoDate(new Date());
  const pinnedDayIso =
    trip.itinerary.some((i) => i.itemDate === todayIso)
      ? todayIso
      : trip.itinerary
          .map((i) => i.itemDate)
          .filter((d): d is string => !!d && d >= todayIso)
          .sort()[0] ?? null;
  const pinnedDayItems = pinnedDayIso
    ? trip.itinerary
        .filter((i) => i.itemDate === pinnedDayIso)
        .sort((a, b) => {
          const sa = a.slot ? SLOT_ORDER.indexOf(a.slot) : 99;
          const sb = b.slot ? SLOT_ORDER.indexOf(b.slot) : 99;
          return sa - sb;
        })
    : [];
  const pinnedDayLabel = pinnedDayIso ? WEEKDAY_AR[new Date(`${pinnedDayIso}T00:00:00`).getDay()] : null;

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

  const sendImage = async () => {
    if (!meId || uploadingImage) return;
    setUploadingImage(true);
    try {
      const path = await pickAndUploadChatImage(tripId, meId);
      if (!path) return;
      const { data, error } = await supabase
        .from('trip_messages')
        .insert({ trip_id: tripId, from_id: meId, text: encodeImageMessage(path) })
        .select()
        .single();
      if (!error && data) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, mapRow(data)]));
      }
    } catch {
      Alert.alert('تعذّر إرسال الصورة', 'حاول مرة ثانية.');
    } finally {
      setUploadingImage(false);
    }
  };

  const sendPoll = async (question: string, options: string[], allowMultiple: boolean) => {
    if (!meId) return;
    setPollSheetVisible(false);
    const { data: pollRow, error: pollError } = await supabase
      .from('trip_message_polls')
      .insert({ trip_id: tripId, created_by: meId, question, options, allow_multiple: allowMultiple })
      .select()
      .single();
    if (pollError || !pollRow) return;
    const { data, error } = await supabase
      .from('trip_messages')
      .insert({ trip_id: tripId, from_id: meId, text: encodePollMessage(pollRow.id) })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, mapRow(data)]));
    }
  };

  const handleLogExpense = async (category: BudgetCategory, label: string, amount: number) => {
    if (!meId || !trip) return;
    setExpenseSheetVisible(false);
    await addBudgetItem(trip.id, {
      category,
      label,
      amount,
      paidBy: meId,
      splitBetween: trip.memberIds,
    });
    await supabase.from('trip_messages').insert({
      trip_id: tripId,
      from_id: meId,
      text: `سجّل مصروف: ${label} — ${amount} ${currency.symbol} (${BUDGET_CATEGORY_LABELS[category]})`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setExpenseSheetVisible(true)} activeOpacity={0.8} hitSlop={8}>
          <Ionicons name="wallet-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTextWrap}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{trip.title}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{headerSubtitle || `${trip.memberIds.length} أعضاء`}</Text>
        </TouchableOpacity>
      </View>

      {pinnedDayIso && pinnedDayItems.length > 0 ? (
        <TouchableOpacity
          style={styles.pinnedBar}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
        >
          <Ionicons name="chevron-back" size={14} color={colors.textMuted} />
          <Text style={styles.pinnedBarText} numberOfLines={1}>
            <Text style={styles.pinnedBarDay}>{pinnedDayLabel}: </Text>
            {pinnedDayItems.map((i) => i.title).join('  ←  ')}
          </Text>
          <Ionicons name="pin" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

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
              const pollRef = parsePollMessage(item.text);
              if (pollRef) {
                return (
                  <View style={styles.pollWrap}>
                    <Text style={styles.senderName}>{senderName(item.fromId)}</Text>
                    <PollMessageCard pollId={pollRef.pollId} meId={meId ?? ''} />
                  </View>
                );
              }
              const imageRef = parseImageMessage(item.text);
              if (imageRef) {
                const url = imageUrls[imageRef.path];
                return (
                  <View style={[styles.imageBubbleWrap, mine && styles.imageBubbleWrapMine]}>
                    {!mine ? <Text style={styles.senderName}>{senderName(item.fromId)}</Text> : null}
                    {url ? (
                      <Image source={{ uri: url }} style={styles.chatImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.chatImagePlaceholder}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    )}
                  </View>
                );
              }
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
          <TouchableOpacity style={styles.attachButton} onPress={() => setPollSheetVisible(true)} activeOpacity={0.8} hitSlop={6}>
            <Ionicons name="bar-chart-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton} onPress={sendImage} activeOpacity={0.8} disabled={uploadingImage} hitSlop={6}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <LogExpenseSheet
        visible={expenseSheetVisible}
        onClose={() => setExpenseSheetVisible(false)}
        onSubmit={handleLogExpense}
      />
      <CreatePollSheet
        visible={pollSheetVisible}
        onClose={() => setPollSheetVisible(false)}
        onSubmit={sendPoll}
      />
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
  pinnedBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pinnedBarDay: { color: colors.text, fontWeight: '700' },
  pinnedBarText: { flex: 1, color: colors.primaryDark, fontSize: 12.5, textAlign: 'right' },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  senderName: { color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  bubbleText: { color: colors.text, fontSize: 14, textAlign: 'right', lineHeight: 20 },
  bubbleTextMe: { color: colors.textOnPrimary },
  pollWrap: { alignItems: 'flex-start', marginBottom: spacing.sm },
  imageBubbleWrap: { alignSelf: 'flex-start', marginBottom: spacing.sm, maxWidth: '70%' },
  imageBubbleWrapMine: { alignSelf: 'flex-end' },
  chatImage: { width: 200, height: 200, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  chatImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

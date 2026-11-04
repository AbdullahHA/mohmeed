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
  Animated,
  Easing,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { tripDateRange, formatIsoDate } from '../components/DayPicker';
import type { RootStackParamList } from '../navigation/types';
import type { ChatMessage, ItineraryItem, Trip } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS: Array<{ text: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { text: 'رتب لي خطة ليوم كامل في الرياض', icon: 'location-outline' },
  { text: 'اقترح لي مطعم لعشاء الليلة', icon: 'restaurant-outline' },
  { text: 'خطط لي رحلة عائلية', icon: 'airplane-outline' },
  { text: 'وش أفضل وجهة أزورها بنوفمبر؟', icon: 'calendar-outline' },
];

const FOLLOWUP_SUGGESTIONS = ['أرخص؟', 'أماكن للعوائل', 'وش غير كذا؟', 'اقترح مطاعم بس'];

export default function GuideChatScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { guideMessages, guideThinking, sendGuideMessage, resetGuideConversation, trips, addItineraryItem } = useAppState();
  const { profile } = useAuth();
  const [input, setInput] = useState('');
  const [shareMessage, setShareMessage] = useState<ChatMessage | null>(null);
  const [convertMessage, setConvertMessage] = useState<ChatMessage | null>(null);
  const pulse = useRef(new Animated.Value(0.4)).current;

  const hasConversation = guideMessages.length > 1;
  const lastGuideMessage = useMemo(() => {
    for (let i = guideMessages.length - 1; i >= 0; i -= 1) {
      if (guideMessages[i].fromId !== 'me') return guideMessages[i];
    }
    return null;
  }, [guideMessages]);

  const handleResetConversation = () => {
    if (!hasConversation) return;
    Alert.alert('محادثة جديدة؟', 'بيُمسح سجل هذه المحادثة وتبدأ من جديد.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'محادثة جديدة', style: 'destructive', onPress: resetGuideConversation },
    ]);
  };

  useEffect(() => {
    if (!guideThinking) {
      pulse.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [guideThinking, pulse]);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    sendGuideMessage(value);
    setInput('');
  };

  return (
    <View style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleResetConversation} activeOpacity={0.8} hitSlop={8} style={styles.headerIconButton}>
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>دليل السفر</Text>
            <Text style={styles.headerSubtitle}>يعرف اهتماماتك وميزانيتك</Text>
          </View>
          <View style={styles.headerAvatar}>
            <Ionicons name="compass" size={20} color="#FFFFFF" />
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={8} style={styles.headerIconButton}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {guideThinking && !hasConversation ? (
          <View style={styles.emptyState}>
            <Animated.View style={[styles.orb, { opacity: pulse }]}>
              <Ionicons name="compass" size={28} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.emptyTitle}>جار البحث عن أفضل الاقتراحات...</Text>
          </View>
        ) : hasConversation ? (
          <FlatList
            data={[...guideMessages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              guideThinking ? (
                <View style={styles.typingRow}>
                  <Animated.View style={{ opacity: pulse }}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                  </Animated.View>
                </View>
              ) : undefined
            }
            renderItem={({ item }) =>
              item.fromId === 'me' ? (
                <View style={[styles.bubble, styles.bubbleMe]}>
                  <Text style={styles.bubbleTextMe}>{item.text}</Text>
                </View>
              ) : (
                <View style={styles.guideRow}>
                  <View style={styles.guideContentWrap}>
                    <Text style={styles.guideText}>{item.planDays?.length ? item.text.split('\n\n')[0] : item.text}</Text>
                    {item.planDays?.length ? (
                      <View style={styles.dayCardsWrap}>
                        {item.planDays.map((day, i) => (
                          <View key={i} style={styles.dayCard}>
                            <Text style={styles.dayCardLabel}>{day.label}</Text>
                            {day.activities.map((act, j) => (
                              <View key={j} style={styles.dayCardActivityRow}>
                                <Text style={styles.dayCardBullet}>•</Text>
                                <Text style={styles.dayCardActivity}>{act}</Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.guideAvatar}>
                    <Ionicons name="compass" size={14} color="#FFFFFF" />
                  </View>
                </View>
              )
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.orb}>
              <Ionicons name="compass" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyTitle}>عن ماذا تبحث؟</Text>
            <Text style={styles.emptySubtitle}>
              اسأل بأسلوبك الخاص — بساعدك بالفعاليات، أخطط لرحلاتك، وأجاوبك على أسئلتك
            </Text>
            <View style={styles.suggestionsGrid}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.text}
                  style={styles.suggestionCard}
                  activeOpacity={0.8}
                  onPress={() => send(s.text)}
                >
                  <Text style={styles.suggestionText}>{s.text}</Text>
                  <Ionicons name={s.icon} size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {hasConversation && !guideThinking ? (
          <View style={styles.actionsStrip}>
            {lastGuideMessage && profile?.id ? (
              <View style={styles.chipRow}>
                {lastGuideMessage.planDays?.length ? (
                  <TouchableOpacity
                    style={styles.convertChip}
                    activeOpacity={0.8}
                    onPress={() => setConvertMessage(lastGuideMessage)}
                  >
                    <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.convertChipText}>حوّلها لرحلة</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.shareChip}
                  activeOpacity={0.8}
                  onPress={() => setShareMessage(lastGuideMessage)}
                >
                  <Ionicons name="people-outline" size={14} color={colors.primary} />
                  <Text style={styles.shareChipText}>شاركها مع الشلة</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.followupRow}>
              {FOLLOWUP_SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.followupChip} activeOpacity={0.8} onPress={() => send(s)}>
                  <Text style={styles.followupText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.sendButton} onPress={() => send()} activeOpacity={0.8}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اسأل الدليل..."
            placeholderTextColor={colors.textFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            textAlign="right"
          />
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ShareReplySheet
        visible={!!shareMessage}
        trips={trips}
        onClose={() => setShareMessage(null)}
        onShared={(tripId) => {
          setShareMessage(null);
          navigation.navigate('GroupChat', { tripId });
        }}
        message={shareMessage}
        meId={profile?.id ?? ''}
      />

      <ConvertToTripSheet
        visible={!!convertMessage}
        trips={trips}
        message={convertMessage}
        onClose={() => setConvertMessage(null)}
        onConverted={(tripId) => {
          setConvertMessage(null);
          navigation.navigate('TripDetail', { tripId });
        }}
        addItineraryItem={addItineraryItem}
      />
    </View>
  );
}

function ShareReplySheet({
  visible,
  trips,
  message,
  meId,
  onClose,
  onShared,
}: {
  visible: boolean;
  trips: Trip[];
  message: ChatMessage | null;
  meId: string;
  onClose: () => void;
  onShared: (tripId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sending, setSending] = useState(false);

  const handlePick = async (tripId: string) => {
    if (!message || !meId || sending) return;
    setSending(true);
    const { error } = await supabase.from('trip_messages').insert({
      trip_id: tripId,
      from_id: meId,
      text: `💬 من دليل السفر:\n${message.text}`,
    });
    setSending(false);
    if (error) {
      Alert.alert('ما قدرنا نشارك الرد', 'جرّب مرة ثانية.');
      return;
    }
    onShared(tripId);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>شارك الرد مع أي رحلة؟</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {trips.length === 0 ? (
              <Text style={styles.sheetEmpty}>ما عندك رحلات بعد</Text>
            ) : (
              trips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={styles.sheetRow}
                  disabled={sending}
                  onPress={() => handlePick(trip.id)}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
                  <View style={styles.sheetRowTextWrap}>
                    <Text style={styles.sheetRowTitle}>{trip.title}</Text>
                    <Text style={styles.sheetRowMeta}>{trip.destination}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ConvertToTripSheet({
  visible,
  trips,
  message,
  onClose,
  onConverted,
  addItineraryItem,
}: {
  visible: boolean;
  trips: Trip[];
  message: ChatMessage | null;
  onClose: () => void;
  onConverted: (tripId: string) => void;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id' | 'addedBy' | 'done'>) => Promise<ItineraryItem | null>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [converting, setConverting] = useState(false);

  const handlePick = async (trip: Trip) => {
    if (!message?.planDays?.length || converting) return;
    setConverting(true);
    const days = tripDateRange(trip.startDate, trip.endDate);
    for (let i = 0; i < message.planDays.length; i += 1) {
      const day = message.planDays[i];
      const itemDate = days[i] ? formatIsoDate(days[i]) : null;
      for (const activity of day.activities) {
        await addItineraryItem(trip.id, {
          day: day.label,
          time: '',
          title: activity,
          itemDate,
          slot: null,
          placeId: null,
          kind: 'place',
        });
      }
    }
    setConverting(false);
    onConverted(trip.id);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>حوّل الخطة لأي رحلة؟</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {trips.length === 0 ? (
              <Text style={styles.sheetEmpty}>ما عندك رحلات بعد</Text>
            ) : (
              trips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={styles.sheetRow}
                  disabled={converting}
                  onPress={() => handlePick(trip)}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
                  <View style={styles.sheetRowTextWrap}>
                    <Text style={styles.sheetRowTitle}>{trip.title}</Text>
                    <Text style={styles.sheetRowMeta}>{trip.destination}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
          {converting ? <Text style={styles.sheetEmpty}>جاري الإضافة...</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerIconButton: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: { flex: 1, alignItems: 'flex-end' },
    headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: { padding: spacing.lg, gap: spacing.md },
    bubble: { maxWidth: '82%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
    bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
    bubbleTextMe: { color: '#FFFFFF', fontSize: 14, textAlign: 'right', lineHeight: 20 },
    guideRow: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    guideContentWrap: { flex: 1 },
    guideText: { color: colors.text, fontSize: 14, textAlign: 'right', lineHeight: 21 },
    dayCardsWrap: { gap: spacing.sm, marginTop: spacing.sm },
    dayCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    dayCardLabel: { color: colors.primary, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xs },
    dayCardActivityRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 3 },
    dayCardBullet: { color: colors.textFaint, fontSize: 13 },
    dayCardActivity: { flex: 1, color: colors.text, fontSize: 13, textAlign: 'right', lineHeight: 19 },
    guideAvatar: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    typingRow: { flexDirection: 'row-reverse', paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    orb: {
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    suggestionsGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: spacing.sm,
      width: '100%',
    },
    suggestionCard: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      minHeight: 76,
      justifyContent: 'space-between',
    },
    suggestionText: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right', lineHeight: 18 },
    actionsStrip: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
    chipRow: { flexDirection: 'row-reverse', alignSelf: 'flex-end', gap: spacing.sm },
    shareChip: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    shareChipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    convertChip: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    convertChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    followupRow: { flexDirection: 'row-reverse', gap: spacing.sm },
    followupChip: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    followupText: { color: colors.text, fontSize: 12, fontWeight: '600' },
    inputRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: 14,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      padding: spacing.lg,
      maxHeight: '70%',
    },
    sheetTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: spacing.md },
    sheetEmpty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.lg },
    sheetRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sheetRowTextWrap: { flex: 1 },
    sheetRowTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
    sheetRowMeta: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  });

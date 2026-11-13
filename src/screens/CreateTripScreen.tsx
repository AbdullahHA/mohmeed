import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import RtlScrollRow from '../components/RtlScrollRow';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import PersonAvatar from '../components/PersonAvatar';
import type { RootStackParamList } from '../navigation/types';
import {
  TRAVELER_TYPE_LABELS,
  TRIP_NEED_LABELS,
  type TravelerType,
  type TripNeed,
  type TripDatesMode,
} from '../types';
import type { Destination } from '../data/destinations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CreateTrip'>;

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const TRAVELER_TYPES: TravelerType[] = ['solo', 'couple', 'family', 'group'];
const NEEDS: TripNeed[] = ['kids_under_5', 'elderly', 'wheelchair'];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CreateTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends, createTrip, sendGuideMessage } = useAppState();
  const { destinations } = useContent();

  const preselectedDestinationId = route.params?.destinationId;

  // Step 1: وين؟
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState<Destination | null>(
    destinations.find((d) => d.id === preselectedDestinationId) ?? null
  );

  // Step 2: متى؟
  const [datesMode, setDatesMode] = useState<TripDatesMode | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [flexibleMonthIndex, setFlexibleMonthIndex] = useState<number | null>(null);
  const [flexibleDays, setFlexibleDays] = useState(5);

  // Step 3: مين معك؟
  const [travelerType, setTravelerType] = useState<TravelerType | null>(null);
  const [needs, setNeeds] = useState<TripNeed[]>([]);
  const [showInviteList, setShowInviteList] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const [suggestItinerary, setSuggestItinerary] = useState(true);
  const [creating, setCreating] = useState(false);

  const currentMonth = new Date().getMonth();
  const seasonalSuggestions = destinations.filter((d) => d.bestMonths.includes(currentMonth)).slice(0, 6);
  const searchResults = query.trim()
    ? destinations.filter(
        (d) => d.name.includes(query.trim()) || d.country.includes(query.trim())
      )
    : [];

  const toggleNeed = (need: TripNeed) => {
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const dateSummary = useMemo(() => {
    if (datesMode === 'exact' && startDate && endDate) return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    if (datesMode === 'flexible' && flexibleMonthIndex !== null) return `${MONTH_NAMES[flexibleMonthIndex]} · ${flexibleDays} أيام`;
    if (datesMode === 'vote') return 'خل الشلة تصوّت';
    return null;
  }, [datesMode, startDate, endDate, flexibleMonthIndex, flexibleDays]);

  const whoSummary = travelerType ? TRAVELER_TYPE_LABELS[travelerType] : null;

  const canSubmit = !!destination && !!datesMode && !!travelerType && !creating;

  const buildTitle = () => {
    if (!destination) return 'رحلة جديدة';
    const suffix = travelerType === 'group' ? ' مع الشلة' : travelerType === 'couple' ? ' مع شريكي' : travelerType === 'family' ? ' مع العائلة' : '';
    return `رحلة ${destination.name}${suffix}`;
  };

  const handleCreate = async () => {
    if (!canSubmit || !destination) return;
    setCreating(true);
    const trip = await createTrip({
      title: buildTitle(),
      destination: destination.name,
      coverImage: destination.image,
      startDate: datesMode === 'exact' && startDate ? formatDate(startDate) : '—',
      endDate: datesMode === 'exact' && endDate ? formatDate(endDate) : '—',
      memberIds: selectedFriendIds,
      budgetTotal: 0,
      travelerType,
      needs,
      datesMode,
      flexibleMonth: datesMode === 'flexible' && flexibleMonthIndex !== null ? MONTH_NAMES[flexibleMonthIndex] : null,
      flexibleDays: datesMode === 'flexible' ? flexibleDays : null,
    });
    setCreating(false);
    if (!trip) return;

    if (suggestItinerary) {
      sendGuideMessage(
        `خطط لي جدول مبدئي لرحلة إلى ${destination.name}` +
          (dateSummary ? ` (${dateSummary})` : '') +
          (travelerType ? ` — ${TRAVELER_TYPE_LABELS[travelerType]}` : '')
      );
      navigation.replace('GuideChat');
      return;
    }

    if (datesMode === 'vote') {
      navigation.replace('TripDatesVote', { tripId: trip.id });
      return;
    }

    navigation.replace('TripDetail', { tripId: trip.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رحلة جديدة</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.progressSegment, n <= step && styles.progressSegmentActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step 1: وين؟ */}
        <View style={styles.questionCard}>
          <TouchableOpacity
            style={styles.questionHeader}
            activeOpacity={destination ? 0.7 : 1}
            onPress={() => destination && setStep(1)}
          >
            <Text style={styles.questionTitle}>١. وين؟</Text>
            {destination ? <Ionicons name="pencil" size={15} color={colors.textMuted} /> : null}
          </TouchableOpacity>

          {destination && step !== 1 ? (
            <View style={styles.summaryChip}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.summaryChipText}>{destination.name}</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="ابحث عن مدينة أو دولة"
                placeholderTextColor={colors.textFaint}
                value={query}
                onChangeText={setQuery}
                textAlign="right"
              />
              {searchResults.length > 0 ? (
                <View style={styles.resultsList}>
                  {searchResults.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.resultRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        setDestination(d);
                        setQuery('');
                        setStep(2);
                      }}
                    >
                      <Text style={styles.resultRowText}>{d.name} · {d.country}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <>
                  <Text style={styles.subLabel}>اقتراحات حسب الموسم</Text>
                  <View style={styles.chipsWrap}>
                    {seasonalSuggestions.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={styles.chip}
                        activeOpacity={0.8}
                        onPress={() => {
                          setDestination(d);
                          setStep(2);
                        }}
                      >
                        <Text style={styles.chipText}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <TouchableOpacity
                style={styles.helpLink}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GuideChat')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
                <Text style={styles.helpLinkText}>مو متأكد، ساعدني</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Step 2: متى؟ */}
        {destination ? (
          <View style={styles.questionCard}>
            <TouchableOpacity
              style={styles.questionHeader}
              activeOpacity={datesMode ? 0.7 : 1}
              onPress={() => datesMode && setStep(2)}
            >
              <Text style={styles.questionTitle}>٢. متى؟</Text>
              {datesMode ? <Ionicons name="pencil" size={15} color={colors.textMuted} /> : null}
            </TouchableOpacity>

            {datesMode && step !== 2 ? (
              <View style={styles.summaryChip}>
                <Ionicons name="calendar" size={14} color={colors.primary} />
                <Text style={styles.summaryChipText}>{dateSummary}</Text>
              </View>
            ) : (
              <>
                <View style={styles.optionsRow}>
                  {([
                    ['exact', 'تواريخ محددة'],
                    ['flexible', 'مرن'],
                    ['vote', 'خل الشلة تصوّت'],
                  ] as const).map(([mode, label]) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.optionCard, datesMode === mode && styles.optionCardActive]}
                      activeOpacity={0.8}
                      onPress={() => setDatesMode(mode)}
                    >
                      <Text style={[styles.optionCardText, datesMode === mode && styles.optionCardTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {datesMode === 'exact' ? (
                  <View style={styles.dateRow}>
                    <View style={styles.dateField}>
                      <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setActivePicker('start')}>
                        <Text style={startDate ? styles.dateValue : styles.datePlaceholder}>
                          {startDate ? formatDate(startDate) : 'تاريخ البداية'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dateField}>
                      <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setActivePicker('end')}>
                        <Text style={endDate ? styles.dateValue : styles.datePlaceholder}>
                          {endDate ? formatDate(endDate) : 'تاريخ العودة'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {activePicker ? (
                  <DateTimePicker
                    value={(activePicker === 'start' ? startDate : endDate) ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    locale="ar"
                    minimumDate={activePicker === 'end' && startDate ? startDate : undefined}
                    onChange={(_e, selected) => {
                      if (Platform.OS === 'android') setActivePicker(null);
                      if (!selected) return;
                      if (activePicker === 'start') {
                        setStartDate(selected);
                        if (endDate && endDate < selected) setEndDate(selected);
                      } else {
                        setEndDate(selected);
                      }
                    }}
                  />
                ) : null}
                {activePicker && Platform.OS === 'ios' ? (
                  <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setActivePicker(null)}>
                    <Text style={styles.pickerDoneText}>تم</Text>
                  </TouchableOpacity>
                ) : null}

                {datesMode === 'flexible' ? (
                  <>
                    <Text style={styles.subLabel}>الشهر</Text>
                    <RtlScrollRow contentContainerStyle={styles.chipsRowScroll}>
                      {MONTH_NAMES.map((m, i) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, flexibleMonthIndex === i && styles.chipActive]}
                          activeOpacity={0.8}
                          onPress={() => setFlexibleMonthIndex(i)}
                        >
                          <Text style={[styles.chipText, flexibleMonthIndex === i && styles.chipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </RtlScrollRow>
                    <Text style={styles.subLabel}>عدد الأيام</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => setFlexibleDays((d) => Math.max(1, d - 1))}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{flexibleDays}</Text>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => setFlexibleDays((d) => Math.min(30, d + 1))}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}

                {(datesMode === 'vote' ||
                  (datesMode === 'exact' && startDate && endDate) ||
                  (datesMode === 'flexible' && flexibleMonthIndex !== null)) ? (
                  <TouchableOpacity style={styles.confirmStepButton} activeOpacity={0.85} onPress={() => setStep(3)}>
                    <Text style={styles.confirmStepText}>التالي</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {/* Step 3: مين معك؟ */}
        {destination && datesMode ? (
          <View style={styles.questionCard}>
            <TouchableOpacity
              style={styles.questionHeader}
              activeOpacity={travelerType ? 0.7 : 1}
              onPress={() => travelerType && setStep(3)}
            >
              <Text style={styles.questionTitle}>٣. مين معك؟</Text>
              {travelerType ? <Ionicons name="pencil" size={15} color={colors.textMuted} /> : null}
            </TouchableOpacity>

            {travelerType && step !== 3 ? (
              <View style={styles.summaryChip}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.summaryChipText}>{whoSummary}</Text>
              </View>
            ) : (
              <>
                <View style={styles.whoGrid}>
                  {TRAVELER_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.whoCard, travelerType === t && styles.optionCardActive]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setTravelerType(t);
                        setShowInviteList(t === 'group');
                      }}
                    >
                      <Text style={[styles.optionCardText, travelerType === t && styles.optionCardTextActive]}>
                        {TRAVELER_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {travelerType === 'family' ? (
                  <View style={styles.chipsWrap}>
                    {NEEDS.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.chip, needs.includes(n) && styles.chipActive]}
                        activeOpacity={0.8}
                        onPress={() => toggleNeed(n)}
                      >
                        <Text style={[styles.chipText, needs.includes(n) && styles.chipTextActive]}>{TRIP_NEED_LABELS[n]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {travelerType === 'group' ? (
                  <>
                    <TouchableOpacity
                      style={styles.helpLink}
                      activeOpacity={0.7}
                      onPress={() => setShowInviteList((v) => !v)}
                    >
                      <Ionicons name="person-add-outline" size={14} color={colors.primary} />
                      <Text style={styles.helpLinkText}>ادعُ الشلة الحين</Text>
                    </TouchableOpacity>
                    {showInviteList ? (
                      <View style={styles.friendsList}>
                        {friends.length === 0 ? (
                          <Text style={styles.emptyMuted}>ما عندك أصدقاء مضافين بعد</Text>
                        ) : (
                          friends.map((friend) => {
                            const selected = selectedFriendIds.includes(friend.id);
                            return (
                              <TouchableOpacity
                                key={friend.id}
                                style={[styles.friendRow, selected && styles.friendRowActive]}
                                activeOpacity={0.8}
                                onPress={() => toggleFriend(friend.id)}
                              >
                                <PersonAvatar avatarUrl={friend.avatarUrl} size={32} />
                                <Text style={styles.friendName}>{friend.name}</Text>
                                <Ionicons
                                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                                  size={18}
                                  color={selected ? colors.primary : colors.textFaint}
                                />
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    ) : null}
                  </>
                ) : null}

                {travelerType ? (
                  <TouchableOpacity style={styles.confirmStepButton} activeOpacity={0.85} onPress={() => setStep(4)}>
                    <Text style={styles.confirmStepText}>تم</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.suggestRow} activeOpacity={0.8} onPress={() => setSuggestItinerary((v) => !v)}>
          <Ionicons name={suggestItinerary ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
          <Text style={styles.suggestText}>خل الدليل يقترح جدول مبدئي</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleCreate}
        >
          <Text style={styles.submitText}>{creating ? 'جاري الإنشاء...' : 'سوّ الرحلة'}</Text>
        </TouchableOpacity>
      </View>
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
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  progressRow: { flexDirection: 'row-reverse', gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressSegmentActive: { backgroundColor: colors.primary },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  questionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  questionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  questionTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  summaryChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryChipText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.bodyLg,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  resultsList: { gap: spacing.xs },
  resultRow: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultRowText: { color: colors.text, fontSize: fontSize.body, fontWeight: '600', textAlign: 'right' },
  subLabel: { color: colors.textMuted, fontSize: fontSize.base, fontWeight: '600', textAlign: 'right', marginTop: spacing.sm, marginBottom: spacing.xs },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chipsRowScroll: { flexDirection: 'row-reverse', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  helpLink: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, alignSelf: 'flex-end' },
  helpLinkText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700' },
  optionsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.sm },
  optionCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionCardText: { color: colors.text, fontSize: fontSize.base, fontWeight: '700', textAlign: 'center' },
  optionCardTextActive: { color: colors.textOnPrimary },
  dateRow: { flexDirection: 'row-reverse', gap: spacing.md },
  dateField: { flex: 1 },
  dateValue: { color: colors.text, fontSize: fontSize.bodyLg, textAlign: 'right' },
  datePlaceholder: { color: colors.textFaint, fontSize: fontSize.bodyLg, textAlign: 'right' },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  pickerDoneText: { color: colors.textOnPrimary, fontSize: fontSize.body, fontWeight: '700' },
  stepperRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.lg, alignSelf: 'flex-end' },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  confirmStepButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmStepText: { color: colors.textOnPrimary, fontSize: fontSize.body, fontWeight: '700' },
  whoGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  whoCard: {
    width: '47%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  friendsList: { gap: spacing.sm, marginTop: spacing.md },
  friendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  friendRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  friendName: { flex: 1, color: colors.text, fontSize: fontSize.body, fontWeight: '600', textAlign: 'right' },
  emptyMuted: { color: colors.textFaint, fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.sm },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  suggestRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  suggestText: { color: colors.text, fontSize: fontSize.body, fontWeight: '600' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.bodyLg },
});

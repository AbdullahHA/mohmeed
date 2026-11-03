import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PersonAvatar from '../components/PersonAvatar';
import DayPicker, { tripDateRange, formatIsoDate } from '../components/DayPicker';
import SlotPicker, { SLOT_LABELS } from '../components/SlotPicker';
import { formatHijriDate } from '../lib/hijri';
import { getHijriDateEnabled } from '../lib/hijriSetting';
import CountryInfoCard from '../components/CountryInfoCard';
import { useContent } from '../context/ContentContext';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory, type ChecklistGroup, type ItinerarySlot } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type MemberProfile = { id: string; name: string; avatarUrl: string | null };
type TripMemberRole = 'organizer' | 'member' | 'viewer';
const ROLE_LABELS: Record<TripMemberRole, string> = { organizer: 'منظّم', member: 'عضو', viewer: 'مشاهد' };
const ROLE_CYCLE: Record<TripMemberRole, TripMemberRole> = { organizer: 'member', member: 'viewer', viewer: 'organizer' };
type Tab = 'schedule' | 'budget' | 'checklist';

const CATEGORIES: BudgetCategory[] = ['hotels', 'food', 'transport', 'activities', 'other'];
const CHECKLIST_GROUPS: ChecklistGroup[] = ['الحجوزات', 'الشنطة', 'الأوراق', 'أخرى'];
const SLOT_ORDER: ItinerarySlot[] = ['breakfast', 'morning', 'lunch', 'afternoon', 'dinner', 'evening'];

export default function TripDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { currency } = useRegion();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAuth();
  const { destinations } = useContent();
  const {
    trips,
    friends,
    addMember,
    addBudgetItem,
    removeBudgetItem,
    addItineraryItem,
    removeItineraryItem,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
  } = useAppState();

  const trip = trips.find((t) => t.id === route.params.tripId);

  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [showInvite, setShowInvite] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, TripMemberRole>>({});
  const [hijriEnabled, setHijriEnabled] = useState(false);

  useEffect(() => {
    getHijriDateEnabled().then(setHijriEnabled);
  }, []);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [itinTitle, setItinTitle] = useState('');
  const [itinSlot, setItinSlot] = useState<ItinerarySlot | null>(null);

  const [budgetCategory, setBudgetCategory] = useState<BudgetCategory>('hotels');
  const [budgetLabel, setBudgetLabel] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [checklistGroup, setChecklistGroup] = useState<ChecklistGroup>('أخرى');
  const [checklistTitle, setChecklistTitle] = useState('');

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id,name,avatar_url')
      .in('id', trip.memberIds)
      .then(({ data }) => {
        if (cancelled) return;
        setMembers((data ?? []).map((r: any) => ({ id: r.id, name: r.name, avatarUrl: r.avatar_url ?? null })));
      });
    supabase
      .from('trip_members')
      .select('profile_id,role')
      .eq('trip_id', trip.id)
      .then(({ data }) => {
        if (cancelled) return;
        const roles: Record<string, TripMemberRole> = { [trip.ownerId]: 'organizer' };
        for (const r of (data ?? []) as any[]) roles[r.profile_id] = r.role;
        setMemberRoles(roles);
      });
    return () => {
      cancelled = true;
    };
  }, [trip?.memberIds.join(',')]);

  const isOrganizer = memberRoles[profile?.id ?? ''] === 'organizer' || trip?.ownerId === profile?.id;
  const isViewer = memberRoles[profile?.id ?? ''] === 'viewer';

  const cycleMemberRole = async (memberId: string) => {
    if (!trip || memberId === trip.ownerId) return;
    const current = memberRoles[memberId] ?? 'member';
    const next = ROLE_CYCLE[current];
    const { error } = await supabase
      .from('trip_members')
      .update({ role: next })
      .eq('trip_id', trip.id)
      .eq('profile_id', memberId);
    if (!error) setMemberRoles((prev) => ({ ...prev, [memberId]: next }));
  };

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const tripDays = tripDateRange(trip.startDate, trip.endDate);
  const hasRealDates = tripDays.length > 0;

  const today = formatIsoDate(new Date());
  const daysUntil = hasRealDates ? Math.ceil((tripDays[0].getTime() - new Date(today).getTime()) / 86400000) : null;
  const countdownLabel =
    daysUntil === null
      ? null
      : daysUntil > 0
        ? `بعد ${daysUntil} يوم`
        : daysUntil === 0
          ? 'تبدأ اليوم'
          : today > formatIsoDate(tripDays[tripDays.length - 1])
            ? 'انتهت'
            : 'جارية الآن';

  const invitableFriends = friends.filter((f) => !trip.memberIds.includes(f.id));

  const memberName = (id: string) => (id === profile?.id ? 'أنت' : members.find((m) => m.id === id)?.name ?? 'عضو');

  const spent = trip.budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const perPerson = members.length > 0 ? Math.ceil(spent / members.length) : spent;
  const spentRatio = trip.budgetTotal > 0 ? Math.max(0, Math.min(spent / trip.budgetTotal, 1)) : 0;

  const visibleItinerary = selectedDay
    ? trip.itinerary.filter((i) => i.itemDate === selectedDay)
    : trip.itinerary;
  const undated = trip.itinerary.filter((i) => !i.itemDate);

  const handleAddBudgetItem = () => {
    const amount = Number(budgetAmount);
    if (!budgetLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
    addBudgetItem(trip.id, {
      category: budgetCategory,
      label: budgetLabel.trim(),
      amount,
      paidBy: profile?.id ?? null,
      splitBetween: trip.memberIds,
    });
    setBudgetLabel('');
    setBudgetAmount('');
  };

  const handleAddItinerary = () => {
    if (!itinTitle.trim()) return;
    addItineraryItem(trip.id, {
      day: selectedDay ?? 'غير محدد',
      time: itinSlot ? SLOT_LABELS[itinSlot] : '—',
      title: itinTitle.trim(),
      itemDate: selectedDay,
      slot: itinSlot,
      placeId: null,
      kind: 'place',
    });
    setItinTitle('');
    setItinSlot(null);
  };

  const handleAddChecklist = () => {
    if (!checklistTitle.trim()) return;
    addChecklistItem(trip.id, { group: checklistGroup, title: checklistTitle.trim(), assigneeId: null, dueDate: null });
    setChecklistTitle('');
  };

  const handleShare = () => {
    Share.share({
      message: `رحلة ${trip.title} إلى ${trip.destination}\n${trip.startDate} → ${trip.endDate}\n\nرمز دعوة الرحلة: ${trip.shareCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={trip.coverImage} style={styles.image} />
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.glassButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.glassGroup}>
              <TouchableOpacity style={styles.glassButton} activeOpacity={0.85} onPress={() => setShowInvite((v) => !v)}>
                <Ionicons name="person-add-outline" size={17} color={colors.textOnPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassButton} activeOpacity={0.85} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={17} color={colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{trip.title}</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {trip.destination} · {trip.startDate} → {trip.endDate}
            </Text>
            {countdownLabel ? (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdownLabel}</Text>
              </View>
            ) : null}
          </View>

          {hijriEnabled && hasRealDates
            ? (() => {
                const hijriStart = formatHijriDate(tripDays[0]);
                const hijriEnd = formatHijriDate(tripDays[tripDays.length - 1]);
                if (!hijriStart || !hijriEnd) return null;
                return <Text style={styles.hijriSubtitle}>{hijriStart} → {hijriEnd}</Text>;
              })()
            : null}

          {countdownLabel === 'انتهت' ? (
            <TouchableOpacity
              style={styles.summaryBanner}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TripSummary', { tripId: trip.id })}
            >
              <Ionicons name="sparkles-outline" size={16} color={colors.accentDark} />
              <Text style={styles.summaryBannerText}>شوف ملخص الرحلة</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.membersRow}>
            {members.map((member) => {
              const role = memberRoles[member.id] ?? 'member';
              const canCycle = isOrganizer && member.id !== trip.ownerId;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberChip}
                  activeOpacity={canCycle ? 0.7 : 1}
                  disabled={!canCycle}
                  onPress={() => cycleMemberRole(member.id)}
                >
                  <PersonAvatar avatarUrl={member.avatarUrl} size={36} />
                  <Text style={styles.memberName} numberOfLines={1}>{member.id === profile?.id ? 'أنت' : member.name}</Text>
                  <Text style={styles.memberRoleText}>{ROLE_LABELS[role]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showInvite ? (
            <View style={styles.inviteList}>
              {invitableFriends.length === 0 ? (
                <Text style={styles.emptyMuted}>كل أصدقائك منضمين للرحلة بالفعل</Text>
              ) : (
                invitableFriends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.inviteRow}
                    activeOpacity={0.8}
                    onPress={() => addMember(trip.id, friend.id)}
                  >
                    <Text style={styles.inviteRowName}>{friend.name}</Text>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))
              )}
              <View style={styles.shareCodeCard}>
                <Ionicons name="key-outline" size={16} color={colors.primary} />
                <Text style={styles.shareCodeText}>رمز دعوة الرحلة: {trip.shareCode}</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('GroupChat', { tripId: trip.id })}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={colors.textOnPrimary} />
            <Text style={styles.chatButtonText}>الشلة · محادثة المجموعة</Text>
          </TouchableOpacity>

          <View style={styles.tabsRow}>
            {([
              ['schedule', 'الجدول'],
              ['budget', 'الميزانية'],
              ['checklist', 'التجهيز'],
            ] as const).map(([tab, label]) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'schedule' ? (
            <View>
              {hasRealDates ? (
                <DayPicker days={tripDays} selected={selectedDay} onSelect={setSelectedDay} />
              ) : trip.datesMode === 'vote' ? (
                <TouchableOpacity
                  style={styles.noDatesBanner}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TripDatesVote', { tripId: trip.id })}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.noDatesText}>الشلة لسا تصوّت على التواريخ — اضغط هنا للمشاركة</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noDatesBanner}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.noDatesText}>حدد تواريخ الرحلة عشان نرتب لك الجدول بالأيام</Text>
                </View>
              )}

              <View style={styles.itineraryCard}>
                {visibleItinerary.length === 0 ? (
                  <Text style={styles.emptyMuted}>ما فيه شي بالجدول لهذا اليوم بعد</Text>
                ) : (
                  SLOT_ORDER.map((slot) => {
                    const items = visibleItinerary.filter((i) => i.slot === slot);
                    if (items.length === 0) return null;
                    return (
                      <View key={slot}>
                        <Text style={styles.slotHeading}>{SLOT_LABELS[slot]}</Text>
                        {items.map((item) => (
                          <View key={item.id} style={styles.itineraryRow}>
                            <TouchableOpacity onPress={() => removeItineraryItem(trip.id, item.id)} activeOpacity={0.7}>
                              <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                            </TouchableOpacity>
                            <View style={styles.itineraryTextWrap}>
                              <Text style={styles.itineraryTitle}>{item.title}</Text>
                              <Text style={styles.itineraryMeta}>
                                {item.addedBy ? `أضافه ${memberName(item.addedBy)}` : ''}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
                {visibleItinerary.filter((i) => !i.slot).map((item) => (
                  <View key={item.id} style={styles.itineraryRow}>
                    <TouchableOpacity onPress={() => removeItineraryItem(trip.id, item.id)} activeOpacity={0.7}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                    </TouchableOpacity>
                    <View style={styles.itineraryTextWrap}>
                      <Text style={styles.itineraryTitle}>{item.title}</Text>
                      <Text style={styles.itineraryMeta}>{item.addedBy ? `أضافه ${memberName(item.addedBy)}` : ''}</Text>
                    </View>
                  </View>
                ))}

                {!selectedDay && undated.length > 0 ? (
                  <Text style={styles.emptyMuted}>{undated.length} عنصر بدون يوم محدد (ظاهر أعلاه)</Text>
                ) : null}

                {!isViewer ? (
                  <View style={styles.addItinerarySection}>
                    <SlotPicker value={itinSlot} onChange={setItinSlot} />
                    <View style={styles.addRow}>
                      <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddItinerary}>
                        <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.miniInput, styles.flex1]}
                        placeholder="مثال: غداء بمطعم محلي"
                        placeholderTextColor={colors.textFaint}
                        value={itinTitle}
                        onChangeText={setItinTitle}
                        textAlign="right"
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {activeTab === 'budget' ? (
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeaderRow}>
                <Text style={styles.budgetSpent}>
                  {spent.toLocaleString()} من {trip.budgetTotal.toLocaleString()} {currency.symbol}
                </Text>
                <Text style={styles.budgetPerPerson}>نصيب الفرد: {perPerson.toLocaleString()} {currency.symbol}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${spentRatio * 100}%` }]} />
              </View>

              {trip.budgetItems.map((item) => (
                <View key={item.id} style={styles.budgetItemRow}>
                  <TouchableOpacity onPress={() => removeBudgetItem(trip.id, item.id)} activeOpacity={0.7}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                  <Text style={styles.budgetItemAmount}>{item.amount.toLocaleString()} {currency.symbol}</Text>
                  <View style={styles.budgetItemTextWrap}>
                    <Text style={styles.budgetItemLabel}>{item.label}</Text>
                    <Text style={styles.budgetItemCategory}>
                      {BUDGET_CATEGORY_LABELS[item.category]}
                      {item.paidBy ? ` · دفعه ${memberName(item.paidBy)}` : ''}
                    </Text>
                  </View>
                </View>
              ))}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, budgetCategory === cat && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setBudgetCategory(cat)}
                  >
                    <Text style={[styles.chipText, budgetCategory === cat && styles.chipTextActive]}>
                      {BUDGET_CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!isViewer ? (
                <View style={styles.addRow}>
                  <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddBudgetItem}>
                    <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.miniInput, styles.amountInput]}
                    placeholder="المبلغ"
                    placeholderTextColor={colors.textFaint}
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    keyboardType="numeric"
                    textAlign="right"
                  />
                  <TextInput
                    style={[styles.miniInput, styles.flex1]}
                    placeholder="مثال: فندق الليلة الأولى"
                    placeholderTextColor={colors.textFaint}
                    value={budgetLabel}
                    onChangeText={setBudgetLabel}
                    textAlign="right"
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {activeTab === 'checklist' ? (
            <View>
              <CountryInfoCard
                country={destinations.find((d) => d.name === trip.destination)?.country ?? ''}
                onInfoLoaded={(info) => {
                  if (
                    info.visaStatus === 'required' &&
                    !trip.checklist.some((c) => c.title.includes('تأشيرة'))
                  ) {
                    addChecklistItem(trip.id, { group: 'الأوراق', title: 'تقديم التأشيرة قبل 14 يوم', assigneeId: null, dueDate: null });
                  }
                }}
              />
              <View style={styles.checklistCard}>
              {CHECKLIST_GROUPS.map((group) => {
                const items = trip.checklist.filter((c) => c.group === group);
                if (items.length === 0) return null;
                const done = items.filter((i) => i.done).length;
                return (
                  <View key={group} style={styles.checklistGroupWrap}>
                    <Text style={styles.slotHeading}>{group} · {done}/{items.length}</Text>
                    {items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.checklistRow}
                        activeOpacity={0.7}
                        onPress={() => toggleChecklistItem(trip.id, item.id)}
                      >
                        <Ionicons
                          name={item.done ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={item.done ? colors.success : colors.textFaint}
                        />
                        <Text style={[styles.checklistTitle, item.done && styles.checklistTitleDone]}>{item.title}</Text>
                        <TouchableOpacity onPress={() => removeChecklistItem(trip.id, item.id)} activeOpacity={0.7}>
                          <Ionicons name="close" size={16} color={colors.textFaint} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
              {trip.checklist.length === 0 ? <Text style={styles.emptyMuted}>ما فيه مهام تجهيز بعد</Text> : null}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {CHECKLIST_GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, checklistGroup === g && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setChecklistGroup(g)}
                  >
                    <Text style={[styles.chipText, checklistGroup === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!isViewer ? (
                <View style={styles.addRow}>
                  <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddChecklist}>
                    <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.miniInput, styles.flex1]}
                    placeholder="مثال: احجز الفندق"
                    placeholderTextColor={colors.textFaint}
                    value={checklistTitle}
                    onChangeText={setChecklistTitle}
                    textAlign="right"
                  />
                </View>
              ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  imageWrap: { width: '100%', height: 190 },
  image: { width: '100%', height: '100%' },
  headerRow: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassGroup: { flexDirection: 'row-reverse', gap: spacing.sm },
  body: { padding: spacing.xl },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  subtitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: 4, marginBottom: spacing.md },
  hijriSubtitle: { color: colors.textFaint, fontSize: 11.5, textAlign: 'right', marginTop: -4, marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  countdownBadge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  summaryBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-end',
  },
  summaryBannerText: { color: colors.accentDark, fontSize: 12.5, fontWeight: '700' },
  countdownText: { color: colors.accentDark, fontSize: 11, fontWeight: '700' },
  membersRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  memberChip: { alignItems: 'center', width: 52 },
  memberName: { color: colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  memberRoleText: { color: colors.textFaint, fontSize: 9, textAlign: 'center' },
  inviteList: { marginBottom: spacing.md, gap: spacing.xs },
  inviteRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  inviteRowName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  emptyMuted: { color: colors.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: spacing.sm },
  chatButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  chatButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  tabsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: colors.text },
  tabText: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  tabTextActive: { color: colors.background },
  noDatesBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noDatesText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  slotHeading: { color: colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'right', marginTop: spacing.sm, marginBottom: 4 },
  budgetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  budgetHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing.xs },
  budgetSpent: { color: colors.text, fontSize: 13, fontWeight: '700' },
  budgetPerPerson: { color: colors.accentDark, fontSize: 12, fontWeight: '600' },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  budgetItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  budgetItemAmount: { color: colors.text, fontSize: 13, fontWeight: '700' },
  budgetItemTextWrap: { flex: 1 },
  budgetItemLabel: { color: colors.text, fontSize: 13, textAlign: 'right' },
  budgetItemCategory: { color: colors.textFaint, fontSize: 11, textAlign: 'right' },
  chipsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  addRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 12,
  },
  flex1: { flex: 1 },
  amountInput: { width: 90 },
  itineraryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  itineraryRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  itineraryTextWrap: { flex: 1 },
  itineraryTitle: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  itineraryMeta: { color: colors.textFaint, fontSize: 11, textAlign: 'right' },
  addItinerarySection: { gap: spacing.sm, marginTop: spacing.sm },
  checklistCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checklistGroupWrap: { marginBottom: spacing.sm },
  checklistRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  checklistTitle: { color: colors.text, fontSize: 13, textAlign: 'right', flex: 1 },
  checklistTitleDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
  shareCodeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  shareCodeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
});

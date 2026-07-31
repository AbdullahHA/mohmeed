import React, { useState } from 'react';
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
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: BudgetCategory[] = ['hotels', 'food', 'transport', 'activities', 'other'];

export default function TripDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {
    trips,
    friends,
    currentUser,
    addMember,
    addBudgetItem,
    removeBudgetItem,
    addItineraryItem,
    removeItineraryItem,
  } = useAppState();

  const trip = trips.find((t) => t.id === route.params.tripId);

  const [showInvite, setShowInvite] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<BudgetCategory>('hotels');
  const [budgetLabel, setBudgetLabel] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [itinDay, setItinDay] = useState('');
  const [itinTime, setItinTime] = useState('');
  const [itinTitle, setItinTitle] = useState('');

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const members = trip.memberIds.map((id) =>
    id === 'me' ? currentUser : friends.find((f) => f.id === id)
  ).filter((f): f is NonNullable<typeof f> => Boolean(f));

  const invitableFriends = friends.filter((f) => !trip.memberIds.includes(f.id));

  const spent = trip.budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const perPerson = members.length > 0 ? Math.ceil(spent / members.length) : spent;
  const spentRatio = trip.budgetTotal > 0 ? Math.min(spent / trip.budgetTotal, 1) : 0;

  const handleAddBudgetItem = () => {
    const amount = Number(budgetAmount);
    if (!budgetLabel.trim() || !amount) return;
    addBudgetItem(trip.id, { category: budgetCategory, label: budgetLabel.trim(), amount });
    setBudgetLabel('');
    setBudgetAmount('');
  };

  const handleAddItinerary = () => {
    if (!itinDay.trim() || !itinTitle.trim()) return;
    addItineraryItem(trip.id, { day: itinDay.trim(), time: itinTime.trim() || '—', title: itinTitle.trim() });
    setItinDay('');
    setItinTime('');
    setItinTitle('');
  };

  const handleShare = () => {
    const itineraryText = trip.itinerary
      .map((i) => `• ${i.day} - ${i.time}: ${i.title}`)
      .join('\n');
    Share.share({
      message: `رحلة ${trip.title} إلى ${trip.destination}\n${trip.startDate} → ${trip.endDate}\n\nالجدول:\n${itineraryText || 'لم تتم إضافة جدول بعد'}\n\nرمز الانضمام: ${trip.shareCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: trip.coverImage }} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.subtitle}>
            {trip.destination} · {trip.startDate} → {trip.endDate}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('GroupChat', { tripId: trip.id })}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.actionPrimaryText}>محادثة المجموعة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={16} color={colors.text} />
              <Text style={styles.actionText}>مشاركة</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>الأعضاء</Text>
          <View style={styles.membersRow}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberChip}>
                <View style={[styles.memberAvatar, { backgroundColor: member.color }]}>
                  <Text style={styles.memberEmoji}>{member.emoji}</Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.inviteButton}
              activeOpacity={0.85}
              onPress={() => setShowInvite((v) => !v)}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.inviteButtonText}>دعوة</Text>
            </TouchableOpacity>
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
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>الميزانية</Text>
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeaderRow}>
              <Text style={styles.budgetSpent}>
                {spent.toLocaleString()} من {trip.budgetTotal.toLocaleString()} ر.س
              </Text>
              <Text style={styles.budgetPerPerson}>نصيب الفرد: {perPerson.toLocaleString()} ر.س</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${spentRatio * 100}%` }]} />
            </View>

            {trip.budgetItems.map((item) => (
              <View key={item.id} style={styles.budgetItemRow}>
                <TouchableOpacity onPress={() => removeBudgetItem(trip.id, item.id)} activeOpacity={0.7}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                </TouchableOpacity>
                <Text style={styles.budgetItemAmount}>{item.amount.toLocaleString()} ر.س</Text>
                <View style={styles.budgetItemTextWrap}>
                  <Text style={styles.budgetItemLabel}>{item.label}</Text>
                  <Text style={styles.budgetItemCategory}>{BUDGET_CATEGORY_LABELS[item.category]}</Text>
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
          </View>

          <Text style={styles.sectionTitle}>جدول الرحلة</Text>
          <View style={styles.itineraryCard}>
            {trip.itinerary.length === 0 ? (
              <Text style={styles.emptyMuted}>لم تتم إضافة أي نشاط بعد</Text>
            ) : (
              trip.itinerary.map((item) => (
                <View key={item.id} style={styles.itineraryRow}>
                  <TouchableOpacity onPress={() => removeItineraryItem(trip.id, item.id)} activeOpacity={0.7}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                  <View style={styles.itineraryTextWrap}>
                    <Text style={styles.itineraryTitle}>{item.title}</Text>
                    <Text style={styles.itineraryMeta}>{item.day} · {item.time}</Text>
                  </View>
                </View>
              ))
            )}

            <View style={styles.addRow}>
              <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddItinerary}>
                <Ionicons name="add" size={18} color={colors.textOnPrimary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.miniInput, styles.timeInput]}
                placeholder="الوقت"
                placeholderTextColor={colors.textFaint}
                value={itinTime}
                onChangeText={setItinTime}
                textAlign="right"
              />
              <TextInput
                style={[styles.miniInput, styles.timeInput]}
                placeholder="اليوم"
                placeholderTextColor={colors.textFaint}
                value={itinDay}
                onChangeText={setItinDay}
                textAlign="right"
              />
              <TextInput
                style={[styles.miniInput, styles.flex1]}
                placeholder="النشاط"
                placeholderTextColor={colors.textFaint}
                value={itinTitle}
                onChangeText={setItinTitle}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.shareCodeCard}>
            <Ionicons name="key-outline" size={16} color={colors.primary} />
            <Text style={styles.shareCodeText}>رمز دعوة الرحلة: {trip.shareCode}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  imageWrap: { width: '100%', height: 220 },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.xl },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'right', marginTop: 4, marginBottom: spacing.lg },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.md, marginBottom: spacing.xl },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1, justifyContent: 'center' },
  actionPrimaryText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  actionText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm, marginTop: spacing.lg },
  membersRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  memberChip: { alignItems: 'center', width: 56 },
  memberAvatar: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  memberEmoji: { fontSize: 17 },
  memberName: { color: colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  inviteButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  inviteButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  inviteList: { marginTop: spacing.sm, gap: spacing.xs },
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
  timeInput: { width: 70 },
  itineraryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  itineraryRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  itineraryTextWrap: { flex: 1 },
  itineraryTitle: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  itineraryMeta: { color: colors.textFaint, fontSize: 11, textAlign: 'right' },
  shareCodeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  shareCodeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
});
